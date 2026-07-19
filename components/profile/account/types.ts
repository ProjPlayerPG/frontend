export type AuthMode = 'signin' | 'signup' | 'forgot'

export type Profile = {
  user_id: string
  username: string
  email: string
  avatar_url: string | null
  created_at: string
}

export type Favorite = {
  id: string
  igdb_game_id: number
  game_name: string
  cover_url: string | null
  created_at: string
}
