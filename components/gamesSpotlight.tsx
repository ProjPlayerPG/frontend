import Image from 'next/image'
import Link from 'next/link'
import { igdbUrlWithSize, normalizeBaseUrl } from '@/lib/igdb'

type SpotlightGame = {
  id: number
  name: string
  summary?: string
  cover?: { url?: string }
  genres?: { name: string }[]
  first_release_date?: number
}

function formatReleaseDate(timestamp?: number) {
  if (!timestamp) return 'Date inconnue'

  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp * 1000))
}

function pickDisplayGenre(genres?: { name: string }[]) {
  const selectedGenre = genres?.find((genre) => !genre.name.toLowerCase().includes('role-playing'))
  return selectedGenre?.name ?? 'RPG'
}

async function fetchSpotlightGames() {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
  const url = new URL(`${baseUrl}/api/games/spotlight`)
  url.searchParams.set('mode', 'recent')
  url.searchParams.set('limit', '6')

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  return Array.isArray(data) ? (data as SpotlightGame[]) : []
}

export default async function GamesSpotlight() {
  const games = await fetchSpotlightGames()

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {games.map((game) => {
        const coverUrl = igdbUrlWithSize(game.cover?.url, 't_cover_big')
        const genre = pickDisplayGenre(game.genres)

        return (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="panel group flex min-h-52 gap-4 overflow-hidden rounded-[1.5rem] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-[var(--line-strong)]"
          >
            <div className="relative h-44 w-32 shrink-0 overflow-hidden rounded-[1.15rem] border border-[var(--line)] bg-white/8 sm:h-48 sm:w-36">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={game.name}
                  fill
                  sizes="(max-width: 640px) 128px, 144px"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  RPG
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-cool)]">
                Nouvelle sortie - {formatReleaseDate(game.first_release_date)}
              </p>
              <h3 className="font-display mt-3 line-clamp-2 text-3xl leading-none text-[var(--foreground)]">
                {game.name}
              </h3>

              <div className="mt-4 flex justify-start">
                <span className="max-w-full truncate rounded-full border border-[var(--line)] bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  {genre}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                {game.summary ?? 'Une fiche recente a decouvrir dans le catalogue PlayerPG.'}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
