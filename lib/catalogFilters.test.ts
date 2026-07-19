import { describe, expect, it } from 'vitest'
import {
  filtersFromSearchParams,
  gameSearchHref,
  normalizeGameSearchQuery,
} from '@/lib/catalogFilters'

describe('filtersFromSearchParams', () => {
  it('retourne les filtres par défaut sans paramètres', () => {
    expect(filtersFromSearchParams()).toEqual({
      page: 0,
      query: '',
      tag: '',
      platform: '',
      releaseYear: '',
      sort: 'release_desc',
    })
  })

  it('convertit une page utilisateur en index interne', () => {
    expect(filtersFromSearchParams({ page: '3' }).page).toBe(2)
  })

  it('nettoie et conserve une recherche suffisamment longue', () => {
    expect(filtersFromSearchParams({ q: '  Dragon   Quest  ' }).query).toBe('Dragon Quest')
    expect(filtersFromSearchParams({ q: 'D' }).query).toBe('')
  })

  it.each(['0', '-2', '2.5', 'invalide'])('refuse la page invalide %s', (page) => {
    expect(filtersFromSearchParams({ page }).page).toBe(0)
  })

  it('accepte uniquement les valeurs proposées par le catalogue', () => {
    expect(
      filtersFromSearchParams({
        tag: 'Tactical',
        platform: 'Nintendo Switch',
        releaseYear: '2024',
        sort: 'name_asc',
      }),
    ).toEqual({
      page: 0,
      query: '',
      tag: 'Tactical',
      platform: 'Nintendo Switch',
      releaseYear: '2024',
      sort: 'name_asc',
    })
  })

  it('ignore les valeurs inconnues', () => {
    expect(
      filtersFromSearchParams({
        tag: 'Course',
        platform: 'Dreamcast',
        releaseYear: '1989',
        sort: 'popularite',
      }),
    ).toEqual({
      page: 0,
      query: '',
      tag: '',
      platform: '',
      releaseYear: '',
      sort: 'release_desc',
    })
  })

  it('utilise la première valeur lorsque Next.js fournit un tableau', () => {
    expect(
      filtersFromSearchParams({
        tag: ['Strategy', 'Indie'],
        page: ['2', '5'],
      }),
    ).toMatchObject({ tag: 'Strategy', page: 1 })
  })
})

describe('navigation de recherche', () => {
  it('normalise la saisie et construit une URL encodée', () => {
    expect(normalizeGameSearchQuery('  Dragon   Quest  ')).toBe('Dragon Quest')
    expect(gameSearchHref('Dragon Quest')).toBe('/games?q=Dragon%20Quest')
  })

  it('revient au catalogue lorsque la recherche est trop courte', () => {
    expect(gameSearchHref('D')).toBe('/games')
    expect(gameSearchHref('   ')).toBe('/games')
  })
})
