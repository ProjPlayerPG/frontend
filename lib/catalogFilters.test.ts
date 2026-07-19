import { describe, expect, it } from 'vitest'
import { filtersFromSearchParams } from '@/lib/catalogFilters'

describe('filtersFromSearchParams', () => {
  it('retourne les filtres par défaut sans paramètres', () => {
    expect(filtersFromSearchParams()).toEqual({
      page: 0,
      tag: '',
      platform: '',
      releaseYear: '',
      sort: 'release_desc',
    })
  })

  it('convertit une page utilisateur en index interne', () => {
    expect(filtersFromSearchParams({ page: '3' }).page).toBe(2)
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
