'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import GlossaryCard from '@/components/glossary/glossaryCard'
import type { GlossaryTag } from '@/lib/glossaryTags'

type GlossaryEntry = {
  id: string
  slug: string
  title: string
  short_description: string
  tags: GlossaryTag[]
}

function searchableText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
}

export default function GlossaryIndex({
  entries,
  initialTag = '',
}: {
  entries: GlossaryEntry[]
  initialTag?: string
}) {
  const [query, setQuery] = useState('')
  const availableTags = useMemo(() => {
    const tags = new Map<string, GlossaryTag>()
    entries.flatMap((entry) => entry.tags).forEach((tag) => tags.set(tag.id, tag))
    return [...tags.values()].sort((first, second) => first.name.localeCompare(second.name, 'fr'))
  }, [entries])
  const [selectedTag, setSelectedTag] = useState(() =>
    availableTags.some((tag) => tag.slug === initialTag) ? initialTag : '',
  )
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = searchableText(deferredQuery.trim())
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const hasSelectedTag = !selectedTag || entry.tags.some((tag) => tag.slug === selectedTag)
      if (!hasSelectedTag) return false
      if (!normalizedQuery) return true

      return searchableText(
        `${entry.title} ${entry.short_description} ${entry.tags.map((tag) => tag.name).join(' ')}`,
      ).includes(normalizedQuery)
    })
  }, [entries, normalizedQuery, selectedTag])

  const hasFilters = Boolean(normalizedQuery || selectedTag)

  return (
    <section aria-labelledby="glossary-search-title">
      <div className="panel mb-6 rounded-[1.5rem] p-4 sm:p-5">
        <label htmlFor="glossary-search" className="sr-only">
          Rechercher un terme dans le glossaire
        </label>
        <div className="flex min-h-16 items-center gap-4 rounded-[1.15rem] border border-[var(--line)] bg-black/18 px-5 transition focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_rgba(223,191,122,0.08)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6 shrink-0 fill-none stroke-[var(--accent)] stroke-[1.8]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
          <input
            id="glossary-search"
            name="glossarySearch"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un terme, une mécanique…"
            autoComplete="off"
            className="h-16 min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/70 sm:text-lg"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 rounded-full border border-[var(--line)] px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
            >
              Effacer
            </button>
          ) : null}
        </div>
        {availableTags.length ? (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrer par tag">
            <button
              type="button"
              aria-pressed={!selectedTag}
              onClick={() => setSelectedTag('')}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                !selectedTag
                  ? 'border-[var(--accent-cool)] bg-[var(--accent-cool)] text-[#101722]'
                  : 'border-[var(--line)] bg-white/5 text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Tous
            </button>
            {availableTags.map((tag) => {
              const active = selectedTag === tag.slug

              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedTag(active ? '' : tag.slug)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                    active
                      ? 'border-[var(--accent-cool)] bg-[var(--accent-cool)] text-[#101722]'
                      : 'border-[var(--line)] bg-white/5 text-[var(--muted)] hover:border-[var(--accent-cool)]/60 hover:text-[var(--foreground)]'
                  }`}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        ) : null}
        <p
          id="glossary-search-title"
          aria-live="polite"
          className="mt-3 px-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
        >
          {hasFilters
            ? `${filteredEntries.length} ${filteredEntries.length > 1 ? 'termes trouvés' : 'terme trouvé'}`
            : `${entries.length} ${entries.length > 1 ? 'termes disponibles' : 'terme disponible'}`}
        </p>
      </div>

      {filteredEntries.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredEntries.map((entry) => (
            <GlossaryCard
              key={entry.id}
              slug={entry.slug}
              title={entry.title}
              description={entry.short_description}
              tags={entry.tags}
            />
          ))}
        </div>
      ) : (
        <div className="panel rounded-[1.5rem] p-6">
          <h2 className="font-display text-3xl text-[var(--foreground)]">Aucun terme trouvé</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Essaie un mot plus court ou une autre façon de décrire ce que tu cherches.
          </p>
        </div>
      )}
    </section>
  )
}
