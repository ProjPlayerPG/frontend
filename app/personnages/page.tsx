const archetypes = [
  { name: 'Mage', role: 'Degats elementaires, controle et soutien fragile.' },
  { name: 'Guerrier', role: 'Presence au front, protection et puissance physique.' },
  { name: 'Voleur', role: 'Mobilite, critiques, pieges et exploration.' },
  { name: 'Soigneur', role: 'Restauration, prevention et stabilite du groupe.' },
]

export default function PersonnagesPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Personnages</p>
        <h1 className="font-display mt-2 text-5xl font-semibold leading-none text-[var(--foreground)]">
          Archetypes et roles
        </h1>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {archetypes.map((archetype) => (
          <article key={archetype.name} className="panel rounded-[1.5rem] p-6">
            <h2 className="font-display text-3xl text-[var(--foreground)]">{archetype.name}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{archetype.role}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
