const entries = [
  { term: 'CRPG', description: 'RPG sur ordinateur construit autour de choix, statistiques et exploration tactique.' },
  { term: 'JRPG', description: 'RPG japonais marque par une progression narrative forte et des combats structures.' },
  { term: 'ARPG', description: 'RPG centre sur des actions directes, du rythme et une execution en temps reel.' },
  { term: 'Build', description: 'Combinaison de competences, equipements et statistiques qui definit un style de jeu.' },
]

export default function GlossairePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Glossaire</p>
        <h1 className="font-display mt-2 text-5xl font-semibold leading-none text-[var(--foreground)]">
          Les mots du RPG
        </h1>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <article key={entry.term} className="panel rounded-[1.5rem] p-6">
            <h2 className="font-display text-3xl text-[var(--foreground)]">{entry.term}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{entry.description}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
