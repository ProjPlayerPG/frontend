import Link from 'next/link'

type AboutNavigationProps = {
  currentSlug: string
}

const groups = [
  {
    title: 'PlayerPG',
    links: [
      { slug: 'index', href: '/a-propos', label: 'À propos' },
      { slug: 'guide-rpg', href: '/a-propos/guide-rpg', label: 'Le guide RPG' },
      { slug: 'glossaire', href: '/a-propos/glossaire', label: 'Le glossaire' },
      { slug: 'faq', href: '/a-propos/faq', label: 'FAQ' },
      { slug: 'donnees-jeux', href: '/a-propos/donnees-jeux', label: 'Données de jeu' },
    ],
  },
  {
    title: 'Vivre ensemble',
    links: [
      { slug: 'regles-communaute', href: '/a-propos/regles-communaute', label: 'Règles de la communauté' },
      { slug: 'contact', href: '/a-propos/contact', label: 'Contactez-nous' },
    ],
  },
  {
    title: 'Cadre légal',
    links: [
      { slug: 'confidentialite', href: '/a-propos/confidentialite', label: 'Protection des données' },
      { slug: 'conditions', href: '/a-propos/conditions', label: "Conditions d'utilisation" },
    ],
  },
]

export default function AboutNavigation({ currentSlug }: AboutNavigationProps) {
  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
        À propos
      </p>
      <nav className="mt-4 grid gap-6" aria-label="Pages d'information">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--foreground)]">
              {group.title}
            </p>
            <div className="grid gap-1 border-l border-[var(--line)] pl-2">
              {group.links.map((link) => {
                const active = currentSlug === link.slug

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-r-[0.8rem] border-l px-3 py-2 text-sm leading-5 transition ${
                      active
                        ? '-ml-[9px] border-[var(--accent)] bg-[var(--accent)]/12 pl-[19px] text-[var(--foreground)]'
                        : 'border-transparent text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <a
        href="https://twitter.com/Nasake46"
        target="_blank"
        rel="noreferrer"
        className="mt-7 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--accent)]"
      >
        Suivre @Nasake46
        <span aria-hidden="true">↗</span>
      </a>
    </aside>
  )
}
