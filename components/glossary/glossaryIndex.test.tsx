import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import GlossaryIndex from './glossaryIndex'

const entries = [
  {
    id: '1',
    slug: 'action-rpg',
    title: 'Action RPG',
    short_description: 'Un RPG dont les combats se jouent en temps réel.',
    tags: [{ id: 'combat', slug: 'combat', name: 'Combat' }],
  },
  {
    id: '2',
    slug: 'strategie-au-tour-par-tour',
    title: 'Stratégie au tour par tour',
    short_description: 'Chaque personnage agit à son tour.',
    tags: [
      { id: 'combat', slug: 'combat', name: 'Combat' },
      { id: 'technique', slug: 'technique', name: 'Technique' },
    ],
  },
]

afterEach(cleanup)

describe('GlossaryIndex', () => {
  it('filtre immédiatement les termes, sans tenir compte des accents', () => {
    render(<GlossaryIndex entries={entries} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'strategie' } })

    expect(screen.getByRole('heading', { name: 'Stratégie au tour par tour' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Action RPG' })).not.toBeInTheDocument()
    expect(screen.getByText('1 terme trouvé')).toBeInTheDocument()
  })

  it('cherche aussi dans la description et affiche un état vide utile', () => {
    render(<GlossaryIndex entries={entries} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'combats' } })
    expect(screen.getByRole('heading', { name: 'Action RPG' })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'introuvable' } })
    expect(screen.getByRole('heading', { name: 'Aucun terme trouvé' })).toBeInTheDocument()
  })

  it('combine le filtre par tag avec la recherche et cherche dans le nom des tags', () => {
    render(<GlossaryIndex entries={entries} />)

    fireEvent.click(screen.getByRole('button', { name: 'Technique' }))
    expect(screen.getByRole('heading', { name: 'Stratégie au tour par tour' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Action RPG' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tous' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'technique' } })
    expect(screen.getByRole('heading', { name: 'Stratégie au tour par tour' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Action RPG' })).not.toBeInTheDocument()
  })
})
