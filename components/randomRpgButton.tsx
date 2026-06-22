'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { normalizeBaseUrl } from '@/lib/igdb'

export default function RandomRpgButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function discoverRandomRpg() {
    setLoading(true)
    setError('')

    try {
      const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
      const response = await fetch(`${baseUrl}/api/games/random`)

      if (!response.ok) {
        throw new Error('Aucun RPG aleatoire disponible.')
      }

      const game = (await response.json()) as { id?: number }

      if (!game.id) {
        throw new Error('Aucun RPG aleatoire disponible.')
      }

      router.push(`/games/${game.id}`)
    } catch (randomError) {
      setError(randomError instanceof Error ? randomError.message : 'Impossible de lancer la decouverte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={discoverRandomRpg}
        disabled={loading}
        className="inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--accent-cool)] bg-[var(--accent-cool)]/18 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)] shadow-[0_14px_34px_rgba(127,183,201,0.14)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-cool)]/28 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Recherche...' : 'Decouvrir un RPG'}
      </button>
      {error ? <p className="text-xs text-red-100">{error}</p> : null}
    </div>
  )
}
