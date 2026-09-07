import { createClient } from '@supabase/supabase-js'
import { slugify } from '@/lib/glossaryValidation'
import { normalizeGlossaryTagName, validateGlossaryTagIds } from '@/lib/glossaryTags'

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
  | {
      action: 'createGlossaryTag'
      name: string
    }
  | {
      action: 'updateGlossaryEntryTags'
      entryId: string
      tagIds: unknown
    }

function serverError(message: string, status = 500) {
  return Response.json({ error: message }, { status })
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY doit être configurée côté serveur.')
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
    return { error: serverError('Accès réservé aux administrateurs.', 403) }
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
      .order('created_at', { ascending: false })

    if (entriesError) {
      return serverError(entriesError.message)
    }

    const entryIds = (entries ?? []).map((entry) => entry.id)
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

    const { data: sources, error: sourcesError } = entryIds.length
      ? await admin
          .from('glossary_entry_sources')
          .select('id, glossary_entry_id, label, url')
          .in('glossary_entry_id', entryIds)
          .order('created_at', { ascending: true })
      : { data: [], error: null }

    if (sourcesError) {
      return serverError(sourcesError.message)
    }

    const [{ data: glossaryTags, error: glossaryTagsError }, { data: entryTags, error: entryTagsError }] =
      await Promise.all([
        admin
          .from('glossary_tags')
          .select('id, slug, name')
          .order('name', { ascending: true }),
        entryIds.length
          ? admin
              .from('glossary_entry_tags')
              .select('glossary_entry_id, tag_id')
              .in('glossary_entry_id', entryIds)
          : Promise.resolve({ data: [], error: null }),
      ])

    if (glossaryTagsError) {
      return serverError(glossaryTagsError.message)
    }

    if (entryTagsError) {
      return serverError(entryTagsError.message)
    }

    const pendingEntries = (entries ?? [])
      .filter((entry) => entry.status === 'pending')
      .sort((first, second) => first.created_at.localeCompare(second.created_at))

    return Response.json({
      profiles: profiles ?? [],
      pendingEntries,
      allEntries: entries ?? [],
      entryGames: games ?? [],
      entrySources: sources ?? [],
      glossaryTags: glossaryTags ?? [],
      entryTags: entryTags ?? [],
      authors: profiles ?? [],
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
        return serverError('Rôle invalide.', 400)
      }

      if (body.userId === auth.userId && body.role !== 'admin') {
        return serverError('Tu ne peux pas retirer ton propre rôle admin.', 400)
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

      if (body.status === 'published') {
        const { count, error: tagsCountError } = await admin
          .from('glossary_entry_tags')
          .select('*', { count: 'exact', head: true })
          .eq('glossary_entry_id', body.entryId)

        if (tagsCountError) return serverError(tagsCountError.message)
        if (!count) return serverError('Ajoute au moins un tag avant de publier cette entrée.', 400)
      }

      const { data, error } = await admin
        .from('glossary_entries')
        .update({
          status: body.status,
          reviewed_by: auth.userId,
          published_at: body.status === 'published' ? new Date().toISOString() : null,
        })
        .eq('id', body.entryId)
        .select('id, slug, title, status, author_id')
        .single()

      if (error) {
        return serverError(error.message)
      }

      const notificationPayload =
        body.status === 'published'
          ? {
              user_id: data.author_id,
              type: 'glossary_published',
              title: 'Publication acceptée',
              message: `Ton entrée "${data.title}" est maintenant visible dans le glossaire.`,
              href: `/glossaire/${data.slug}`,
            }
          : {
              user_id: data.author_id,
              type: 'glossary_rejected',
              title: 'Publication refusée',
              message: `Ton entrée "${data.title}" n'a pas été publiée pour le moment.`,
              href: '/glossaire/proposer',
            }

      const { error: notificationError } = await admin.from('notifications').insert(notificationPayload)

      return Response.json({
        entry: data,
        notificationWarning: notificationError?.message ?? null,
      })
    }

    if (body.action === 'createGlossaryTag') {
      const name = normalizeGlossaryTagName(typeof body.name === 'string' ? body.name : '')
      const slug = slugify(name)

      if (name.length < 2 || name.length > 30 || !slug || slug.length > 50) {
        return serverError('Le nom du tag doit contenir entre 2 et 30 caractères.', 400)
      }

      const { data: existingTag, error: existingTagError } = await admin
        .from('glossary_tags')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existingTagError) {
        return serverError(existingTagError.message)
      }

      if (existingTag) {
        return serverError('Ce tag existe déjà.', 409)
      }

      const { data, error } = await admin
        .from('glossary_tags')
        .insert({ name, slug })
        .select('id, slug, name')
        .single()

      if (error) {
        return serverError(error.message)
      }

      return Response.json({ tag: data })
    }

    if (body.action === 'updateGlossaryEntryTags') {
      if (typeof body.entryId !== 'string' || !body.entryId.trim()) {
        return serverError('Publication invalide.', 400)
      }

      const { tagIds, error: tagSelectionError } = validateGlossaryTagIds(body.tagIds)

      if (tagSelectionError) {
        return serverError(tagSelectionError, 400)
      }

      const [{ data: entry, error: entryError }, { data: knownTags, error: knownTagsError }] =
        await Promise.all([
          admin.from('glossary_entries').select('id').eq('id', body.entryId).maybeSingle(),
          admin.from('glossary_tags').select('id').in('id', tagIds),
        ])

      if (entryError) return serverError(entryError.message)
      if (!entry) return serverError('Publication introuvable.', 404)
      if (knownTagsError) return serverError(knownTagsError.message)
      if ((knownTags ?? []).length !== tagIds.length) {
        return serverError('Un ou plusieurs tags sont invalides.', 400)
      }

      const { data: currentRows, error: currentRowsError } = await admin
        .from('glossary_entry_tags')
        .select('tag_id')
        .eq('glossary_entry_id', body.entryId)

      if (currentRowsError) return serverError(currentRowsError.message)

      const currentTagIds = (currentRows ?? []).map((row) => row.tag_id as string)
      const addedTagIds = tagIds.filter((tagId) => !currentTagIds.includes(tagId))
      const removedTagIds = currentTagIds.filter((tagId) => !tagIds.includes(tagId))

      if (addedTagIds.length) {
        const { error } = await admin.from('glossary_entry_tags').insert(
          addedTagIds.map((tagId) => ({
            glossary_entry_id: body.entryId,
            tag_id: tagId,
          })),
        )

        if (error) return serverError(error.message)
      }

      if (removedTagIds.length) {
        const { error } = await admin
          .from('glossary_entry_tags')
          .delete()
          .eq('glossary_entry_id', body.entryId)
          .in('tag_id', removedTagIds)

        if (error) {
          if (addedTagIds.length) {
            await admin
              .from('glossary_entry_tags')
              .delete()
              .eq('glossary_entry_id', body.entryId)
              .in('tag_id', addedTagIds)
          }
          return serverError(error.message)
        }
      }

      return Response.json({
        entryTags: tagIds.map((tagId) => ({
          glossary_entry_id: body.entryId,
          tag_id: tagId,
        })),
      })
    }

    return serverError('Action admin inconnue.', 400)
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Erreur admin inconnue.')
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const body = (await request.json()) as { entryId?: unknown; tagId?: unknown }

    if (typeof body.tagId === 'string' && body.tagId.trim()) {
      const { count, error: countError } = await auth.admin
        .from('glossary_entry_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', body.tagId)

      if (countError) return serverError(countError.message)
      if (count) {
        return serverError('Ce tag est encore utilisé. Retire-le des entrées avant de le supprimer.', 409)
      }

      const { data, error } = await auth.admin
        .from('glossary_tags')
        .delete()
        .eq('id', body.tagId)
        .select('id, name')
        .maybeSingle()

      if (error) return serverError(error.message)
      if (!data) return serverError('Tag introuvable.', 404)

      return Response.json({ tag: data })
    }

    if (typeof body.entryId !== 'string' || !body.entryId.trim()) {
      return serverError('Publication invalide.', 400)
    }

    const { data, error } = await auth.admin
      .from('glossary_entries')
      .delete()
      .eq('id', body.entryId)
      .select('id, title, status')
      .maybeSingle()

    if (error) {
      return serverError(error.message)
    }

    if (!data) {
      return serverError('Publication introuvable.', 404)
    }

    return Response.json({ entry: data })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Erreur admin inconnue.')
  }
}
