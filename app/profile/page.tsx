export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="panel rounded-[2rem] p-8">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Compte</p>
        <h1 className="font-display mt-2 text-5xl font-semibold leading-none text-[var(--foreground)]">
          Profil joueur
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Bibliotheque</p>
            <p className="font-display mt-2 text-2xl text-[var(--foreground)]">0 jeux suivis</p>
          </div>
          <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Critiques</p>
            <p className="font-display mt-2 text-2xl text-[var(--foreground)]">0 publiee</p>
          </div>
        </div>
      </section>
    </main>
  )
}
