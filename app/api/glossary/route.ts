import { createSupabaseAdminClient } from '@/lib/server/supabaseAdmin'

type SourcePayload = {
  label?: string
  url?: string
}

type GamePayload = {
  igdb_game_id?: number
  game_name?: string
  cover_url?: string | null
}

type GlossaryPayload = {
  title?: string
  shortDescription?: string
  detailedDescription?: string
  sources?: SourcePayload[]
  games?: GamePayload[]
}

function serverError(message: string, status = 500) {
  return Response.json({ error: message }, { status })
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function validateHttpsSource(value: string) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()

    if (url.protocol !== 'https:') return 'Les sources doivent utiliser HTTPS.'
    if (hostname === 'localhost' || hostname.endsWith('.local')) return 'Les liens locaux ne sont pas autorises.'
    if (/^(127|10)\./.test(hostname)) return 'Les adresses privees ne sont pas autorisees.'
    if (/^192\.168\./.test(hostname)) return 'Les adresses privees ne sont pas autorisees.'
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return 'Les adresses privees ne sont pas autorisees.'
    if (hostname === '0.0.0.0' || hostname === '::1') return 'Les adresses locales ne sont pas autorisees.'
    if (value.length > 2048) return 'Cette URL est trop longue.'

    return ''
  } catch {
    return 'Chaque source doit etre une URL HTTPS valide.'
  }
}

async function findUniqueSlug(admin: ReturnType<typeof createSupabaseAdminClient>, baseSlug: string) {
  let candidate = baseSlug || 'entree'

  for (let index = 1; index < 50; index += 1) {
    const { data, error } = await admin
      .from('glossary_entries')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) throw error
    if (!data) return candidate

    candidate = `${baseSlug}-${index + 1}`
  }

  return `${baseSlug}-${Date.now()}`
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return serverError('Connecte-toi pour proposer une entree.', 401)
    }

    const admin = createSupabaseAdminClient()
    const { data: userData, error: userError } = await admin.auth.getUser(token)

    if (userError || !userData.user) {
      return serverError('Session invalide.', 401)
    }

    const body = (await request.json()) as GlossaryPayload
    const title = body.title?.trim()
    const shortDescription = body.shortDescription?.trim()
    const detailedDescription = body.detailedDescription?.trim()

    if (!title || title.length > 90) {
      return serverError('Titre invalide.', 400)
    }

    if (!shortDescription || shortDescription.length > 220) {
      return serverError('Description courte invalide.', 400)
    }

    if (!detailedDescription || detailedDescription.length > 6000) {
      return serverError('Description avancee invalide.', 400)
    }

    const sources = (body.sources ?? [])
      .map((source) => ({
        label: source.label?.trim() || null,
        url: source.url?.trim() || '',
      }))
      .filter((source) => source.url)

    if (!sources.length) {
      return serverError('Au moins une source HTTPS est obligatoire.', 400)
    }

    const sourceError = sources.map((source) => validateHttpsSource(source.url)).find(Boolean)
    if (sourceError) {
      return serverError(sourceError, 400)
    }

    const uniqueUrls = new Set(sources.map((source) => source.url))
    if (uniqueUrls.size !== sources.length) {
      return serverError('Une source ne peut pas etre ajoutee plusieurs fois.', 400)
    }

    const games = (body.games ?? [])
      .filter((game) => Number.isFinite(game.igdb_game_id) && game.game_name?.trim())
      .slice(0, 6)
      .map((game, index) => ({
        igdb_game_id: Number(game.igdb_game_id),
        game_name: game.game_name?.trim().slice(0, 160),
        cover_url: game.cover_url ?? null,
        sort_order: index,
      }))

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (profileError) {
      return serverError(profileError.message)
    }

    const status = profile?.role === 'admin' ? 'published' : 'pending'
    const slug = await findUniqueSlug(admin, slugify(title))

    const { data: entry, error: entryError } = await admin
      .from('glossary_entries')
      .insert({
        slug,
        title,
        short_description: shortDescription,
        detailed_description: detailedDescription,
        status,
        author_id: userData.user.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select('id, slug, status')
      .single()

    if (entryError) {
      return serverError(entryError.message)
    }

    const sourceRows = sources.map((source) => ({
      glossary_entry_id: entry.id,
      label: source.label,
      url: source.url,
    }))

    const { error: sourcesError } = await admin.from('glossary_entry_sources').insert(sourceRows)

    if (sourcesError) {
      await admin.from('glossary_entries').delete().eq('id', entry.id)
      return serverError(sourcesError.message)
    }

    if (games.length) {
      const { error: gamesError } = await admin.from('glossary_entry_games').insert(
        games.map((game) => ({
          ...game,
          glossary_entry_id: entry.id,
        })),
      )

      if (gamesError) {
        await admin.from('glossary_entries').delete().eq('id', entry.id)
        return serverError(gamesError.message)
      }
    }

    return Response.json({
      id: entry.id,
      slug: entry.slug,
      status: entry.status,
    })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Impossible de creer cette entree.')
  }
}
