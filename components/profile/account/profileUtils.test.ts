import { describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import {
  formatMemberSince,
  profileErrorMessage,
  profileUsername,
} from '@/components/profile/account/profileUtils'

function user(values: Partial<User>): User {
  return {
    id: '12345678-abcd-efgh-ijkl-123456789012',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-07-19T12:00:00.000Z',
    ...values,
  }
}

describe('profileUtils', () => {
  it('privilégie le pseudo renseigné dans les métadonnées', () => {
    expect(profileUsername(user({ user_metadata: { username: '  Nasake  ' } }))).toBe('Nasake')
  })

  it('construit un pseudo stable à partir de l’e-mail', () => {
    expect(profileUsername(user({ email: 'joueur@example.com' }))).toBe('joueur-123456')
  })

  it('fournit un libellé lorsque la date de création manque', () => {
    expect(formatMemberSince()).toBe('Compte actif')
  })

  it('explique clairement une erreur de permission Supabase', () => {
    expect(profileErrorMessage(new Error('permission denied for table profiles'))).toContain('policies RLS')
  })
})
