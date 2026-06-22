'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type AuthMode = 'signin' | 'signup' | 'forgot'

type Profile = {
  user_id: string
  username: string
  email: string
  avatar_url: string | null
  created_at: string
}

type Favorite = {
  id: string
  igdb_game_id: number
  game_name: string
  cover_url: string | null
  created_at: string
}

function profileErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('permission denied')) {
    return 'Supabase bloque la table profiles. Verifie les policies RLS de lecture, insertion et update.'
  }

  return error instanceof Error ? error.message : 'Impossible de charger le profil.'
}

function profileUsername(user: User) {
  const metadataUsername = user.user_metadata?.username

  if (typeof metadataUsername === 'string' && metadataUsername.trim()) {
    return metadataUsername.trim()
  }

  const emailPrefix = user.email?.split('@')[0]
  return emailPrefix ? `${emailPrefix}-${user.id.slice(0, 6)}` : `player-${user.id.slice(0, 8)}`
}

async function ensureProfile(user: User) {
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('user_id, username, email, avatar_url, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (selectError) {
    throw selectError
  }

  if (existingProfile) {
    return existingProfile as Profile
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      username: profileUsername(user),
      email: user.email ?? '',
      avatar_url: null,
    })
    .select('user_id, username, email, avatar_url, created_at')
    .single()

  if (insertError) {
    throw insertError
  }

  return createdProfile as Profile
}

export default function ProfileAuthPanel() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [profileUsernameInput, setProfileUsernameInput] = useState('')
  const [profileEmailInput, setProfileEmailInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  const currentUser = session?.user ?? null
  const isSignup = mode === 'signup'
  const isForgotPassword = mode === 'forgot'
  const displayUsername = profile?.username ?? currentUser?.user_metadata.username ?? 'Profil joueur'

  const memberSince = useMemo(() => {
    if (!profile?.created_at) {
      return 'Compte actif'
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(profile.created_at))
  }, [profile?.created_at])

  useEffect(() => {
    let active = true

    async function loadSession() {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (sessionError) {
        setError(sessionError.message)
        setLoading(false)
        return
      }

      setSession(data.session)

      if (data.session?.user) {
        try {
          setProfile(await ensureProfile(data.session.user))
        } catch (profileError) {
          setError(profileErrorMessage(profileError))
        }
      }

      setLoading(false)
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession)
      setMessage('')
      setError('')

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        setMessage('Choisis ton nouveau mot de passe.')
      }

      if (!nextSession?.user) {
        setProfile(null)
        return
      }

      try {
        setProfile(await ensureProfile(nextSession.user))
      } catch (profileError) {
        setError(profileErrorMessage(profileError))
      }
    })

    loadSession()

    if (window.location.search.includes('reset-password=1')) {
      setPasswordRecovery(true)
    }

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setProfileUsernameInput('')
      setProfileEmailInput('')
      setNewPassword('')
      setDeleteConfirmation('')
      setFavorites([])
      return
    }

    setProfileUsernameInput(profile?.username ?? profileUsername(currentUser))
    setProfileEmailInput(profile?.email ?? currentUser.email ?? '')
  }, [currentUser, profile])

  useEffect(() => {
    let active = true

    async function loadFavorites() {
      if (!currentUser) {
        return
      }

      setLoadingFavorites(true)
      const { data, error: favoritesError } = await supabase
        .from('favorites')
        .select('id, igdb_game_id, game_name, cover_url, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (!active) {
        return
      }

      if (favoritesError) {
        setError(favoritesError.message)
      } else {
        setFavorites((data ?? []) as Favorite[])
      }

      setLoadingFavorites(false)
    }

    loadFavorites()

    return () => {
      active = false
    }
  }, [currentUser])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      if (isSignup) {
        const cleanUsername = username.trim()

        if (!cleanUsername) {
          setError('Choisis un pseudo pour creer ton compte.')
          return
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: cleanUsername,
            },
          },
        })

        if (signupError) {
          throw signupError
        }

        if (data.session?.user) {
          setProfile(await ensureProfile(data.session.user))
          setMessage('Compte cree, tu es connecte.')
        } else {
          setMessage('Compte cree. Verifie tes emails pour confirmer ton inscription avant de te connecter.')
        }
      } else {
        const { error: signinError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signinError) {
          throw signinError
        }

        setMessage('Connexion reussie.')
      }

      setPassword('')
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const cleanEmail = forgotEmail.trim()

      if (!cleanEmail) {
        setError('Renseigne ton email pour recevoir le lien de reinitialisation.')
        return
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/profile?reset-password=1`,
      })

      if (resetError) {
        throw resetError
      }

      setMessage('Si un compte existe avec cet email, un lien de reinitialisation vient d etre envoye.')
    } catch (forgotError) {
      setError(forgotError instanceof Error ? forgotError.message : 'Impossible d envoyer le lien.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRecoveryPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResettingPassword(true)
    setError('')
    setMessage('')

    try {
      const cleanPassword = recoveryPassword.trim()

      if (cleanPassword.length < 6) {
        setError('Le nouveau mot de passe doit contenir au moins 6 caracteres.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword,
      })

      if (updateError) {
        throw updateError
      }

      setRecoveryPassword('')
      setPasswordRecovery(false)
      window.history.replaceState(null, '', '/profile')
      setMessage('Mot de passe mis a jour.')
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : 'Impossible de modifier le mot de passe.')
    } finally {
      setResettingPassword(false)
    }
  }

  async function handleSignOut() {
    setSubmitting(true)
    setError('')
    setMessage('')

    const { error: signoutError } = await supabase.auth.signOut()

    if (signoutError) {
      setError(signoutError.message)
    } else {
      setEmail('')
      setPassword('')
      setUsername('')
      setMessage('Tu es deconnecte.')
    }

    setSubmitting(false)
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file || !currentUser) {
      return
    }

    setUploadingAvatar(true)
    setError('')
    setMessage('')

    try {
      if (!file.type.startsWith('image/')) {
        setError('Choisis une image pour ton avatar.')
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        setError('Ton avatar doit faire moins de 2 Mo.')
        return
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
      const filePath = `${currentUser.id}/avatar.${extension}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', currentUser.id)
        .select('user_id, username, email, avatar_url, created_at')
        .single()

      if (updateError) {
        throw updateError
      }

      setProfile(updatedProfile as Profile)
      setMessage('Avatar mis a jour.')
    } catch (avatarError) {
      setError(profileErrorMessage(avatarError))
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentUser) {
      return
    }

    const cleanUsername = profileUsernameInput.trim()
    const cleanEmail = profileEmailInput.trim()
    const cleanPassword = newPassword.trim()

    if (!cleanUsername || !cleanEmail) {
      setError('Le pseudo et l email sont obligatoires.')
      return
    }

    setUpdatingProfile(true)
    setError('')
    setMessage('')

    try {
      const authUpdates: Parameters<typeof supabase.auth.updateUser>[0] = {
        data: {
          username: cleanUsername,
        },
      }

      if (cleanEmail !== currentUser.email) {
        authUpdates.email = cleanEmail
      }

      if (cleanPassword) {
        authUpdates.password = cleanPassword
      }

      const { data: authData, error: authError } = await supabase.auth.updateUser(authUpdates)

      if (authError) {
        throw authError
      }

      const nextEmail = authData.user.email ?? cleanEmail
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          email: nextEmail,
        })
        .eq('user_id', currentUser.id)
        .select('user_id, username, email, avatar_url, created_at')
        .single()

      if (updateError) {
        throw updateError
      }

      setProfile(updatedProfile as Profile)
      setNewPassword('')
      setMessage(
        cleanEmail !== currentUser.email
          ? 'Profil mis a jour. Verifie tes emails si Supabase demande une confirmation.'
          : 'Profil mis a jour.',
      )
    } catch (updateError) {
      setError(profileErrorMessage(updateError))
    } finally {
      setUpdatingProfile(false)
    }
  }

  async function handleDeleteAccount() {
    if (!session || deleteConfirmation !== 'SUPPRIMER') {
      setError('Tape SUPPRIMER pour confirmer la suppression du compte.')
      return
    }

    setDeletingAccount(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error ?? 'Impossible de supprimer le compte.')
      }

      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
      setDeleteConfirmation('')
      setMessage('Compte supprime.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer le compte.')
    } finally {
      setDeletingAccount(false)
    }
  }

  async function handleRemoveFavorite(favorite: Favorite) {
    if (!currentUser) {
      return
    }

    setError('')
    setMessage('')

    const { error: removeError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('id', favorite.id)

    if (removeError) {
      setError(removeError.message)
      return
    }

    setFavorites((currentFavorites) => currentFavorites.filter((item) => item.id !== favorite.id))
    setMessage(`${favorite.game_name} retire des favoris.`)
  }

  if (loading) {
    return (
      <section className="panel rounded-[2rem] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Compte</p>
        <div className="mt-8 h-44 animate-pulse rounded-[1.5rem] border border-[var(--line)] bg-white/5" />
      </section>
    )
  }

  if (passwordRecovery) {
    return (
      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Compte</p>
          <h1 className="font-display mt-2 text-5xl font-semibold leading-none text-[var(--foreground)]">
            Nouveau mot de passe
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Choisis un nouveau mot de passe pour reprendre ton aventure.
          </p>
        </div>

        <form onSubmit={handleRecoveryPassword} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
            Nouveau mot de passe
            <input
              type="password"
              value={recoveryPassword}
              onChange={(event) => setRecoveryPassword(event.target.value)}
              minLength={6}
              required
              className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              placeholder="Minimum 6 caracteres"
            />
          </label>

          {message ? (
            <p className="rounded-[1rem] border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-[1rem] border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={resettingPassword}
            className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#101722] shadow-[0_18px_40px_rgba(223,191,122,0.18)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {resettingPassword ? 'Mise a jour...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </section>
    )
  }

  if (currentUser) {
    return (
      <section className="panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Compte</p>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div
                aria-label={`Avatar de ${displayUsername}`}
                className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--line-strong)] bg-black/24 bg-cover bg-center"
                role="img"
                style={profile?.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : undefined}
              >
                {profile?.avatar_url ? (
                  <span className="sr-only">{displayUsername}</span>
                ) : (
                  <span className="font-display text-4xl text-[var(--accent)]">
                    {displayUsername.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <h1 className="font-display text-5xl font-semibold leading-none text-[var(--foreground)]">
                  {displayUsername}
                </h1>
                <label className="mt-4 inline-flex cursor-pointer rounded-full border border-[var(--line-strong)] bg-white/6 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12">
                  {uploadingAvatar ? 'Envoi...' : 'Changer avatar'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={submitting}
            className="rounded-full border border-[var(--line-strong)] bg-white/6 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Deconnexion
          </button>
        </div>

        {message ? (
          <p className="mt-6 rounded-[1rem] border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-[1rem] border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Bibliotheque</p>
            <p className="font-display mt-2 text-2xl text-[var(--foreground)]">
              {loadingFavorites ? '...' : `${favorites.length} favori${favorites.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Membre depuis</p>
            <p className="mt-2 text-base text-[var(--foreground)]">{memberSince}</p>
          </div>
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-black/14 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Mes favoris</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Les jeux que tu veux garder sous la main.
              </p>
            </div>
            <Link
              href="/games"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:text-[var(--foreground)]"
            >
              Explorer
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {loadingFavorites ? (
              <div className="h-20 animate-pulse rounded-[1.2rem] border border-[var(--line)] bg-white/5" />
            ) : null}

            {!loadingFavorites && favorites.length === 0 ? (
              <p className="rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-4 text-sm text-[var(--muted)]">
                Aucun favori pour le moment.
              </p>
            ) : null}

            {!loadingFavorites
              ? favorites.map((favorite) => (
                  <article
                    key={favorite.id}
                    className="grid gap-4 rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-3 sm:grid-cols-[64px,1fr_auto] sm:items-center"
                  >
                    <div
                      aria-label={`Couverture de ${favorite.game_name}`}
                      className="h-16 w-16 rounded-[0.9rem] border border-[var(--line)] bg-white/5 bg-cover bg-center"
                      role="img"
                      style={favorite.cover_url ? { backgroundImage: `url(${favorite.cover_url})` } : undefined}
                    />
                    <div>
                      <h2 className="font-display text-2xl leading-tight text-[var(--foreground)]">
                        {favorite.game_name}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Link
                        href={`/games/${favorite.igdb_game_id}`}
                        className="inline-flex min-h-11 min-w-24 items-center justify-center rounded-full border border-[var(--line-strong)] bg-white/6 px-5 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12"
                      >
                        Voir
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(favorite)}
                        className="rounded-full border border-red-300/25 bg-red-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-400/18"
                      >
                        Retirer
                      </button>
                    </div>
                  </article>
                ))
              : null}
          </div>
        </section>

        <form onSubmit={handleProfileUpdate} className="mt-8 grid gap-5 rounded-[1.5rem] border border-[var(--line)] bg-black/14 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Informations</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Modifie ton pseudo, ton email ou ton mot de passe.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
              Pseudo
              <input
                value={profileUsernameInput}
                onChange={(event) => setProfileUsernameInput(event.target.value)}
                minLength={3}
                maxLength={24}
                required
                className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
              Email
              <input
                type="email"
                value={profileEmailInput}
                onChange={(event) => setProfileEmailInput(event.target.value)}
                required
                className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
            Nouveau mot de passe
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={6}
              className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              placeholder="Laisse vide pour ne pas changer"
            />
          </label>

          <button
            type="submit"
            disabled={updatingProfile}
            className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#101722] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {updatingProfile ? 'Mise a jour...' : 'Enregistrer'}
          </button>
        </form>

        <div className="mt-5 rounded-[1.5rem] border border-red-300/25 bg-red-400/8 p-5">
          <p className="text-xs uppercase tracking-[0.26em] text-red-100">Zone dangereuse</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            La suppression retire ton profil, tes favoris, ton avatar et ton acces de connexion.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              className="rounded-[1.1rem] border border-red-300/25 bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-red-200"
              placeholder="Tape SUPPRIMER"
            />
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirmation !== 'SUPPRIMER'}
              className="rounded-full border border-red-200/50 bg-red-400/16 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-400/24 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {deletingAccount ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Compte</p>
          <h1 className="font-display mt-2 text-5xl font-semibold leading-none text-[var(--foreground)]">
            {isSignup ? 'Creer un profil' : isForgotPassword ? 'Mot de passe oublie' : 'Connexion'}
          </h1>
        </div>

        <div className="flex rounded-full border border-[var(--line)] bg-black/18 p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
              !isSignup ? 'bg-[var(--accent)] text-[#101722]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
              isSignup ? 'bg-[var(--accent)] text-[#101722]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Inscription
          </button>
        </div>
      </div>

      {isForgotPassword ? (
        <form onSubmit={handleForgotPassword} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
            Email
            <input
              type="email"
              value={forgotEmail}
              onChange={(event) => setForgotEmail(event.target.value)}
              required
              className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              placeholder="joueur@playerpg.fr"
            />
          </label>

          {message ? (
            <p className="rounded-[1rem] border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-[1rem] border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#101722] shadow-[0_18px_40px_rgba(223,191,122,0.18)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? 'Envoi...' : 'Recevoir le lien'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError('')
              setMessage('')
            }}
            className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
          >
            Retour a la connexion
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        {isSignup ? (
          <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
            Pseudo
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={24}
              required
              className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              placeholder="Nasake"
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            placeholder="joueur@playerpg.fr"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            placeholder="Minimum 6 caracteres"
          />
        </label>

        {message ? (
          <p className="rounded-[1rem] border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[1rem] border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#101722] shadow-[0_18px_40px_rgba(223,191,122,0.18)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {submitting ? 'Chargement...' : isSignup ? 'Creer mon compte' : 'Se connecter'}
        </button>

          {!isSignup ? (
            <button
              type="button"
              onClick={() => {
                setMode('forgot')
                setForgotEmail(email)
                setError('')
                setMessage('')
              }}
              className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
            >
              Mot de passe oublie ?
            </button>
          ) : null}
        </form>
      )}
    </section>
  )
}
