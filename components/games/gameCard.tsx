import { igdbUrlWithSize } from '@/lib/igdb'
import Image from 'next/image'
import Link from 'next/link'

type Game = {
  id: number
  name: string
  cover?: { url?: string }
  genres?: { name: string }[]
  first_release_date?: number
}

function formatReleaseYear(timestamp?: number) {
  if (!timestamp) return null
  return new Date(timestamp * 1000).getFullYear()
}

export default function GameCard({ game }: { game: Game }) {
  const coverUrl = igdbUrlWithSize(game.cover?.url, 't_cover_big')
  const releaseYear = formatReleaseYear(game.first_release_date)
  const genres = game.genres?.slice(0, 2).map((genre) => genre.name) ?? []

  return (
    <Link
      href={`/games/${game.id}`}
      className="panel group flex w-full flex-col gap-5 overflow-hidden rounded-[1.75rem] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-[var(--line-strong)] sm:flex-row sm:items-center sm:p-5"
    >
      <div className="relative h-56 w-full overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-white/8 sm:h-36 sm:w-28 sm:shrink-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={game.name}
            fill
            sizes="(max-width: 640px) calc(100vw - 2rem), 112px"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
            No cover
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--accent-cool)]">
          <span>Chronique</span>
          {releaseYear ? <span>{releaseYear}</span> : null}
        </div>

        <h3 className="font-display mt-3 text-3xl leading-none text-[var(--foreground)] sm:text-[2.1rem]">
          {game.name}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {(genres.length > 0 ? genres : ['RPG']).map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-[var(--line)] bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-center">
        <span className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent)]">
          Voir la fiche
        </span>
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-white/6 text-[var(--accent)] transition group-hover:bg-[var(--accent)]/12">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  )
}
