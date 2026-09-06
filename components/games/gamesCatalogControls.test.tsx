import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GamesPagination } from './gamesCatalogControls'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/games',
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}))

afterEach(() => {
  cleanup()
  replace.mockClear()
})

const filters = {
  page: 4,
  query: '',
  tag: '',
  platform: '',
  releaseYear: '',
  sort: 'release_desc',
}

describe('GamesPagination', () => {
  it('affiche le total et permet d’aller directement à une page', () => {
    render(
      <GamesPagination
        filters={filters}
        canGoBack
        canGoForward
        totalPages={12}
      />,
    )

    expect(screen.getByText('12')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Aller à la page' }), {
      target: { value: '8' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aller' }))

    expect(replace).toHaveBeenCalledWith('/games?page=8', { scroll: false })
  })

  it('ramène une page trop grande à la dernière page disponible', () => {
    render(
      <GamesPagination
        filters={filters}
        canGoBack
        canGoForward
        totalPages={12}
      />,
    )

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Aller à la page' }), {
      target: { value: '999' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aller' }))

    expect(replace).toHaveBeenCalledWith('/games?page=12', { scroll: false })
  })
})
