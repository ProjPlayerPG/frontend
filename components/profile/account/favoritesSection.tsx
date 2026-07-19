import Link from 'next/link'
import type { Favorite } from '@/components/profile/account/types'

export default function FavoritesSection({
  favorites,
  loading,
  onRemove,
}: {
  favorites: Favorite[]
  loading: boolean
  onRemove: (favorite: Favorite) => void
}) {
  return (
    <section className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-black/14 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Mes favoris</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Les jeux que tu veux garder sous la main.
          </p>
        </div>
        <Link
          href="/games"
          className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:text-[var(--foreground)]"
        >
          Explorer
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="h-20 animate-pulse rounded-[1.2rem] border border-[var(--line)] bg-white/5" />
        ) : null}

        {!loading && favorites.length === 0 ? (
          <p className="rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-4 text-sm text-[var(--muted)]">
            Aucun favori pour le moment.
          </p>
        ) : null}

        {!loading
          ? favorites.map((favorite) => (
              <article
                key={favorite.id}
                className="grid gap-4 rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-3 sm:grid-cols-[64px,1fr_auto] sm:items-center"
              >
                <div
                  aria-label={`Couverture de ${favorite.game_name}`}
                  className="h-16 w-16 rounded-[0.9rem] border border-[var(--line)] bg-white/5 bg-cover bg-center"
                  role="img"
                  style={favorite.cover_url ? { backgroundImage: `url(${favorite.cover_url})` } : undefined}
                />
                <h2 className="font-display text-2xl leading-tight text-[var(--foreground)]">
                  {favorite.game_name}
                </h2>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link
                    href={`/games/${favorite.igdb_game_id}`}
                    className="inline-flex min-h-11 min-w-24 items-center justify-center rounded-full border border-[var(--line-strong)] bg-white/6 px-5 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12"
                  >
                    Voir
                  </Link>
                  <button
                    type="button"
                    onClick={() => onRemove(favorite)}
                    className="rounded-full border border-red-300/25 bg-red-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-400/18"
                  >
                    Retirer
                  </button>
                </div>
              </article>
            ))
          : null}
      </div>
    </section>
  )
}
