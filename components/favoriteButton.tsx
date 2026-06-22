'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type FavoriteButtonProps = {
  gameId: number
  gameName: string
  coverUrl: string | null
}

export default function FavoriteButton({ gameId, gameName, coverUrl }: FavoriteButtonProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadFavoriteState() {
      const { data: sessionData } = await supabase.auth.getSession()
      const currentUserId = sessionData.session?.user.id ?? null

      if (!active) {
        return
      }

      setUserId(currentUserId)

      if (!currentUserId) {
        setLoading(false)
        return
      }

      const { data, error: favoriteError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('igdb_game_id', gameId)
        .limit(1)

      if (!active) {
        return
      }

      if (favoriteError) {
        setError(favoriteError.message)
      } else {
        setIsFavorite(Boolean(data?.[0]))
      }

      setLoading(false)
    }

    loadFavoriteState()

    return () => {
      active = false
    }
  }, [gameId])

  async function toggleFavorite() {
    if (!userId) {
      return
    }

    setSaving(true)
    setError('')

    try {
      if (isFavorite) {
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('igdb_game_id', gameId)

        if (deleteError) {
          throw deleteError
        }

        setIsFavorite(false)
      } else {
        const { error: insertError } = await supabase.from('favorites').insert({
          user_id: userId,
          igdb_game_id: gameId,
          game_name: gameName,
          cover_url: coverUrl,
        })

        if (insertError) {
          if (insertError.code === '23505') {
            setIsFavorite(true)
            return
          }

          throw insertError
        }

        setIsFavorite(true)
      }
    } catch (favoriteError) {
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : 'Impossible de modifier les favoris.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-6 h-14 w-full max-w-sm animate-pulse rounded-full border border-[var(--line)] bg-white/6" />
    )
  }

  if (!userId) {
    return (
      <div className="mt-6 grid max-w-sm gap-3">
        <Link
          href="/profile"
          className="inline-flex items-center justify-center rounded-full border border-[var(--line-strong)] bg-white/6 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12"
        >
          Connecte-toi pour ajouter
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-6 grid max-w-sm gap-3">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={saving}
        className={`inline-flex items-center justify-center gap-3 rounded-full border px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isFavorite
            ? 'border-[var(--accent-strong)] bg-[var(--accent)] text-[#101722] shadow-[0_18px_40px_rgba(223,191,122,0.18)] hover:bg-[var(--accent-strong)]'
            : 'border-[var(--line-strong)] bg-white/6 text-[var(--accent)] hover:bg-[var(--accent)]/12'
        }`}
      >
        <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
        {saving ? 'Enregistrement...' : isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      </button>

      {error ? (
        <p className="rounded-[1rem] border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>
      ) : null}
    </div>
  )
}
