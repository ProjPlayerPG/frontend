'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { ensureProfile } from '@/components/profile/account/profileService'
import {
  formatMemberSince,
  profileErrorMessage,
  profileUsername,
} from '@/components/profile/account/profileUtils'
import type { AuthMode, Favorite, Profile } from '@/components/profile/account/types'

export function useProfileAccount() {
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
  const [isAdmin, setIsAdmin] = useState(false)

  const currentUser = session?.user ?? null
  const isSignup = mode === 'signup'
  const isForgotPassword = mode === 'forgot'
  const displayUsername = profile?.username ?? currentUser?.user_metadata.username ?? 'Profil joueur'
  const memberSince = useMemo(() => formatMemberSince(profile?.created_at), [profile?.created_at])

  useEffect(() => {
    let active = true

    async function loadSession() {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (!active) return

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

    void loadSession()

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
      setIsAdmin(false)
      return
    }

    setProfileUsernameInput(profile?.username ?? profileUsername(currentUser))
    setProfileEmailInput(profile?.email ?? currentUser.email ?? '')
  }, [currentUser, profile])

  useEffect(() => {
    let active = true

    async function loadFavorites() {
      if (!currentUser) return

      setLoadingFavorites(true)
      const { data, error: favoritesError } = await supabase
        .from('favorites')
        .select('id, igdb_game_id, game_name, cover_url, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (!active) return

      if (favoritesError) {
        setError(favoritesError.message)
      } else {
        setFavorites((data ?? []) as Favorite[])
      }

      setLoadingFavorites(false)
    }

    void loadFavorites()
    return () => {
      active = false
    }
  }, [currentUser])

  useEffect(() => {
    let active = true

    async function loadAdminStatus() {
      if (!currentUser) {
        setIsAdmin(false)
        return
      }

      const { data, error: adminError } = await supabase.rpc('is_admin')

      if (!active) return

      if (adminError) {
        setIsAdmin(false)
        setError(adminError.message)
        return
      }

      setIsAdmin(Boolean(data))
    }

    void loadAdminStatus()
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
          setError('Choisis un pseudo pour créer ton compte.')
          return
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: cleanUsername } },
        })

        if (signupError) throw signupError

        if (data.session?.user) {
          setProfile(await ensureProfile(data.session.user))
          setMessage('Compte créé, tu es connecté.')
        } else {
          setMessage('Compte créé. Vérifie tes e-mails pour confirmer ton inscription avant de te connecter.')
        }
      } else {
        const { error: signinError } = await supabase.auth.signInWithPassword({ email, password })
        if (signinError) throw signinError
        setMessage('Connexion réussie.')
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
        setError('Renseigne ton e-mail pour recevoir le lien de réinitialisation.')
        return
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/profile?reset-password=1`,
      })

      if (resetError) throw resetError
      setMessage('Si un compte existe avec cet e-mail, un lien de réinitialisation vient d’être envoyé.')
    } catch (forgotError) {
      setError(forgotError instanceof Error ? forgotError.message : 'Impossible d’envoyer le lien.')
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
        setError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: cleanPassword })
      if (updateError) throw updateError

      setRecoveryPassword('')
      setPasswordRecovery(false)
      window.history.replaceState(null, '', '/profile')
      setMessage('Mot de passe mis à jour.')
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
      setMessage('Tu es déconnecté.')
    }

    setSubmitting(false)
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return

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

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', currentUser.id)
        .select('user_id, username, email, avatar_url, created_at')
        .single()

      if (updateError) throw updateError
      setProfile(updatedProfile as Profile)
      setMessage('Avatar mis à jour.')
    } catch (avatarError) {
      setError(profileErrorMessage(avatarError))
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return

    const cleanUsername = profileUsernameInput.trim()
    const cleanEmail = profileEmailInput.trim()
    const cleanPassword = newPassword.trim()

    if (!cleanUsername || !cleanEmail) {
      setError('Le pseudo et l’e-mail sont obligatoires.')
      return
    }

    setUpdatingProfile(true)
    setError('')
    setMessage('')

    try {
      const authUpdates: Parameters<typeof supabase.auth.updateUser>[0] = {
        data: { username: cleanUsername },
      }

      if (cleanEmail !== currentUser.email) authUpdates.email = cleanEmail
      if (cleanPassword) authUpdates.password = cleanPassword

      const { data: authData, error: authError } = await supabase.auth.updateUser(authUpdates)
      if (authError) throw authError

      const nextEmail = authData.user.email ?? cleanEmail
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ username: cleanUsername, email: nextEmail })
        .eq('user_id', currentUser.id)
        .select('user_id, username, email, avatar_url, created_at')
        .single()

      if (updateError) throw updateError

      setProfile(updatedProfile as Profile)
      setNewPassword('')
      setMessage(
        cleanEmail !== currentUser.email
          ? 'Profil mis à jour. Vérifie tes e-mails si Supabase demande une confirmation.'
          : 'Profil mis à jour.',
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
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) throw new Error(result.error ?? 'Impossible de supprimer le compte.')

      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
      setDeleteConfirmation('')
      setMessage('Compte supprimé.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer le compte.')
    } finally {
      setDeletingAccount(false)
    }
  }

  async function handleRemoveFavorite(favorite: Favorite) {
    if (!currentUser) return

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

    setFavorites((current) => current.filter((item) => item.id !== favorite.id))
    setMessage(`${favorite.game_name} retiré des favoris.`)
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
    if (nextMode === 'forgot') setForgotEmail(email)
  }

  return {
    mode,
    session,
    profile,
    email,
    password,
    forgotEmail,
    recoveryPassword,
    username,
    message,
    error,
    loading,
    submitting,
    resettingPassword,
    passwordRecovery,
    uploadingAvatar,
    updatingProfile,
    deletingAccount,
    profileUsernameInput,
    profileEmailInput,
    newPassword,
    deleteConfirmation,
    favorites,
    loadingFavorites,
    isAdmin,
    currentUser,
    isSignup,
    isForgotPassword,
    displayUsername,
    memberSince,
    setEmail,
    setPassword,
    setForgotEmail,
    setRecoveryPassword,
    setUsername,
    setProfileUsernameInput,
    setProfileEmailInput,
    setNewPassword,
    setDeleteConfirmation,
    changeMode,
    handleSubmit,
    handleForgotPassword,
    handleRecoveryPassword,
    handleSignOut,
    handleAvatarChange,
    handleProfileUpdate,
    handleDeleteAccount,
    handleRemoveFavorite,
  }
}

export type ProfileAccountController = ReturnType<typeof useProfileAccount>
