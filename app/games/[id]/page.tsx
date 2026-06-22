import Image from 'next/image'
import Link from 'next/link'
import FavoriteButton from '@/components/favoriteButton'
import GameTranslationToggle from '@/components/gameTranslationToggle'
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

function compactList(items: string[], fallback: string) {
  if (!items.length) return fallback

  if (items.length <= 3) {
    return items.join(', ')
  }

  return `${items.slice(0, 3).join(', ')} +${items.length - 3}`
}

export default async function GameDetails({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
  const platforms = game.platforms?.map((platform) => platform.name).filter(Boolean) ?? []
  const studios =
    game.involved_companies
      ?.filter((entry) => entry.developer && entry.company?.name)
      .map((entry) => entry.company?.name)
      .filter((name): name is string => Boolean(name)) ?? []
  const publishers =
    game.involved_companies
      ?.filter((entry) => entry.publisher && entry.company?.name)
      .map((entry) => entry.company?.name)
      .filter((name): name is string => Boolean(name)) ?? []
  const relatedContent = [...(game.expansions ?? []), ...(game.dlcs ?? [])].filter(
    (related, index, list) => related.id && list.findIndex((item) => item.id === related.id) === index,
  )

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
        >
          <span>←</span>
          Retour à la liste
        </Link>
        {game.parent_game?.id ? (
          <Link
            href={`/games/${game.parent_game.id}`}
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

          <div className="flex flex-col justify-center">
            <p className="font-display text-sm uppercase tracking-[0.34em] text-[var(--accent)]">
              Fiche de jeu
            </p>
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
                  {compactList(platforms, 'Non renseignees')}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Studio</p>
                <p className="mt-2 text-base font-medium leading-7 text-[var(--foreground)]">
                  {compactList(studios, 'Non renseigne')}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Editeur</p>
                <p className="mt-2 text-base font-medium leading-7 text-[var(--foreground)]">
                  {compactList(publishers, 'Non renseigne')}
                </p>
              </div>
            </div>

            <GameTranslationToggle gameId={game.id} summary={game.summary} storyline={game.storyline} />

            <div className="mt-8 max-w-3xl rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
              <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Notes presse</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Les notes presse seront ajoutees via des sources stables et officielles lorsque disponibles.
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
                        href={`/games/${related.id}`}
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
