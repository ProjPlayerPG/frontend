import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPanel from '@/components/admin/adminPanel'

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}))

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}))

const profile = {
  user_id: 'author-1',
  username: 'Alice',
  email: 'alice@example.com',
  avatar_url: null,
  role: 'user',
  created_at: '2026-07-01T10:00:00.000Z',
}

const pendingEntry = {
  id: 'entry-pending',
  slug: 'tactical-rpg',
  title: 'Tactical RPG',
  short_description: 'Une définition courte.',
  detailed_description: 'Première ligne.\n\nDeuxième ligne détaillée.',
  status: 'pending',
  author_id: profile.user_id,
  created_at: '2026-07-20T10:00:00.000Z',
}

const publishedEntry = {
  ...pendingEntry,
  id: 'entry-published',
  slug: 'action-rpg',
  title: 'Action RPG',
  status: 'published',
  created_at: '2026-07-19T10:00:00.000Z',
}

describe('AdminPanel', () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: 'admin-token',
        },
      },
    })
  })

  it('affiche le détail, le profil auteur et supprime une publication après confirmation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          profiles: [profile],
          pendingEntries: [pendingEntry],
          allEntries: [pendingEntry, publishedEntry],
          entryGames: [
            {
              id: 'game-1',
              glossary_entry_id: pendingEntry.id,
              igdb_game_id: 42,
              game_name: 'Final Fantasy Tactics',
              cover_url: null,
              sort_order: 0,
            },
          ],
          entrySources: [
            {
              id: 'source-1',
              glossary_entry_id: pendingEntry.id,
              label: 'Source officielle',
              url: 'https://example.com/source',
            },
          ],
          authors: [profile],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          entry: {
            id: publishedEntry.id,
            title: publishedEntry.title,
            status: publishedEntry.status,
          },
        }),
      )

    vi.stubGlobal('fetch', fetchMock)
    render(<AdminPanel />)

    expect(await screen.findByRole('heading', { name: 'Glossaire en attente' })).toBeInTheDocument()
    const publishedArticle = screen.getByRole('heading', { name: 'Action RPG' }).closest('article')
    expect(publishedArticle).not.toBeNull()

    const detailButton = within(publishedArticle!).getByRole('button', { name: 'Voir le détail' })
    const onlineLink = within(publishedArticle!).getByRole('link', { name: 'Voir en ligne' })

    expect(onlineLink).toHaveAttribute(
      'href',
      '/glossaire/action-rpg?from=admin',
    )
    expect(onlineLink.style.fontFamily).toBe(detailButton.style.fontFamily)
    expect(onlineLink.style.fontWeight).toBe(detailButton.style.fontWeight)
    expect(onlineLink.style.fontSize).toBe(detailButton.style.fontSize)
    expect(onlineLink.style.color).toBe(detailButton.style.color)

    fireEvent.click(screen.getByRole('button', { name: 'Examiner' }))
    expect(screen.getByText('Proposition complète')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Final Fantasy Tactics' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Source officielle/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Alice/ }))
    expect(screen.getAllByText('alice@example.com')).toHaveLength(2)
    expect(screen.getByText(/2 contribution/)).toBeInTheDocument()

    fireEvent.click(within(publishedArticle!).getByRole('button', { name: 'Supprimer' }))
    expect(within(publishedArticle!).getByText(/suppression est définitive/i)).toBeInTheDocument()

    fireEvent.click(within(publishedArticle!).getByRole('button', { name: 'Confirmer' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Action RPG' })).not.toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/admin',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ entryId: publishedEntry.id }),
      }),
    )
  })
})
