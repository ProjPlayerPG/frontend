import { createClient } from '@supabase/supabase-js'

type AdminAction =
  | {
      action: 'updateRole'
      userId: string
      role: 'user' | 'admin'
    }
  | {
      action: 'reviewGlossaryEntry'
      entryId: string
      status: 'published' | 'rejected'
    }

function serverError(message: string, status = 500) {
  return Response.json({ error: message }, { status })
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY doit etre configuree cote serveur.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return { error: serverError('Session manquante.', 401) }
  }

  const admin = createAdminClient()
  const { data: userData, error: userError } = await admin.auth.getUser(token)

  if (userError || !userData.user) {
    return { error: serverError('Session invalide.', 401) }
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('user_id, role')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    return { error: serverError(profileError.message) }
  }

  if (profile?.role !== 'admin') {
    return { error: serverError('Acces reserve aux administrateurs.', 403) }
  }

  return { admin, userId: userData.user.id }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const admin = auth.admin
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('user_id, username, email, avatar_url, role, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      return serverError(profilesError.message)
    }

    const { data: entries, error: entriesError } = await admin
      .from('glossary_entries')
      .select('id, slug, title, short_description, detailed_description, status, author_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (entriesError) {
      return serverError(entriesError.message)
    }

    const entryIds = (entries ?? []).map((entry) => entry.id)
    const authorIds = Array.from(new Set((entries ?? []).map((entry) => entry.author_id).filter(Boolean)))

    const { data: games, error: gamesError } = entryIds.length
      ? await admin
          .from('glossary_entry_games')
          .select('id, glossary_entry_id, igdb_game_id, game_name, cover_url, sort_order')
          .in('glossary_entry_id', entryIds)
          .order('sort_order', { ascending: true })
      : { data: [], error: null }

    if (gamesError) {
      return serverError(gamesError.message)
    }

    const { data: authors, error: authorsError } = authorIds.length
      ? await admin.from('profiles').select('user_id, username, email').in('user_id', authorIds)
      : { data: [], error: null }

    if (authorsError) {
      return serverError(authorsError.message)
    }

    return Response.json({
      profiles: profiles ?? [],
      pendingEntries: entries ?? [],
      entryGames: games ?? [],
      authors: authors ?? [],
    })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Erreur admin inconnue.')
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const body = (await request.json()) as AdminAction
    const admin = auth.admin

    if (body.action === 'updateRole') {
      if (!['user', 'admin'].includes(body.role)) {
        return serverError('Role invalide.', 400)
      }

      if (body.userId === auth.userId && body.role !== 'admin') {
        return serverError('Tu ne peux pas retirer ton propre role admin.', 400)
      }

      const { data, error } = await admin
        .from('profiles')
        .update({ role: body.role })
        .eq('user_id', body.userId)
        .select('user_id, username, email, avatar_url, role, created_at')
        .single()

      if (error) {
        return serverError(error.message)
      }

      return Response.json({ profile: data })
    }

    if (body.action === 'reviewGlossaryEntry') {
      if (!['published', 'rejected'].includes(body.status)) {
        return serverError('Statut invalide.', 400)
      }

      const { data, error } = await admin
        .from('glossary_entries')
        .update({
          status: body.status,
          reviewed_by: auth.userId,
          published_at: body.status === 'published' ? new Date().toISOString() : null,
        })
        .eq('id', body.entryId)
        .select('id, status')
        .single()

      if (error) {
        return serverError(error.message)
      }

      return Response.json({ entry: data })
    }

    return serverError('Action admin inconnue.', 400)
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Erreur admin inconnue.')
  }
}
