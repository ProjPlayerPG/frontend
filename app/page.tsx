import GamesList from "../app/games/page";
import GameSearchBar from "../components/gameSearchBar";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="panel relative z-20 rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(223,191,122,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(127,183,201,0.12),transparent_24%)]" />

        <div className="relative max-w-3xl">
          <h1 className="font-display mt-4 text-5xl font-semibold leading-none text-[var(--foreground)] sm:text-6xl">
            PlayerPG, la référence moderne du RPG
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Le but de ce projet est de créer une encyclopédie de jeux de rôle avec des fiches détaillées et des critiques
            afin d&apos;aider les joueurs à en savoir plus sur ce genre magnifique.
          </p>

          <div className="mt-8">
            <GameSearchBar />
          </div>
        </div>
      </section>

      <section className="relative z-0 mt-10">
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
            Une selection de jeux a parcourir.
          </p>
        </div>

        <div className="mt-6">
          <GamesList />
        </div>
      </section>
    </main>
  );
}
