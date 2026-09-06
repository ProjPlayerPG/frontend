import Link from 'next/link'
import { redirect } from 'next/navigation'
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
  url.searchParams.set('limit', String(PAGE_SIZE))
  url.searchParams.set('offset', String(filters.page * PAGE_SIZE))

  if (filters.query) {
    url.searchParams.set('q', filters.query)
  } else {
    url.searchParams.set('sort', filters.sort)
    if (filters.tag) url.searchParams.set('tag', filters.tag)
    if (filters.platform) url.searchParams.set('platform', filters.platform)
    if (filters.platformId) url.searchParams.set('platformId', filters.platformId)
    if (filters.companyId) url.searchParams.set('companyId', filters.companyId)
    if (filters.companyRole) url.searchParams.set('companyRole', filters.companyRole)
    if (filters.releaseYear) url.searchParams.set('releaseYear', filters.releaseYear)
  }

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  return Array.isArray(data) ? (data as Game[]) : []
}

async function fetchGamesCount(filters: GamesFilters) {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
  const url = new URL(`${baseUrl}/api/games/count`)

  if (filters.query) {
    url.searchParams.set('q', filters.query)
  } else {
    if (filters.tag) url.searchParams.set('tag', filters.tag)
    if (filters.platform) url.searchParams.set('platform', filters.platform)
    if (filters.platformId) url.searchParams.set('platformId', filters.platformId)
    if (filters.companyId) url.searchParams.set('companyId', filters.companyId)
    if (filters.companyRole) url.searchParams.set('companyRole', filters.companyRole)
    if (filters.releaseYear) url.searchParams.set('releaseYear', filters.releaseYear)
  }

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = (await res.json()) as { total?: number }
  return Number.isInteger(data.total) && Number(data.total) >= 0 ? Number(data.total) : 0
}

export default async function GamesCatalog({
  searchParams = {},
}: {
  searchParams?: GamesSearchParams
}) {
  const filters = filtersFromSearchParams(searchParams)
  const [games, totalGames] = await Promise.all([
    fetchGames(filters),
    fetchGamesCount(filters),
  ])
  const totalPages = Math.max(1, Math.ceil(totalGames / PAGE_SIZE))

  if (filters.page >= totalPages) {
    redirect(gamesCatalogHref({ ...filters, page: totalPages - 1 }))
  }

  const canGoBack = filters.page > 0
  const canGoForward = filters.page + 1 < totalPages
  const returnTo = gamesCatalogHref(filters)
  const contextLabel = filters.companyId
    ? `Jeux ${filters.companyRole === 'publisher' ? 'édités' : 'développés'} par ${filters.companyName || 'ce studio'}`
    : filters.platformId
      ? `Jeux disponibles sur ${filters.platformName || 'cette plateforme'}`
      : ''

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
        <>
          {contextLabel ? (
            <div className="panel flex flex-col gap-3 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[var(--muted)]">
                Filtre actif : <strong className="text-[var(--foreground)]">{contextLabel}</strong>
              </p>
              <Link
                href="/games"
                className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                Voir tous les jeux
              </Link>
            </div>
          ) : null}
          <GamesCatalogControls filters={filters} />
        </>
      )}
      <GamesPagination
        filters={filters}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        totalPages={totalPages}
      />

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
        <GamesPagination
          filters={filters}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          totalPages={totalPages}
        />
      ) : null}
    </div>
  )
}
