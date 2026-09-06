import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import GameMediaGallery, { selectPreferredVideo } from './gameMediaGallery'

afterEach(cleanup)

describe('selectPreferredVideo', () => {
  it('privilégie un trailer de lancement et ignore les identifiants invalides', () => {
    expect(
      selectPreferredVideo([
        { name: 'Gameplay video', video_id: 'gameplay123' },
        { name: 'Launch Trailer', video_id: 'launch_123' },
        { name: 'Official Trailer', video_id: 'https://example.com' },
      ]),
    ).toEqual({ name: 'Launch Trailer', video_id: 'launch_123' })
  })
})

describe('GameMediaGallery', () => {
  it('ne charge le lecteur YouTube privé qu’après une action de l’utilisateur', () => {
    render(
      <GameMediaGallery
        gameName="Dark Souls III"
        coverUrl={null}
        videos={[{ name: 'Launch Trailer', video_id: '8UPmw8YwV98' }]}
        screenshots={[{ id: 1, url: '//images.igdb.com/igdb/image/upload/t_thumb/example.jpg' }]}
      />,
    )

    expect(screen.queryByTitle('Launch Trailer — Dark Souls III')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Voir Launch Trailer de Dark Souls III' }))

    expect(screen.getByTitle('Launch Trailer — Dark Souls III')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/8UPmw8YwV98?rel=0&playsinline=1',
    )
  })

  it('affiche un repli propre lorsqu’IGDB ne fournit aucun média', () => {
    render(<GameMediaGallery gameName="RPG oublié" coverUrl={null} />)

    expect(screen.getByText('Aucun média supplémentaire disponible sur IGDB.')).toBeInTheDocument()
  })
})
