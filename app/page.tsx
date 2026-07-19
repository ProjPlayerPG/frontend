import Link from 'next/link'
import { Suspense } from 'react'
import GamesSpotlight from '@/components/games/gamesSpotlight'
import RandomRpgButton from '@/components/games/randomRpgButton'
import LatestGlossaryEntries from '@/components/glossary/latestGlossaryEntries'
import { GlossarySkeleton, SpotlightSkeleton } from '@/components/shared/loadingSkeletons'

export const dynamic = 'force-dynamic'

const discoveryLinks = [
  {
    href: '/glossaire',
    eyebrow: 'Comprendre',
    title: 'Le glossaire RPG',
    description: 'Retrouvez les notions, mécaniques et expressions propres au jeu de rôle.',
  },
  {
    href: '/personnages',
    eyebrow: 'Partager',
    title: 'Les personnages',
    description: 'Découvrez des personnages de RPG et partagez ceux que vous connaissez',
  },
  {
    href: '/chatbot',
    eyebrow: 'Être conseillé',
    title: 'Le guide PlayerPG',
    description: 'Échangez avec le guide pour trouver un RPG adapté à vos envies.',
  },
]

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="panel relative z-20 overflow-hidden rounded-[1.75rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(223,191,122,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(127,183,201,0.12),transparent_24%)]" />

        <div className="relative">
          <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
            Explorer · Comprendre · Partager
          </p>
          <h1 className="font-display mt-3 text-balance text-4xl font-semibold leading-none text-[var(--foreground)] sm:text-5xl">
            PlayerPG, votre portail vers l&apos;univers du RPG
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Découvrez de nouveaux jeux, approfondissez le vocabulaire du genre et partagez vos personnages avec la communauté.
          </p>

          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href="/games"
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--background-deep)] shadow-[0_14px_34px_rgba(223,191,122,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
            >
              Explorer les jeux
            </Link>
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
            Une sélection automatique fondée sur les sorties récentes.
          </p>
        </div>

        <div className="mt-6">
          <Suspense fallback={<SpotlightSkeleton />}>
            <GamesSpotlight />
          </Suspense>
        </div>
      </section>

      <section className="relative z-0 mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
              Dernières publications
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
              Nouveautés du glossaire
            </h2>
          </div>
          <p className="hidden max-w-md text-right text-sm leading-6 text-[var(--muted)] md:block">
            Les termes récemment validés par l&apos;équipe PlayerPG.
          </p>
        </div>

        <Suspense fallback={<GlossarySkeleton />}>
          <LatestGlossaryEntries />
        </Suspense>
      </section>

      <section className="relative z-0 mt-12">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
            Aller plus loin
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
            Explorer PlayerPG
          </h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {discoveryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="panel group rounded-[1.5rem] p-6 transition hover:-translate-y-1 hover:border-[var(--line-strong)] hover:bg-white/[0.02]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-cool)]">
                {item.eyebrow}
              </p>
              <h3 className="font-display mt-3 text-3xl text-[var(--foreground)] transition group-hover:text-[var(--accent)]">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
