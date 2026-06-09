import GameCard from '@/components/gameCard'
import GamesCatalogControls, { GamesFilters, GamesPagination } from '@/components/gamesCatalogControls'
import { platformFilters, releaseYearFilters, sortOptions, tagFilters } from '@/lib/gamesFilters'
import { normalizeBaseUrl } from '@/lib/igdb'

type Game = {
  id: number
  name: string
  cover?: { url?: string }
  genres?: { name: string }[]
  platforms?: { name: string }[]
  first_release_date?: number
}

type SearchParamValue = string | string[] | undefined
export type GamesSearchParams = Record<string, SearchParamValue>

const PAGE_SIZE = 12

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value
}

function allowedValue(value: SearchParamValue, values: string[]) {
  const selected = firstValue(value)
  return selected && values.includes(selected) ? selected : ''
}

function allowedSort(value: SearchParamValue) {
  const selected = firstValue(value)
  const sortValues = sortOptions.map((option) => option.value)
  return selected && sortValues.includes(selected) ? selected : 'release_desc'
}

function pageFromSearchParams(value: SearchParamValue) {
  const page = Number(firstValue(value) || '1')
  return Number.isInteger(page) && page > 0 ? page - 1 : 0
}

function filtersFromSearchParams(searchParams: GamesSearchParams = {}): GamesFilters {
  return {
    page: pageFromSearchParams(searchParams.page),
    tag: allowedValue(searchParams.tag, tagFilters),
    platform: allowedValue(searchParams.platform, platformFilters),
    releaseYear: allowedValue(searchParams.releaseYear, releaseYearFilters),
    sort: allowedSort(searchParams.sort),
  }
}

async function fetchGames(filters: GamesFilters) {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
  const url = new URL(`${baseUrl}/api/games`)
  url.searchParams.set('limit', String(PAGE_SIZE))
  url.searchParams.set('offset', String(filters.page * PAGE_SIZE))
  url.searchParams.set('sort', filters.sort)
  if (filters.tag) url.searchParams.set('tag', filters.tag)
  if (filters.platform) url.searchParams.set('platform', filters.platform)
  if (filters.releaseYear) url.searchParams.set('releaseYear', filters.releaseYear)

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
  const games = await fetchGames(filters)
  const canGoBack = filters.page > 0
  const canGoForward = games.length === PAGE_SIZE

  return (
    <div className="grid gap-5">
      <GamesCatalogControls filters={filters} />
      <GamesPagination filters={filters} canGoBack={canGoBack} canGoForward={canGoForward} />

      {games.length > 0 ? null : (
        <div className="panel rounded-[1.5rem] p-6 text-sm text-[var(--muted)]">
          Aucun jeu ne correspond a ces filtres.
        </div>
      )}

      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}

      {games.length > 0 ? (
        <GamesPagination filters={filters} canGoBack={canGoBack} canGoForward={canGoForward} />
      ) : null}
    </div>
  )
}
