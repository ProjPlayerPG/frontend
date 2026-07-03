'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { platformFilters, releaseYearFilters, sortOptions, tagFilters } from '@/lib/gamesFilters'

export type GamesFilters = {
  page: number
  tag: string
  platform: string
  releaseYear: string
  sort: string
}

function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-current stroke-[2] text-[var(--foreground)]"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

export default function GamesCatalogControls({
  filters,
}: {
  filters: GamesFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigate = (updates: Partial<GamesFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    const nextFilters = { ...filters, ...updates }

    const entries: Array<[keyof GamesFilters, string]> = [
      ['tag', nextFilters.tag],
      ['platform', nextFilters.platform],
      ['releaseYear', nextFilters.releaseYear],
    ]

    entries.forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    if (nextFilters.sort !== 'release_desc') {
      params.set('sort', nextFilters.sort)
    } else {
      params.delete('sort')
    }

    if (nextFilters.page > 0) {
      params.set('page', String(nextFilters.page + 1))
    } else {
      params.delete('page')
    }

    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  const resetFilters = () => {
    router.replace(pathname, { scroll: false })
  }

  return (
    <div className="panel grid gap-4 rounded-[1.5rem] p-4 md:grid-cols-2 xl:grid-cols-[1fr,1fr,1fr,1fr,auto] xl:items-end">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-[var(--accent-cool)]">Tags</span>
          <SelectShell>
            <select
              value={filters.tag}
              onChange={(event) => navigate({ tag: event.target.value, page: 0 })}
              className="h-12 w-full appearance-none rounded-full border border-[var(--line)] bg-[var(--surface-strong)] py-0 pl-4 pr-12 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--line-strong)]"
            >
              <option value="">Tous les tags</option>
              {tagFilters.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </SelectShell>
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-[var(--accent-cool)]">Plateforme</span>
          <SelectShell>
            <select
              value={filters.platform}
              onChange={(event) => navigate({ platform: event.target.value, page: 0 })}
              className="h-12 w-full appearance-none rounded-full border border-[var(--line)] bg-[var(--surface-strong)] py-0 pl-4 pr-12 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--line-strong)]"
            >
              <option value="">Toutes les plateformes</option>
              {platformFilters.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </SelectShell>
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-[var(--accent-cool)]">Annee de sortie</span>
          <SelectShell>
            <select
              value={filters.releaseYear}
              onChange={(event) => navigate({ releaseYear: event.target.value, page: 0 })}
              className="h-12 w-full appearance-none rounded-full border border-[var(--line)] bg-[var(--surface-strong)] py-0 pl-4 pr-12 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--line-strong)]"
            >
              <option value="">Toutes les annees</option>
              {releaseYearFilters.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </SelectShell>
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-[var(--accent-cool)]">Tri</span>
          <SelectShell>
            <select
              value={filters.sort}
              onChange={(event) => navigate({ sort: event.target.value, page: 0 })}
              className="h-12 w-full appearance-none rounded-full border border-[var(--line)] bg-[var(--surface-strong)] py-0 pl-4 pr-12 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--line-strong)]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SelectShell>
        </label>

        <button
          type="button"
          onClick={resetFilters}
          className="h-12 rounded-full border border-[var(--line)] px-5 text-sm uppercase tracking-[0.18em] text-[var(--muted)] transition hover:bg-white/7 hover:text-[var(--foreground)] md:col-span-2 md:mx-auto md:w-full md:max-w-lg xl:col-span-4"
        >
          Reinitialiser
        </button>
    </div>
  )
}

export function GamesPagination({
  filters,
  canGoBack,
  canGoForward,
}: {
  filters: GamesFilters
  canGoBack: boolean
  canGoForward: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigate = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())

    if (page > 0) {
      params.set('page', String(page + 1))
    } else {
      params.delete('page')
    }

    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="px-2 text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
        Page {filters.page + 1}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate(Math.max(0, filters.page - 1))}
          disabled={!canGoBack}
          className="flex h-11 flex-1 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm uppercase tracking-[0.18em] text-[var(--accent-cool)] transition hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
        >
          Precedent
        </button>
        <button
          type="button"
          onClick={() => navigate(filters.page + 1)}
          disabled={!canGoForward}
          className="flex h-11 flex-1 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
