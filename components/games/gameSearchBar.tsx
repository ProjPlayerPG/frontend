'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  gameDetailsHref,
  gameSearchHref,
  normalizeGameSearchQuery,
} from '@/lib/catalogFilters'
import { igdbUrlWithSize, normalizeBaseUrl } from '@/lib/igdb'
import GameProvenanceBadge, {
  type GameProvenance,
} from '@/components/games/gameProvenanceBadge'

type SearchGame = {
  id: number
  name: string
  cover?: { url?: string }
  provenance?: GameProvenance
}

export default function GameSearchBar({
  compact = false,
  initialQuery = '',
}: {
  compact?: boolean
  initialQuery?: string
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchGame[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)

  useEffect(() => {
    requestRef.current?.abort()
    requestRef.current = null
    setSearch(pathname === '/games' ? normalizeGameSearchQuery(initialQuery) : '')
    setResults([])
    setOpen(false)
    setSuggestionsEnabled(false)
    setLoading(false)
    setError(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [pathname, initialQuery])

  useEffect(() => {
    if (!suggestionsEnabled) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      requestRef.current?.abort()
      requestRef.current = null
      setOpen(false)
      setLoading(false)
      return
    }

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
      const controller = new AbortController()
      requestRef.current?.abort()
      requestRef.current = controller
      setLoading(true)
      setError(null)

      try {
        const url = new URL(`${baseUrl}/api/games/search`)
        url.searchParams.set('q', query)
        url.searchParams.set('limit', '10')
        url.searchParams.set('offset', '0')

        const response = await fetch(url.toString(), {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = (await response.json()) as SearchGame[]
        setResults(data)
        setOpen(true)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error(err)
        setResults([])
        setOpen(false)
        setError('Erreur lors de la recherche')
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null
          setLoading(false)
        }
      }
    }, 280)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      requestRef.current?.abort()
      requestRef.current = null
    }
  }, [search, baseUrl, suggestionsEnabled])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = normalizeGameSearchQuery(search)

    if (!query) {
      requestRef.current?.abort()
      setSuggestionsEnabled(false)
      setOpen(false)
      setResults([])
      setError(null)
      router.push('/games')
      return
    }

    if (query.length < 2) {
      requestRef.current?.abort()
      setSuggestionsEnabled(false)
      setOpen(false)
      setResults([])
      setError('Saisis au moins 2 caractères.')
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    requestRef.current?.abort()
    setSuggestionsEnabled(false)
    setOpen(false)
    setResults([])
    setLoading(false)
    setError(null)
    router.push(gameSearchHref(query))
  }

  return (
    <div className={compact ? 'relative z-30 w-full min-w-0' : 'relative z-30'}>
      <div className={`panel relative ${compact ? 'rounded-full px-4 py-2' : 'rounded-[1.75rem] px-5 py-4 sm:px-6'}`}>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-[radial-gradient(circle_at_center,rgba(223,191,122,0.18),transparent_65%)]" />

        <form onSubmit={submitSearch} className={`relative flex items-center ${compact ? 'gap-2' : 'gap-4'}`}>
          <button
            type="submit"
            aria-label="Afficher tous les résultats"
            className={`flex shrink-0 items-center justify-center border border-[var(--line)] bg-white/5 text-[var(--accent)] transition hover:border-[var(--line-strong)] hover:bg-white/8 ${compact ? 'h-8 w-8 rounded-full' : 'h-12 w-12 rounded-2xl'}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p className={`font-display text-xs uppercase tracking-[0.32em] text-[var(--accent)] ${compact ? 'sr-only' : ''}`}>
              Rechercher un jeu
            </p>
            <input
              className={`w-full bg-transparent text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/85 ${compact ? 'text-sm leading-8' : 'mt-1 text-lg'}`}
              value={search}
              onChange={(event) => {
                setSuggestionsEnabled(true)
                setSearch(event.target.value)
              }}
              aria-label="Rechercher un jeu"
              autoComplete="off"
              placeholder={compact ? 'Rechercher...' : 'Titre...'}
            />
          </div>
        </form>
      </div>

      {loading && !compact ? <p className="mt-3 text-sm text-[var(--muted)]">Consultation du codex...</p> : null}
      {error && !compact ? <p className="mt-3 text-sm text-rose-300">Erreur : {error}</p> : null}

      {open ? (
        <div className={`panel absolute top-full z-40 mt-3 max-h-[28rem] overflow-y-auto rounded-[1.5rem] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.42)] ${compact ? 'right-0 w-[min(24rem,calc(100vw-2rem))]' : 'left-0 right-0'}`}>
          {results.length > 0 ? (
            results.map((game) => {
              const coverUrl = igdbUrlWithSize(game.cover?.url, 't_cover_big')

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    requestRef.current?.abort()
                    setSuggestionsEnabled(false)
                    setOpen(false)
                    setSearch('')
                    setResults([])
                    const returnTo =
                      pathname === '/games'
                        ? `${pathname}${window.location.search}`
                        : undefined
                    router.push(gameDetailsHref(game.id, { returnTo }))
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
                    <div className="mt-2">
                      <GameProvenanceBadge provenance={game.provenance} compact />
                    </div>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="px-4 py-4 text-sm text-[var(--muted)]">Aucun résultat.</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
