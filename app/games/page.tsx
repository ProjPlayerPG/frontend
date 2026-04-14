'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import GameCard from '../../components/gameCard'
import { normalizeBaseUrl } from '@/lib/igdb'

type Game = {
  id: number
  name: string
  cover?: { url?: string }
  genres?: { name: string }[]
  first_release_date?: number
}

export default function GamesList() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
        const res = await fetch(`${baseUrl}/api/games?limit=20`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        setGames(data)
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError('Failed to load games')
        }
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  if (loading) {
    return <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Chargement du grimoire...</p>
  }

  if (error) {
    return <p className="text-sm text-rose-300">Erreur : {error}</p>
  }

  return (
    <div className="grid gap-5">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onDetails={(id) => router.push(`/games/${id}`)} />
      ))}
    </div>
  )
}
