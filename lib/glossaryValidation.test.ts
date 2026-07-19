import { describe, expect, it } from 'vitest'
import { slugify, validateHttpsSource } from '@/lib/glossaryValidation'

describe('slugify', () => {
  it('normalise les accents, espaces et caractères spéciaux', () => {
    expect(slugify('  Jeu de rôle & Stratégie ! ')).toBe('jeu-de-role-strategie')
  })

  it('limite le slug à 80 caractères', () => {
    expect(slugify('a'.repeat(120))).toHaveLength(80)
  })

  it('retourne une chaîne vide sans caractère exploitable', () => {
    expect(slugify('--- !!! ---')).toBe('')
  })
})

describe('validateHttpsSource', () => {
  it('accepte une URL HTTPS publique', () => {
    expect(validateHttpsSource('https://example.com/article?id=42')).toBe('')
  })

  it('refuse HTTP', () => {
    expect(validateHttpsSource('http://example.com')).toBe('Les sources doivent utiliser HTTPS.')
  })

  it.each([
    'https://localhost/test',
    'https://playerpg.local/test',
  ])('refuse le nom d’hôte local %s', (url) => {
    expect(validateHttpsSource(url)).toBe('Les liens locaux ne sont pas autorises.')
  })

  it.each([
    'https://127.0.0.1/test',
    'https://10.0.0.2/test',
    'https://192.168.1.2/test',
    'https://172.16.0.1/test',
    'https://172.31.255.255/test',
  ])('refuse l’adresse privée %s', (url) => {
    expect(validateHttpsSource(url)).toBe('Les adresses privees ne sont pas autorisees.')
  })

  it.each(['https://0.0.0.0/test', 'https://[::1]/test'])('refuse l’adresse locale %s', (url) => {
    expect(validateHttpsSource(url)).toBe('Les adresses locales ne sont pas autorisees.')
  })

  it('refuse une URL de plus de 2 048 caractères', () => {
    expect(validateHttpsSource(`https://example.com/${'a'.repeat(2030)}`)).toBe(
      'Cette URL est trop longue.',
    )
  })

  it('permet au formulaire de personnaliser le message d’URL invalide', () => {
    expect(validateHttpsSource('pas une URL', 'URL invalide.')).toBe('URL invalide.')
  })
})
