import type { User } from '@supabase/supabase-js'

export function profileErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('permission denied')) {
    return 'Supabase bloque la table profiles. Vérifie les policies RLS de lecture, d’insertion et de mise à jour.'
  }

  return error instanceof Error ? error.message : 'Impossible de charger le profil.'
}

export function profileUsername(user: User) {
  const metadataUsername = user.user_metadata?.username

  if (typeof metadataUsername === 'string' && metadataUsername.trim()) {
    return metadataUsername.trim()
  }

  const emailPrefix = user.email?.split('@')[0]
  return emailPrefix ? `${emailPrefix}-${user.id.slice(0, 6)}` : `player-${user.id.slice(0, 8)}`
}

export function formatMemberSince(createdAt?: string) {
  if (!createdAt) return 'Compte actif'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(createdAt))
}
