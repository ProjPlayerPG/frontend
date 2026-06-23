'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Role = 'user' | 'admin'

type Profile = {
  user_id: string
  username: string
  email: string
  avatar_url: string | null
  role: Role
  created_at: string
}

type GlossaryEntry = {
  id: string
  slug: string
  title: string
  short_description: string
  detailed_description: string
  status: 'pending' | 'published' | 'rejected'
  author_id: string
  created_at: string
}

type GlossaryEntryGame = {
  id: string
  glossary_entry_id: string
  igdb_game_id: number
  game_name: string
  cover_url: string | null
  sort_order: number
}

type Author = {
  user_id: string
  username: string
  email: string
}

type AdminPayload = {
  profiles: Profile[]
  pendingEntries: GlossaryEntry[]
  entryGames: GlossaryEntryGame[]
  authors: Author[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [pendingEntries, setPendingEntries] = useState<GlossaryEntry[]>([])
  const [entryGames, setEntryGames] = useState<GlossaryEntryGame[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const authorsById = useMemo(
    () => new Map(authors.map((author) => [author.user_id, author])),
    [authors],
  )

  const gamesByEntryId = useMemo(() => {
    const map = new Map<string, GlossaryEntryGame[]>()

    for (const game of entryGames) {
      const games = map.get(game.glossary_entry_id) ?? []
      games.push(game)
      map.set(game.glossary_entry_id, games)
    }

    return map
  }, [entryGames])

  async function adminFetch(options?: RequestInit) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) {
      throw new Error('Connecte-toi avec un compte admin.')
    }

    const response = await fetch('/api/admin', {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.error || 'Action admin impossible.')
    }

    return payload
  }

  async function loadAdminData() {
    setLoading(true)
    setError('')

    try {
      const payload = (await adminFetch()) as AdminPayload
      setProfiles(payload.profiles)
      setPendingEntries(payload.pendingEntries)
      setEntryGames(payload.entryGames)
      setAuthors(payload.authors)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger l administration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function updateRole(profile: Profile, role: Role) {
    if (profile.role === role) {
      return
    }

    setSubmitting(`role-${profile.user_id}`)
    setError('')
    setMessage('')

    try {
      const payload = (await adminFetch({
        method: 'PATCH',
        body: JSON.stringify({
          action: 'updateRole',
          userId: profile.user_id,
          role,
        }),
      })) as { profile: Profile }

      setProfiles((currentProfiles) =>
        currentProfiles.map((currentProfile) =>
          currentProfile.user_id === payload.profile.user_id ? payload.profile : currentProfile,
        ),
      )
      setMessage(`${profile.username} est maintenant ${role === 'admin' ? 'admin' : 'utilisateur'}.`)
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'Impossible de changer le role.')
    } finally {
      setSubmitting('')
    }
  }

  async function reviewEntry(entry: GlossaryEntry, status: 'published' | 'rejected') {
    setSubmitting(`${status}-${entry.id}`)
    setError('')
    setMessage('')

    try {
      await adminFetch({
        method: 'PATCH',
        body: JSON.stringify({
          action: 'reviewGlossaryEntry',
          entryId: entry.id,
          status,
        }),
      })

      setPendingEntries((currentEntries) => currentEntries.filter((currentEntry) => currentEntry.id !== entry.id))
      setMessage(`${entry.title} a ete ${status === 'published' ? 'publie' : 'rejete'}.`)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Impossible de moderer cette entree.')
    } finally {
      setSubmitting('')
    }
  }

  if (loading) {
    return (
      <section className="panel rounded-[2rem] p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Administration</p>
        <div className="mt-8 grid gap-4">
          <div className="h-36 animate-pulse rounded-[1.5rem] border border-[var(--line)] bg-white/5" />
          <div className="h-36 animate-pulse rounded-[1.5rem] border border-[var(--line)] bg-white/5" />
        </div>
      </section>
    )
  }

  return (
    <section className="grid gap-8">
      <div>
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
          Administration
        </p>
        <h1 className="font-display mt-2 text-5xl font-semibold leading-none text-[var(--foreground)]">
          Tableau de bord
        </h1>
      </div>

      {message ? (
        <p className="rounded-[1rem] border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[1rem] border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <section className="panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Moderation</p>
            <h2 className="font-display mt-2 text-3xl text-[var(--foreground)]">Glossaire en attente</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {pendingEntries.length} proposition{pendingEntries.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          {pendingEntries.length === 0 ? (
            <p className="rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-4 text-sm text-[var(--muted)]">
              Aucune proposition en attente.
            </p>
          ) : null}

          {pendingEntries.map((entry) => {
            const author = authorsById.get(entry.author_id)
            const games = gamesByEntryId.get(entry.id) ?? []

            return (
              <article key={entry.id} className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-cool)]">
                      {author?.username ?? 'Auteur inconnu'} - {formatDate(entry.created_at)}
                    </p>
                    <h3 className="font-display mt-2 text-3xl text-[var(--foreground)]">{entry.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{entry.short_description}</p>
                    <p className="mt-4 line-clamp-4 text-sm leading-7 text-[var(--muted)]/90">
                      {entry.detailed_description}
                    </p>
                    {games.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {games.map((game) => (
                          <span
                            key={game.id}
                            className="rounded-full border border-[var(--line)] bg-white/6 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]"
                          >
                            {game.game_name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-3 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => reviewEntry(entry, 'published')}
                      disabled={Boolean(submitting)}
                      className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#101722] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {submitting === `published-${entry.id}` ? 'Publication...' : 'Publier'}
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewEntry(entry, 'rejected')}
                      disabled={Boolean(submitting)}
                      className="rounded-full border border-red-300/25 bg-red-400/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-400/18 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {submitting === `rejected-${entry.id}` ? 'Rejet...' : 'Rejeter'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Roles</p>
            <h2 className="font-display mt-2 text-3xl text-[var(--foreground)]">Utilisateurs</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {profiles.length} compte{profiles.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {profiles.map((profile) => (
            <article
              key={profile.user_id}
              className="grid gap-4 rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-4 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-2xl text-[var(--foreground)]">{profile.username}</h3>
                  <span className="rounded-full border border-[var(--line)] bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {profile.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{profile.email}</p>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={() => updateRole(profile, 'user')}
                  disabled={Boolean(submitting) || profile.role === 'user'}
                  className="rounded-full border border-[var(--line)] bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Utilisateur
                </button>
                <button
                  type="button"
                  onClick={() => updateRole(profile, 'admin')}
                  disabled={Boolean(submitting) || profile.role === 'admin'}
                  className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)]/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Admin
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
