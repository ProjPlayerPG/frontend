import Image from 'next/image'
import Link from 'next/link'
import FavoriteButton from '@/components/games/favoriteButton'
import GameMediaGallery, {
  type GameScreenshot,
  type GameVideo,
} from '@/components/games/gameMediaGallery'
import GameTranslationToggle from '@/components/games/gameTranslationToggle'
import GameProvenanceBadge, {
  type GameProvenance,
} from '@/components/games/gameProvenanceBadge'
import {
  gameDetailsHref,
  gamesByCompanyHref,
  gamesByPlatformHref,
  normalizeGamesReturnTo,
  normalizeGlossaryReturnContext,
} from '@/lib/catalogFilters'
import { igdbUrlWithSize, normalizeBaseUrl } from '@/lib/igdb'

type Game = {
  id: number
  name: string
  summary?: string
  storyline?: string
  genres?: { id: number; name: string }[]
  platforms?: { id: number; name: string }[]
  involved_companies?: {
    id: number
    developer?: boolean
    publisher?: boolean
    company?: { id: number; name: string }
  }[]
  cover?: { id?: number; url?: string }
  first_release_date?: number
  videos?: GameVideo[]
  screenshots?: GameScreenshot[]
  provenance?: GameProvenance
  parent_game?: {
    id: number
    name: string
  }
  dlcs?: RelatedGame[]
  expansions?: RelatedGame[]
}

type RelatedGame = {
  id: number
  name: string
  cover?: { id?: number; url?: string }
}

function formatReleaseDate(timestamp?: number) {
  if (!timestamp) return null

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(timestamp * 1000))
}

function MetadataLinks({
  items,
  hrefFor,
  fallback,
}: {
  items: { id: number; name: string }[]
  hrefFor: (item: { id: number; name: string }) => string
  fallback: string
}) {
  if (!items.length) return fallback

  const visibleItems = items.slice(0, 3)

  return (
    <>
      {visibleItems.map((item, index) => (
        <span key={item.id}>
          {index > 0 ? ', ' : ''}
          <Link
            href={hrefFor(item)}
            className="underline decoration-[var(--line-strong)] underline-offset-4 transition hover:text-[var(--accent)]"
          >
            {item.name}
          </Link>
        </span>
      ))}
      {items.length > 3 ? ` +${items.length - 3}` : ''}
    </>
  )
}

export default async function GameDetails({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    from?: string | string[]
    glossary?: string | string[]
    term?: string | string[]
    returnTo?: string | string[]
  }>
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const fromChatbot = Array.isArray(resolvedSearchParams.from)
    ? resolvedSearchParams.from.includes('chatbot')
    : resolvedSearchParams.from === 'chatbot'
  const fromGlossary = Array.isArray(resolvedSearchParams.from)
    ? resolvedSearchParams.from.includes('glossary')
    : resolvedSearchParams.from === 'glossary'
  const glossaryContext = fromGlossary
    ? normalizeGlossaryReturnContext(
        resolvedSearchParams.glossary,
        resolvedSearchParams.term,
      )
    : null
  const rawReturnTo = Array.isArray(resolvedSearchParams.returnTo)
    ? resolvedSearchParams.returnTo[0]
    : resolvedSearchParams.returnTo
  const catalogReturnTo = normalizeGamesReturnTo(rawReturnTo)
  const returnsToFilteredCatalog = catalogReturnTo !== '/games'
  const gameHref = (gameId: number) =>
    gameDetailsHref(gameId, {
      fromChatbot,
      fromGlossary: glossaryContext ?? undefined,
      returnTo: rawReturnTo ? catalogReturnTo : undefined,
    })
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
  const url = `${baseUrl}/api/games/${id}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="panel rounded-[2rem] p-8">
          <p className="font-display text-3xl text-[var(--foreground)]">Jeu introuvable</p>
          <p className="mt-3 text-sm text-[var(--muted)]">HTTP {res.status}</p>
        </div>
      </main>
    )
  }

  const game: Game = await res.json()
  const coverUrl = igdbUrlWithSize(game.cover?.url, 't_1080p')
  const favoriteCoverUrl = igdbUrlWithSize(game.cover?.url, 't_cover_big')
  const releaseDate = formatReleaseDate(game.first_release_date)
  const platforms = game.platforms?.filter((platform) => platform.id && platform.name) ?? []
  const studios =
    game.involved_companies
      ?.filter((entry) => entry.developer && entry.company?.name)
      .map((entry) => entry.company)
      .filter((company): company is { id: number; name: string } => Boolean(company?.id && company.name)) ?? []
  const publishers =
    game.involved_companies
      ?.filter((entry) => entry.publisher && entry.company?.name)
      .map((entry) => entry.company)
      .filter((company): company is { id: number; name: string } => Boolean(company?.id && company.name)) ?? []
  const relatedContent = [...(game.expansions ?? []), ...(game.dlcs ?? [])].filter(
    (related, index, list) => related.id && list.findIndex((item) => item.id === related.id) === index,
  )

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          href={catalogReturnTo}
          className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
        >
          <span>←</span>
          {returnsToFilteredCatalog ? 'Retour à la recherche' : 'Retour aux jeux'}
        </Link>
        {fromChatbot ? (
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-strong)] bg-[var(--accent)]/12 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/20 hover:text-[var(--foreground)]"
          >
            <span aria-hidden="true">←</span>
            Retour au Guide RPG
          </Link>
        ) : null}
        {glossaryContext ? (
          <Link
            href={`/glossaire/${encodeURIComponent(glossaryContext.slug)}`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-strong)] bg-[var(--accent)]/12 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/20 hover:text-[var(--foreground)]"
          >
            <span aria-hidden="true">←</span>
            {glossaryContext.title
              ? `Retour à « ${glossaryContext.title} »`
              : 'Retour au terme du glossaire'}
          </Link>
        ) : null}
        {game.parent_game?.id ? (
          <Link
            href={gameHref(game.parent_game.id)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-strong)] bg-[var(--accent)]/12 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/20 hover:text-[var(--foreground)]"
          >
            <span aria-hidden="true">{'<'}</span>
            Jeu de base
          </Link>
        ) : null}
      </div>

      <section className="panel relative overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0">
          {coverUrl ? (
            <>
              <Image
                src={coverUrl}
                alt={game.name}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-28 blur-sm"
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(4,9,18,0.78),rgba(7,17,31,0.92))]" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(223,191,122,0.18),transparent_25%),linear-gradient(180deg,#102034,#08111c)]" />
          )}
        </div>

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[320px,1fr] lg:p-10">
          <div className="relative mx-auto w-full max-w-xs lg:mx-0">
            <div className="absolute -inset-3 rounded-[2rem] bg-[radial-gradient(circle,rgba(223,191,122,0.2),transparent_68%)] blur-xl" />
            <div className="relative overflow-hidden rounded-[1.7rem] border border-[var(--line-strong)] bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
              {coverUrl ? (
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={coverUrl}
                    alt={game.name}
                    fill
                    sizes="(max-width: 1024px) min(20rem, calc(100vw - 4rem)), 320px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                  No cover
                </div>
              )}
            </div>
          </div>

          <GameMediaGallery
            gameName={game.name}
            coverUrl={coverUrl}
            videos={game.videos}
            screenshots={game.screenshots}
          />

          <div className="flex flex-col justify-center lg:col-span-2">
            <p className="font-display text-sm uppercase tracking-[0.34em] text-[var(--accent)]">
              Fiche de jeu
            </p>
            <div className="mt-3">
              <GameProvenanceBadge provenance={game.provenance} />
            </div>
            <h1 className="font-display mt-4 text-5xl leading-none text-[var(--foreground)] sm:text-6xl">
              {game.name}
            </h1>

            <div className="mt-6 flex flex-wrap gap-3">
              {game.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-[var(--line)] bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <FavoriteButton gameId={game.id} gameName={game.name} coverUrl={favoriteCoverUrl} />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Parution</p>
                <p className="font-display mt-2 text-2xl text-[var(--foreground)]">
                  {releaseDate ?? 'Date inconnue'}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Plateformes</p>
                <p className="mt-2 text-base font-medium leading-7 text-[var(--foreground)]">
                  <MetadataLinks items={platforms} hrefFor={gamesByPlatformHref} fallback="Non renseignées" />
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Studio</p>
                <p className="mt-2 text-base font-medium leading-7 text-[var(--foreground)]">
                  <MetadataLinks
                    items={studios}
                    hrefFor={(company) => gamesByCompanyHref(company, 'developer')}
                    fallback="Non renseigné"
                  />
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Éditeur</p>
                <p className="mt-2 text-base font-medium leading-7 text-[var(--foreground)]">
                  <MetadataLinks
                    items={publishers}
                    hrefFor={(company) => gamesByCompanyHref(company, 'publisher')}
                    fallback="Non renseigné"
                  />
                </p>
              </div>
            </div>

            <GameTranslationToggle gameId={game.id} summary={game.summary} storyline={game.storyline} />

            <div className="mt-8 max-w-3xl rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
              <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Notes presse</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Les notes presse seront ajoutées via des sources stables et officielles lorsque disponibles.
                PlayerPG evite le scraping fragile pour garder des fiches fiables.
              </p>
            </div>

            {relatedContent.length > 0 ? (
              <div className="mt-8 max-w-3xl rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">
                  Extensions et contenus lies
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {relatedContent.slice(0, 6).map((related) => {
                    const relatedCoverUrl = igdbUrlWithSize(related.cover?.url, 't_cover_big')

                    return (
                      <Link
                        key={related.id}
                        href={gameHref(related.id)}
                        className="flex items-center gap-3 rounded-[1rem] border border-[var(--line)] bg-white/5 p-3 transition hover:border-[var(--line-strong)] hover:bg-white/8"
                      >
                        <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[0.8rem] border border-[var(--line)] bg-black/18">
                          {relatedCoverUrl ? (
                            <Image
                              src={relatedCoverUrl}
                              alt={related.name}
                              width={48}
                              height={64}
                              sizes="48px"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[0.55rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                              DLC
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-display truncate text-xl leading-none text-[var(--foreground)]">
                            {related.name}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--accent-cool)]">
                            Voir la fiche
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
