import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/components/profile/account/types'
import { profileUsername } from '@/components/profile/account/profileUtils'

export async function ensureProfile(user: User) {
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('user_id, username, email, avatar_url, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (selectError) throw selectError
  if (existingProfile) return existingProfile as Profile

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

  if (insertError) throw insertError
  return createdProfile as Profile
}
