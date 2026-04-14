'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { igdbUrlWithSize, normalizeBaseUrl } from '@/lib/igdb'

type SearchGame = {
  id: number
  name: string
  cover?: { url?: string }
}

export default function GameSearchBar() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchGame[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)

  useEffect(() => {
    const query = search.trim()

    if (query.length < 2) {
      setResults([])
      setOpen(false)
      setError(null)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const url = new URL(`${baseUrl}/api/games/search`)
        url.searchParams.set('q', query)
        url.searchParams.set('limit', '10')
        url.searchParams.set('offset', '0')

        const response = await fetch(url.toString(), { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = (await response.json()) as SearchGame[]
        setResults(data)
        setOpen(true)
      } catch (err) {
        console.error(err)
        setResults([])
        setOpen(false)
        setError('Erreur lors de la recherche')
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [search, baseUrl])

  return (
    <div className="relative z-30">
      <div className="panel relative rounded-[1.75rem] px-5 py-4 sm:px-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-[radial-gradient(circle_at_center,rgba(223,191,122,0.18),transparent_65%)]" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-white/5 text-[var(--accent)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display text-xs uppercase tracking-[0.32em] text-[var(--accent)]">
              Rechercher un jeu
            </p>
            <input
              className="mt-1 w-full bg-transparent text-lg text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/85"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titre..."
            />
          </div>
        </div>
      </div>

      {loading ? <p className="mt-3 text-sm text-[var(--muted)]">Consultation du codex...</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">Erreur : {error}</p> : null}

      {open ? (
        <div className="panel absolute left-0 right-0 top-full z-40 mt-3 max-h-[28rem] overflow-y-auto rounded-[1.5rem] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
          {results.length > 0 ? (
            results.map((game) => {
              const coverUrl = igdbUrlWithSize(game.cover?.url, 't_cover_big')

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setSearch(game.name)
                    router.push(`/games/${game.id}`)
                  }}
                  className="flex w-full items-center gap-4 rounded-[1.1rem] px-3 py-3 text-left transition hover:bg-white/6"
                >
                  <div className="flex h-18 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-white/8">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={game.name}
                        width={56}
                        height={72}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                        Codex
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-2xl leading-none text-[var(--foreground)]">
                      {game.name}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">
                      Voir les détails
                    </p>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="px-4 py-4 text-sm text-[var(--muted)]">Aucun resultat.</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
