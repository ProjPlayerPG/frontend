import { platformFilters, releaseYearFilters, sortOptions, tagFilters } from '@/lib/gamesFilters'

export type GamesFilters = {
  page: number
  query: string
  tag: string
  platform: string
  releaseYear: string
  sort: string
}

type SearchParamValue = string | string[] | undefined
export type GamesSearchParams = Record<string, SearchParamValue>

export type GlossaryReturnContext = {
  slug: string
  title: string
}

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

export function normalizeGameSearchQuery(value: SearchParamValue | string = '') {
  return String(firstValue(value) ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100)
}

export function gameSearchHref(value: SearchParamValue | string) {
  const query = normalizeGameSearchQuery(value)
  return query.length >= 2 ? `/games?q=${encodeURIComponent(query)}` : '/games'
}

export function gamesCatalogHref(filters: GamesFilters) {
  const params = new URLSearchParams()

  if (filters.query) {
    params.set('q', filters.query)
  } else {
    if (filters.tag) params.set('tag', filters.tag)
    if (filters.platform) params.set('platform', filters.platform)
    if (filters.releaseYear) params.set('releaseYear', filters.releaseYear)
    if (filters.sort !== 'release_desc') params.set('sort', filters.sort)
  }

  if (filters.page > 0) {
    params.set('page', String(filters.page + 1))
  }

  return `/games${params.size ? `?${params.toString()}` : ''}`
}

export function normalizeGamesReturnTo(value: SearchParamValue | string) {
  const candidate = String(firstValue(value) ?? '')

  if (!candidate.startsWith('/games') || candidate.startsWith('//')) {
    return '/games'
  }

  try {
    const url = new URL(candidate, 'https://playerpg.local')

    if (url.origin !== 'https://playerpg.local' || url.pathname !== '/games') {
      return '/games'
    }

    return gamesCatalogHref(filtersFromSearchParams(Object.fromEntries(url.searchParams)))
  } catch {
    return '/games'
  }
}

export function normalizeGlossaryReturnContext(
  slugValue: SearchParamValue | string,
  titleValue: SearchParamValue | string,
): GlossaryReturnContext | null {
  const slug = String(firstValue(slugValue) ?? '').trim()

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) {
    return null
  }

  const title = String(firstValue(titleValue) ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80)

  return { slug, title }
}

export function gameDetailsHref(
  gameId: number | string,
  options: {
    fromChatbot?: boolean
    fromGlossary?: GlossaryReturnContext
    returnTo?: string
  } = {},
) {
  const params = new URLSearchParams()

  if (options.fromChatbot) {
    params.set('from', 'chatbot')
  } else if (options.fromGlossary) {
    const glossaryContext = normalizeGlossaryReturnContext(
      options.fromGlossary.slug,
      options.fromGlossary.title,
    )

    if (glossaryContext) {
      params.set('from', 'glossary')
      params.set('glossary', glossaryContext.slug)
      if (glossaryContext.title) params.set('term', glossaryContext.title)
    }
  }

  if (options.returnTo) {
    params.set('returnTo', normalizeGamesReturnTo(options.returnTo))
  }

  return `/games/${gameId}${params.size ? `?${params.toString()}` : ''}`
}

export function filtersFromSearchParams(searchParams: GamesSearchParams = {}): GamesFilters {
  const query = normalizeGameSearchQuery(searchParams.q)

  return {
    page: pageFromSearchParams(searchParams.page),
    query: query.length >= 2 ? query : '',
    tag: allowedValue(searchParams.tag, tagFilters),
    platform: allowedValue(searchParams.platform, platformFilters),
    releaseYear: allowedValue(searchParams.releaseYear, releaseYearFilters),
    sort: allowedSort(searchParams.sort),
  }
}
