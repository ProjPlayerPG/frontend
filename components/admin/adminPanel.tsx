'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  MAX_GLOSSARY_TAGS_PER_ENTRY,
  type GlossaryEntryTag,
  type GlossaryTag,
} from '@/lib/glossaryTags'

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

type GlossaryEntrySource = {
  id: string
  glossary_entry_id: string
  label: string | null
  url: string
}

type Author = {
  user_id: string
  username: string
  email: string
  avatar_url: string | null
  role: Role
  created_at: string
}

type AdminPayload = {
  profiles: Profile[]
  pendingEntries: GlossaryEntry[]
  allEntries: GlossaryEntry[]
  entryGames: GlossaryEntryGame[]
  entrySources: GlossaryEntrySource[]
  glossaryTags: GlossaryTag[]
  entryTags: GlossaryEntryTag[]
  authors: Author[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

const statusDetails = {
  pending: {
    label: 'En attente',
    className: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  },
  published: {
    label: 'Publiée',
    className: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100',
  },
  rejected: {
    label: 'Rejetée',
    className: 'border-red-300/25 bg-red-400/10 text-red-100',
  },
} satisfies Record<GlossaryEntry['status'], { label: string; className: string }>

const libraryActionTypography = {
  fontFamily: 'var(--font-body), sans-serif',
  fontWeight: 400,
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: 'var(--accent-cool)',
} as const

function StatusBadge({ status }: { status: GlossaryEntry['status'] }) {
  const details = statusDetails[status]

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${details.className}`}>
      {details.label}
    </span>
  )
}

function EntryTagEditor({
  entry,
  tags,
  selectedTagIds,
  disabled,
  onToggle,
}: {
  entry: GlossaryEntry
  tags: GlossaryTag[]
  selectedTagIds: string[]
  disabled: boolean
  onToggle: (entry: GlossaryEntry, tagId: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        Catégories
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedTagIds.includes(tag.id)

          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(entry, tag.id)}
              disabled={disabled}
              className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-wait disabled:opacity-55 ${
                selected
                  ? 'border-[var(--accent-cool)] bg-[var(--accent-cool)]/18 text-[var(--accent-cool)]'
                  : 'border-[var(--line)] bg-white/5 text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {tag.name}
            </button>
          )
        })}
      </div>
      {!selectedTagIds.length ? (
        <p className="mt-2 text-xs text-amber-100">Cette ancienne entrée doit encore être catégorisée.</p>
      ) : null}
    </div>
  )
}

export default function AdminPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [pendingEntries, setPendingEntries] = useState<GlossaryEntry[]>([])
  const [allEntries, setAllEntries] = useState<GlossaryEntry[]>([])
  const [entryGames, setEntryGames] = useState<GlossaryEntryGame[]>([])
  const [entrySources, setEntrySources] = useState<GlossaryEntrySource[]>([])
  const [glossaryTags, setGlossaryTags] = useState<GlossaryTag[]>([])
  const [entryTags, setEntryTags] = useState<GlossaryEntryTag[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [tagDeleteConfirmationId, setTagDeleteConfirmationId] = useState('')
  const [expandedPendingEntryId, setExpandedPendingEntryId] = useState('')
  const [expandedLibraryEntryId, setExpandedLibraryEntryId] = useState('')
  const [expandedAuthorId, setExpandedAuthorId] = useState('')
  const [deleteConfirmationId, setDeleteConfirmationId] = useState('')
  const [entryStatusFilter, setEntryStatusFilter] = useState<'all' | GlossaryEntry['status']>('all')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const authorsById = useMemo(
    () => new Map(authors.map((author) => [author.user_id, author])),
    [authors],
  )

  const entryCountsByAuthorId = useMemo(() => {
    const counts = new Map<string, number>()

    for (const entry of allEntries) {
      counts.set(entry.author_id, (counts.get(entry.author_id) ?? 0) + 1)
    }

    return counts
  }, [allEntries])

  const filteredEntries = useMemo(
    () =>
      entryStatusFilter === 'all'
        ? allEntries
        : allEntries.filter((entry) => entry.status === entryStatusFilter),
    [allEntries, entryStatusFilter],
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

  const sourcesByEntryId = useMemo(() => {
    const map = new Map<string, GlossaryEntrySource[]>()

    for (const source of entrySources) {
      const sources = map.get(source.glossary_entry_id) ?? []
      sources.push(source)
      map.set(source.glossary_entry_id, sources)
    }

    return map
  }, [entrySources])

  const tagIdsByEntryId = useMemo(() => {
    const map = new Map<string, string[]>()

    for (const entryTag of entryTags) {
      const tagIds = map.get(entryTag.glossary_entry_id) ?? []
      tagIds.push(entryTag.tag_id)
      map.set(entryTag.glossary_entry_id, tagIds)
    }

    return map
  }, [entryTags])

  const tagUsageCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entryTag of entryTags) {
      counts.set(entryTag.tag_id, (counts.get(entryTag.tag_id) ?? 0) + 1)
    }
    return counts
  }, [entryTags])

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
      setAllEntries(payload.allEntries ?? payload.pendingEntries)
      setEntryGames(payload.entryGames)
      setEntrySources(payload.entrySources)
      setGlossaryTags(payload.glossaryTags ?? [])
      setEntryTags(payload.entryTags ?? [])
      setAuthors(payload.authors)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger l’administration.')
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
      setError(roleError instanceof Error ? roleError.message : 'Impossible de changer le rôle.')
    } finally {
      setSubmitting('')
    }
  }

  async function createTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newTagName.trim()
    if (!name) return

    setSubmitting('create-tag')
    setError('')
    setMessage('')

    try {
      const payload = (await adminFetch({
        method: 'PATCH',
        body: JSON.stringify({ action: 'createGlossaryTag', name }),
      })) as { tag: GlossaryTag }

      setGlossaryTags((currentTags) =>
        [...currentTags, payload.tag].sort((first, second) => first.name.localeCompare(second.name, 'fr')),
      )
      setNewTagName('')
      setMessage(`Le tag « ${payload.tag.name} » est disponible.`)
    } catch (tagError) {
      setError(tagError instanceof Error ? tagError.message : 'Impossible de créer le tag.')
    } finally {
      setSubmitting('')
    }
  }

  async function deleteTag(tag: GlossaryTag) {
    setSubmitting(`delete-tag-${tag.id}`)
    setError('')
    setMessage('')

    try {
      await adminFetch({
        method: 'DELETE',
        body: JSON.stringify({ tagId: tag.id }),
      })
      setGlossaryTags((currentTags) => currentTags.filter((currentTag) => currentTag.id !== tag.id))
      setTagDeleteConfirmationId('')
      setMessage(`Le tag « ${tag.name} » a été supprimé.`)
    } catch (tagError) {
      setError(tagError instanceof Error ? tagError.message : 'Impossible de supprimer le tag.')
    } finally {
      setSubmitting('')
    }
  }

  async function toggleEntryTag(entry: GlossaryEntry, tagId: string) {
    const currentTagIds = tagIdsByEntryId.get(entry.id) ?? []
    const selected = currentTagIds.includes(tagId)
    const nextTagIds = selected
      ? currentTagIds.filter((currentTagId) => currentTagId !== tagId)
      : [...currentTagIds, tagId]

    if (!nextTagIds.length) {
      setError('Une entrée doit conserver au moins un tag.')
      return
    }

    if (nextTagIds.length > MAX_GLOSSARY_TAGS_PER_ENTRY) {
      setError(`Une entrée peut avoir au maximum ${MAX_GLOSSARY_TAGS_PER_ENTRY} tags.`)
      return
    }

    setSubmitting(`tags-${entry.id}`)
    setError('')
    setMessage('')

    try {
      const payload = (await adminFetch({
        method: 'PATCH',
        body: JSON.stringify({
          action: 'updateGlossaryEntryTags',
          entryId: entry.id,
          tagIds: nextTagIds,
        }),
      })) as { entryTags: GlossaryEntryTag[] }

      setEntryTags((currentEntryTags) => [
        ...currentEntryTags.filter((entryTag) => entryTag.glossary_entry_id !== entry.id),
        ...payload.entryTags,
      ])
      setMessage(`Tags de « ${entry.title} » mis à jour.`)
    } catch (tagError) {
      setError(tagError instanceof Error ? tagError.message : 'Impossible de modifier les tags.')
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
      setAllEntries((currentEntries) =>
        currentEntries.map((currentEntry) =>
          currentEntry.id === entry.id
            ? { ...currentEntry, status }
            : currentEntry,
        ),
      )
      setMessage(`${entry.title} a été ${status === 'published' ? 'publiée' : 'rejetée'}.`)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Impossible de modérer cette entrée.')
    } finally {
      setSubmitting('')
    }
  }

  async function deleteEntry(entry: GlossaryEntry) {
    setSubmitting(`delete-${entry.id}`)
    setError('')
    setMessage('')

    try {
      await adminFetch({
        method: 'DELETE',
        body: JSON.stringify({ entryId: entry.id }),
      })

      setPendingEntries((currentEntries) =>
        currentEntries.filter((currentEntry) => currentEntry.id !== entry.id),
      )
      setAllEntries((currentEntries) =>
        currentEntries.filter((currentEntry) => currentEntry.id !== entry.id),
      )
      setEntryGames((currentGames) =>
        currentGames.filter((game) => game.glossary_entry_id !== entry.id),
      )
      setEntrySources((currentSources) =>
        currentSources.filter((source) => source.glossary_entry_id !== entry.id),
      )
      setExpandedPendingEntryId((currentId) => currentId === entry.id ? '' : currentId)
      setExpandedLibraryEntryId((currentId) => currentId === entry.id ? '' : currentId)
      setDeleteConfirmationId('')
      setMessage(`${entry.title} a été supprimée définitivement.`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer cette entrée.')
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
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Modération</p>
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
            const sources = sourcesByEntryId.get(entry.id) ?? []
            const selectedTagIds = tagIdsByEntryId.get(entry.id) ?? []
            const isExpanded = expandedPendingEntryId === entry.id
            const isAuthorExpanded = expandedAuthorId === entry.author_id

            return (
              <article key={entry.id} className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAuthorId(isAuthorExpanded ? '' : entry.author_id)
                          }
                          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
                        >
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-white/7 bg-cover bg-center text-sm text-[var(--accent)]"
                            style={author?.avatar_url ? { backgroundImage: `url(${author.avatar_url})` } : undefined}
                          >
                            {author?.avatar_url ? null : (author?.username?.[0] ?? '?').toUpperCase()}
                          </span>
                          {author?.username ?? 'Auteur inconnu'}
                        </button>
                        <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                    <h3 className="font-display mt-2 text-3xl text-[var(--foreground)]">{entry.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{entry.short_description}</p>
                      {!isExpanded ? (
                        <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-7 text-[var(--muted)]/90">
                          {entry.detailed_description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3 lg:max-w-xs lg:justify-end">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedPendingEntryId(isExpanded ? '' : entry.id)}
                        className="rounded-full border border-[var(--line-strong)] bg-white/6 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-cool)] transition hover:bg-white/10"
                      >
                        {isExpanded ? 'Réduire' : 'Examiner'}
                      </button>
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

                  {isAuthorExpanded ? (
                    <div className="grid gap-4 rounded-[1.2rem] border border-[var(--line-strong)] bg-white/5 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
                      <span
                        className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line-strong)] bg-white/7 bg-cover bg-center font-display text-2xl text-[var(--accent)]"
                        style={author?.avatar_url ? { backgroundImage: `url(${author.avatar_url})` } : undefined}
                      >
                        {author?.avatar_url ? null : (author?.username?.[0] ?? '?').toUpperCase()}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-2xl text-[var(--foreground)]">
                            {author?.username ?? 'Auteur inconnu'}
                          </p>
                          {author ? (
                            <span className="rounded-full border border-[var(--line)] bg-black/14 px-3 py-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                              {author.role}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {author?.email ?? 'Adresse indisponible'}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--accent-cool)]">
                          {author
                            ? `Inscrit le ${formatDate(author.created_at)} · ${entryCountsByAuthorId.get(author.user_id) ?? 0} contribution(s)`
                            : 'Profil indisponible'}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {isExpanded ? (
                    <div className="grid gap-5 border-t border-[var(--line)] pt-5">
                      <EntryTagEditor
                        entry={entry}
                        tags={glossaryTags}
                        selectedTagIds={selectedTagIds}
                        disabled={submitting === `tags-${entry.id}`}
                        onToggle={toggleEntryTag}
                      />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                          Proposition complète
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]/90">
                          {entry.detailed_description}
                        </p>
                      </div>

                      {games.length ? (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                            Jeux associés
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {games.map((game) => (
                              <a
                                key={game.id}
                                href={`/games/${game.igdb_game_id}`}
                                className="rounded-full border border-[var(--line)] bg-white/6 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
                              >
                                {game.game_name}
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {sources.length ? (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                            Sources
                          </p>
                          <div className="mt-3 grid gap-2">
                            {sources.map((source) => (
                              <a
                                key={source.id}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="break-all rounded-[1rem] border border-[var(--line)] bg-white/6 px-4 py-3 text-sm text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
                              >
                                <span className="font-bold text-[var(--foreground)]">
                                  {source.label || 'Source'}
                                </span>
                                <span className="mt-1 block text-xs">{source.url}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Catégorisation</p>
            <h2 className="font-display mt-2 text-3xl text-[var(--foreground)]">Tags du glossaire</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Ajoute des catégories réutilisables. Un tag utilisé doit d’abord être retiré de toutes les entrées avant sa suppression.
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {glossaryTags.length} tag{glossaryTags.length > 1 ? 's' : ''}
          </p>
        </div>

        <form onSubmit={createTag} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Nom du nouveau tag</span>
            <input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              minLength={2}
              maxLength={30}
              placeholder="Ex. Économie"
              className="w-full rounded-full border border-[var(--line)] bg-black/18 px-5 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            disabled={submitting === 'create-tag' || newTagName.trim().length < 2}
            className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#101722] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting === 'create-tag' ? 'Ajout...' : 'Ajouter le tag'}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {glossaryTags.map((tag) => {
            const usageCount = tagUsageCounts.get(tag.id) ?? 0
            const confirming = tagDeleteConfirmationId === tag.id

            return (
              <div
                key={tag.id}
                className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/5 py-1 pl-4 pr-1"
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-cool)]">
                  {tag.name}
                </span>
                <span className="text-[0.65rem] text-[var(--muted)]">{usageCount}</span>
                {confirming ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setTagDeleteConfirmationId('')}
                      className="rounded-full px-2 py-1 text-[0.65rem] uppercase text-[var(--muted)]"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTag(tag)}
                      disabled={Boolean(submitting)}
                      className="rounded-full bg-red-400/18 px-2 py-1 text-[0.65rem] font-bold uppercase text-red-100 disabled:opacity-50"
                    >
                      Confirmer
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    aria-label={`Supprimer le tag ${tag.name}`}
                    onClick={() => setTagDeleteConfirmationId(tag.id)}
                    disabled={usageCount > 0 || Boolean(submitting)}
                    title={usageCount ? 'Ce tag est encore utilisé' : 'Supprimer ce tag'}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-[var(--muted)] transition hover:bg-red-400/15 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Publications</p>
            <h2 className="font-display mt-2 text-3xl text-[var(--foreground)]">Toutes les entrées</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Consulte et supprime une proposition, qu’elle soit en attente, publiée ou rejetée.
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {filteredEntries.length} entrée{filteredEntries.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(['all', 'pending', 'published', 'rejected'] as const).map((status) => {
            const active = entryStatusFilter === status
            const label = status === 'all' ? 'Toutes' : statusDetails[status].label

            return (
              <button
                key={status}
                type="button"
                onClick={() => setEntryStatusFilter(status)}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                  active
                    ? 'border-[var(--accent-strong)] bg-[var(--accent)] text-[#101722]'
                    : 'border-[var(--line)] bg-white/5 text-[var(--muted)] hover:bg-white/8 hover:text-[var(--foreground)]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="mt-5 grid gap-3">
          {filteredEntries.length === 0 ? (
            <p className="rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-4 text-sm text-[var(--muted)]">
              Aucune entrée dans cette catégorie.
            </p>
          ) : null}

          {filteredEntries.map((entry) => {
            const author = authorsById.get(entry.author_id)
            const games = gamesByEntryId.get(entry.id) ?? []
            const sources = sourcesByEntryId.get(entry.id) ?? []
            const selectedTagIds = tagIdsByEntryId.get(entry.id) ?? []
            const isExpanded = expandedLibraryEntryId === entry.id
            const isConfirmingDelete = deleteConfirmationId === entry.id

            return (
              <article
                key={entry.id}
                className="rounded-[1.25rem] border border-[var(--line)] bg-black/12 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={entry.status} />
                      <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {author?.username ?? 'Auteur inconnu'} · {formatDate(entry.created_at)}
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-2xl text-[var(--foreground)]">{entry.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{entry.short_description}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-md lg:justify-end">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedLibraryEntryId(isExpanded ? '' : entry.id)}
                      style={libraryActionTypography}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/5 px-4 py-2 text-center uppercase tracking-[0.14em] transition hover:bg-white/8"
                    >
                      {isExpanded ? 'Masquer' : 'Voir le détail'}
                    </button>
                    {entry.status === 'published' ? (
                      <a
                        href={`/glossaire/${entry.slug}?from=admin`}
                        style={libraryActionTypography}
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/5 px-4 py-2 text-center uppercase tracking-[0.14em] transition hover:bg-white/8"
                      >
                        Voir en ligne
                      </a>
                    ) : null}
                    {isConfirmingDelete ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmationId('')}
                          disabled={Boolean(submitting)}
                          className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white/7 disabled:opacity-50"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEntry(entry)}
                          disabled={Boolean(submitting)}
                          className="rounded-full border border-red-300/35 bg-red-500/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-100 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submitting === `delete-${entry.id}` ? 'Suppression...' : 'Confirmer'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmationId(entry.id)}
                        disabled={Boolean(submitting)}
                        className="rounded-full border border-red-300/25 bg-red-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-100 transition hover:bg-red-400/18 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                {isConfirmingDelete ? (
                  <p className="mt-4 rounded-[1rem] border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100">
                    Cette suppression est définitive et retire aussi les jeux et sources associés.
                  </p>
                ) : null}

                {isExpanded ? (
                  <div className="mt-5 grid gap-5 border-t border-[var(--line)] pt-5">
                    <EntryTagEditor
                      entry={entry}
                      tags={glossaryTags}
                      selectedTagIds={selectedTagIds}
                      disabled={submitting === `tags-${entry.id}`}
                      onToggle={toggleEntryTag}
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                        Contenu complet
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]/90">
                        {entry.detailed_description}
                      </p>
                    </div>
                    {games.length ? (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                          Jeux associés
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {games.map((game) => (
                            <a
                              key={game.id}
                              href={`/games/${game.igdb_game_id}`}
                              className="rounded-full border border-[var(--line)] bg-white/6 px-3 py-2 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
                            >
                              {game.game_name}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {sources.length ? (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                          Sources
                        </p>
                        <div className="mt-3 grid gap-2">
                          {sources.map((source) => (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="break-all rounded-[1rem] border border-[var(--line)] bg-white/6 px-4 py-3 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
                            >
                              {source.label || source.url}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Rôles</p>
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
