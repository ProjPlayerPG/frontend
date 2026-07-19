import { platformFilters, releaseYearFilters, sortOptions, tagFilters } from '@/lib/gamesFilters'

export type GamesFilters = {
  page: number
  tag: string
  platform: string
  releaseYear: string
  sort: string
}

type SearchParamValue = string | string[] | undefined
export type GamesSearchParams = Record<string, SearchParamValue>

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

export function filtersFromSearchParams(searchParams: GamesSearchParams = {}): GamesFilters {
  return {
    page: pageFromSearchParams(searchParams.page),
    tag: allowedValue(searchParams.tag, tagFilters),
    platform: allowedValue(searchParams.platform, platformFilters),
    releaseYear: allowedValue(searchParams.releaseYear, releaseYearFilters),
    sort: allowedSort(searchParams.sort),
  }
}
