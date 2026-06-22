import { Suspense } from "react";
import GamesCatalog, { GamesSearchParams } from "../components/gamesCatalog";
import GamesSpotlight from "../components/gamesSpotlight";
import { CatalogSkeleton, SpotlightSkeleton } from "../components/loadingSkeletons";
import RandomRpgButton from "../components/randomRpgButton";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<GamesSearchParams>
}) {
  const resolvedSearchParams = await searchParams

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="panel relative z-20 rounded-[1.75rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(223,191,122,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(127,183,201,0.12),transparent_24%)]" />

        <div className="relative max-w-3xl">
          <h1 className="font-display mt-2 text-4xl font-semibold leading-none text-[var(--foreground)] sm:text-5xl">
            PlayerPG, la reference moderne du RPG
          </h1>

          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="#sorties"
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--background-deep)] shadow-[0_14px_34px_rgba(223,191,122,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
            >
              Voir les sorties
            </a>
            <a
              href="#catalogue"
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--accent-cool)] bg-[var(--accent-cool)]/18 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)] shadow-[0_14px_34px_rgba(127,183,201,0.14)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-cool)]/28"
            >
              Explorer le catalogue
            </a>
            <RandomRpgButton />
          </div>
        </div>
      </section>

      <section id="sorties" className="relative z-0 mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
              Jeux du moment
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
              Nouvelles sorties RPG
            </h2>
          </div>
          <p className="hidden max-w-md text-right text-sm leading-6 text-[var(--muted)] md:block">
            Une sélection automatique basée sur les sorties recentes.
          </p>
        </div>

        <div className="mt-6">
          <Suspense fallback={<SpotlightSkeleton />}>
            <GamesSpotlight />
          </Suspense>
        </div>
      </section>

      <section id="catalogue" className="relative z-0 mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
              Liste de jeux
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
              Chroniques RPG
            </h2>
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
  );
}
