import Link from 'next/link'
import GameCard from '@/components/games/gameCard'
import GamesCatalogControls, { GamesPagination } from '@/components/games/gamesCatalogControls'
import {
  filtersFromSearchParams,
  gamesCatalogHref,
  type GamesFilters,
  type GamesSearchParams,
} from '@/lib/catalogFilters'
import { normalizeBaseUrl } from '@/lib/igdb'
import type { GameProvenance } from '@/components/games/gameProvenanceBadge'

type Game = {
  id: number
  name: string
  cover?: { url?: string }
  genres?: { name: string }[]
  platforms?: { name: string }[]
  first_release_date?: number
  provenance?: GameProvenance
}

export type { GamesSearchParams } from '@/lib/catalogFilters'

const PAGE_SIZE = 12

async function fetchGames(filters: GamesFilters) {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
  const endpoint = filters.query ? '/api/games/search' : '/api/games'
  const url = new URL(`${baseUrl}${endpoint}`)
  url.searchParams.set('limit', String(PAGE_SIZE + 1))
  url.searchParams.set('offset', String(filters.page * PAGE_SIZE))

  if (filters.query) {
    url.searchParams.set('q', filters.query)
  } else {
    url.searchParams.set('sort', filters.sort)
    if (filters.tag) url.searchParams.set('tag', filters.tag)
    if (filters.platform) url.searchParams.set('platform', filters.platform)
    if (filters.releaseYear) url.searchParams.set('releaseYear', filters.releaseYear)
  }

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  return Array.isArray(data) ? (data as Game[]) : []
}

export default async function GamesCatalog({
  searchParams = {},
}: {
  searchParams?: GamesSearchParams
}) {
  const filters = filtersFromSearchParams(searchParams)
  const fetchedGames = await fetchGames(filters)
  const games = fetchedGames.slice(0, PAGE_SIZE)
  const canGoBack = filters.page > 0
  const canGoForward = fetchedGames.length > PAGE_SIZE
  const returnTo = gamesCatalogHref(filters)

  return (
    <div className="grid gap-5">
      {filters.query ? (
        <div className="panel flex flex-col gap-3 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Résultats correspondant à <strong className="text-[var(--foreground)]">« {filters.query} »</strong>
          </p>
          <Link
            href="/games"
            className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            Effacer la recherche
          </Link>
        </div>
      ) : (
        <GamesCatalogControls filters={filters} />
      )}
      <GamesPagination filters={filters} canGoBack={canGoBack} canGoForward={canGoForward} />

      {games.length > 0 ? null : (
        <div className="panel rounded-[1.5rem] p-6 text-sm text-[var(--muted)]">
          {filters.query
            ? `Aucun jeu ne correspond à « ${filters.query} ».`
            : 'Aucun jeu ne correspond à ces filtres.'}
        </div>
      )}

      {games.map((game) => (
        <GameCard key={game.id} game={game} returnTo={returnTo} />
      ))}

      {games.length > 0 ? (
        <GamesPagination filters={filters} canGoBack={canGoBack} canGoForward={canGoForward} />
      ) : null}
    </div>
  )
}
