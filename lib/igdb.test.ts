import { describe, expect, it } from 'vitest'
import { igdbUrlWithSize, normalizeBaseUrl, normalizeCoverUrl } from '@/lib/igdb'

describe('normalizeCoverUrl', () => {
  it('ajoute le protocole HTTPS aux URL IGDB protocol-relative', () => {
    expect(normalizeCoverUrl('//images.igdb.com/igdb/image/upload/t_thumb/demo.jpg')).toBe(
      'https://images.igdb.com/igdb/image/upload/t_thumb/demo.jpg',
    )
  })

  it('conserve une URL absolue et retourne null sans URL', () => {
    expect(normalizeCoverUrl('https://images.igdb.com/demo.jpg')).toBe(
      'https://images.igdb.com/demo.jpg',
    )
    expect(normalizeCoverUrl()).toBeNull()
  })
})

describe('normalizeBaseUrl', () => {
  it('supprime les espaces et le slash final', () => {
    expect(normalizeBaseUrl('  http://localhost:3001/  ')).toBe('http://localhost:3001')
  })

  it('utilise le service local par défaut', () => {
    expect(normalizeBaseUrl()).toBe('http://localhost:3000')
    expect(normalizeBaseUrl('   ')).toBe('http://localhost:3000')
  })
})

describe('igdbUrlWithSize', () => {
  it('normalise le protocole et remplace la taille de la couverture', () => {
    expect(
      igdbUrlWithSize('//images.igdb.com/igdb/image/upload/t_thumb/demo.jpg', 't_1080p'),
    ).toBe('https://images.igdb.com/igdb/image/upload/t_1080p/demo.jpg')
  })

  it('utilise t_cover_big par défaut et retourne null sans URL', () => {
    expect(igdbUrlWithSize('https://images.igdb.com/igdb/image/upload/t_thumb/demo.jpg')).toBe(
      'https://images.igdb.com/igdb/image/upload/t_cover_big/demo.jpg',
    )
    expect(igdbUrlWithSize()).toBeNull()
  })
})
