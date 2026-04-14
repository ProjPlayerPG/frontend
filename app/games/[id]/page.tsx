import Image from 'next/image'
import Link from 'next/link'
import { igdbUrlWithSize, normalizeBaseUrl } from '@/lib/igdb'

type Game = {
  id: number
  name: string
  summary?: string
  genres?: { id: number; name: string }[]
  cover?: { id?: number; url?: string }
  first_release_date?: number
}

function formatReleaseDate(timestamp?: number) {
  if (!timestamp) return null

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(timestamp * 1000))
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
  const releaseDate = formatReleaseDate(game.first_release_date)

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
        >
          <span>←</span>
          Retour à la liste
        </Link>
      </div>

      <section className="panel relative overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0">
          {coverUrl ? (
            <>
              <Image src={coverUrl} alt={game.name} fill className="object-cover opacity-28 blur-sm" />
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
                  <Image src={coverUrl} alt={game.name} fill className="object-cover" />
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

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Statut</p>
                <p className="font-display mt-2 text-2xl text-[var(--foreground)]">Legende repertoriee</p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Parution</p>
                <p className="font-display mt-2 text-2xl text-[var(--foreground)]">
                  {releaseDate ?? 'Date inconnue'}
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-3xl">
              <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Synopsis</p>
              <p className="mt-3 text-base leading-8 text-[var(--muted)] sm:text-lg">
                {game.summary ?? 'Aucun resume n est disponible pour cette fiche.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
