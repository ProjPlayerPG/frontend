import { createClient } from '@supabase/supabase-js'

function deleteStepError(step: string, message: string) {
  return Response.json({ error: `${step}: ${message}` }, { status: 500 })
}

export async function DELETE(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY doit etre configuree cote serveur.' },
      { status: 500 },
    )
  }

  if (!token) {
    return Response.json({ error: 'Session manquante.' }, { status: 401 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: userData, error: userError } = await admin.auth.getUser(token)

  if (userError || !userData.user) {
    return Response.json({ error: 'Session invalide.' }, { status: 401 })
  }

  const userId = userData.user.id

  const { data: avatarFiles, error: listAvatarError } = await admin.storage.from('avatars').list(userId)

  if (listAvatarError) {
    return deleteStepError('Lecture des avatars impossible', listAvatarError.message)
  }

  if (avatarFiles?.length) {
    const { error: removeAvatarError } = await admin.storage
      .from('avatars')
      .remove(avatarFiles.map((file) => `${userId}/${file.name}`))

    if (removeAvatarError) {
      return deleteStepError('Suppression des avatars impossible', removeAvatarError.message)
    }
  }

  // Les lignes profiles/favorites doivent disparaitre via les foreign keys ON DELETE CASCADE.
  // Cela evite de dependre des grants directs sur les tables publiques dans cette route.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false)

  if (deleteError) {
    return deleteStepError('Suppression du compte Auth impossible', deleteError.message)
  }

  const { error: profileCleanupError } = await admin.from('profiles').delete().eq('user_id', userId)

  if (profileCleanupError) {
    return deleteStepError('Nettoyage du profil impossible', profileCleanupError.message)
  }

  const { data: remainingProfile, error: remainingProfileError } = await admin
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (remainingProfileError) {
    return deleteStepError('Verification du profil impossible', remainingProfileError.message)
  }

  if (remainingProfile) {
    return deleteStepError(
      'Profil encore present',
      'verifie la foreign key profiles.user_id vers auth.users.id avec ON DELETE CASCADE.',
    )
  }

  return Response.json({ ok: true })
}
