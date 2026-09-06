import { describe, expect, it } from 'vitest'
import {
  filtersFromSearchParams,
  gameDetailsHref,
  gameSearchHref,
  gamesCatalogHref,
  normalizeGamesReturnTo,
  normalizeGameSearchQuery,
  normalizeGlossaryReturnContext,
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

describe('navigation entre le catalogue et une fiche', () => {
  it('conserve la recherche et la page dans le lien de retour', () => {
    const returnTo = gamesCatalogHref(
      filtersFromSearchParams({ q: 'Dragon Quest', page: '3' }),
    )

    expect(returnTo).toBe('/games?q=Dragon+Quest&page=3')
    expect(gameDetailsHref(42, { returnTo })).toBe(
      '/games/42?returnTo=%2Fgames%3Fq%3DDragon%2BQuest%26page%3D3',
    )
  })

  it('conserve les filtres et le tri du catalogue', () => {
    expect(
      gamesCatalogHref(
        filtersFromSearchParams({
          tag: 'Strategy',
          platform: 'Nintendo Switch',
          releaseYear: '2024',
          sort: 'name_asc',
          page: '2',
        }),
      ),
    ).toBe(
      '/games?tag=Strategy&platform=Nintendo+Switch&releaseYear=2024&sort=name_asc&page=2',
    )
  })

  it('refuse une destination de retour externe ou une fiche de jeu', () => {
    expect(normalizeGamesReturnTo('https://example.com/games?q=Pokemon')).toBe('/games')
    expect(normalizeGamesReturnTo('/games/8353?q=Pokemon')).toBe('/games')
  })

  it('peut conserver simultanement le retour au chatbot et au catalogue', () => {
    expect(
      gameDetailsHref(8353, {
        fromChatbot: true,
        returnTo: '/games?q=Pokemon',
      }),
    ).toBe('/games/8353?from=chatbot&returnTo=%2Fgames%3Fq%3DPokemon')
  })

  it('conserve le terme du glossaire dans le parcours vers une fiche', () => {
    expect(
      gameDetailsHref(8353, {
        fromGlossary: { slug: 'tour-par-tour', title: 'Tour par tour' },
      }),
    ).toBe('/games/8353?from=glossary&glossary=tour-par-tour&term=Tour+par+tour')
  })

  it('refuse un chemin de glossaire qui pourrait rediriger ailleurs', () => {
    expect(normalizeGlossaryReturnContext('../admin', 'Administration')).toBeNull()
    expect(
      gameDetailsHref(8353, {
        fromGlossary: { slug: '../admin', title: 'Administration' },
      }),
    ).toBe('/games/8353')
  })
})
