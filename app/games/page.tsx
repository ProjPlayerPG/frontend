import { Suspense } from 'react'
import GameSearchBar from '@/components/games/gameSearchBar'
import GamesCatalog, { GamesSearchParams } from '@/components/games/gamesCatalog'
import { CatalogSkeleton } from '@/components/shared/loadingSkeletons'
import { filtersFromSearchParams } from '@/lib/catalogFilters'

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<GamesSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const filters = filtersFromSearchParams(resolvedSearchParams)
  const contextTitle = filters.companyId
    ? `Jeux ${filters.companyRole === 'publisher' ? 'édités' : 'développés'} par ${filters.companyName || 'ce studio'}`
    : filters.platformId
      ? `Jeux sur ${filters.platformName || 'cette plateforme'}`
      : ''

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="relative z-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
              {filters.query ? 'Résultats de recherche' : contextTitle ? 'Sélection RPG' : 'Catalogue RPG'}
            </p>
            <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">
              {filters.query ? `« ${filters.query} »` : contextTitle || 'Explorer les jeux'}
            </h1>
          </div>
          <p className="hidden max-w-md text-right text-sm leading-6 text-[var(--muted)] md:block">
            Recherchez un titre précis ou parcourez le catalogue à l&apos;aide des filtres.
          </p>
        </div>

        <div className="mt-7">
          <GameSearchBar initialQuery={filters.query} />
        </div>
      </section>

      <section className="relative z-0 mt-8">
        <Suspense fallback={<CatalogSkeleton />}>
          <GamesCatalog searchParams={resolvedSearchParams} />
        </Suspense>
      </section>
    </main>
  )
}
