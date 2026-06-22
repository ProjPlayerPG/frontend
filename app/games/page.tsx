import { Suspense } from 'react'
import GamesCatalog, { GamesSearchParams } from '@/components/gamesCatalog'
import { CatalogSkeleton } from '@/components/loadingSkeletons'

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<GamesSearchParams>
}) {
  const resolvedSearchParams = await searchParams

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="relative z-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
              Liste de jeux
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
              Chroniques RPG
            </h1>
          </div>
          <p className="hidden max-w-md text-right text-sm leading-6 text-[var(--muted)] md:block">
            Une sélection de jeux à parcourir.
          </p>
        </div>

        <div className="mt-6">
          <Suspense fallback={<CatalogSkeleton />}>
            <GamesCatalog searchParams={resolvedSearchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
