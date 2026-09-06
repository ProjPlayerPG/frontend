import Link from 'next/link'

const footerGroups = [
  {
    title: 'PlayerPG',
    links: [
      { href: '/a-propos', label: 'À propos' },
      { href: '/a-propos/guide-rpg', label: "Comment fonctionne l'IA" },
      { href: '/a-propos/glossaire', label: 'Le glossaire' },
      { href: '/a-propos/donnees-jeux', label: 'Données de jeu' },
    ],
  },
  {
    title: 'Besoin d’aide ?',
    links: [
      { href: '/a-propos/faq', label: 'FAQ' },
      { href: '/a-propos/regles-communaute', label: 'Règles de la communauté' },
      { href: '/a-propos/contact', label: 'Contactez-nous' },
    ],
  },
  {
    title: 'En toute transparence',
    links: [
      { href: '/a-propos/confidentialite', label: 'Protection des données' },
      { href: '/a-propos/conditions', label: "Conditions d'utilisation" },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-[var(--line)] bg-[rgba(4,9,18,0.72)]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_2fr] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--accent)]/10 text-[var(--accent)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.6]" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="m15.4 8.6-2 4.8-4.8 2 2-4.8 4.8-2Z" />
                </svg>
              </span>
              <span className="font-display text-3xl font-semibold text-[var(--foreground)]">PlayerPG</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[var(--muted)]">
              Un endroit pour découvrir les RPG, comprendre leurs mots et garder en tête les aventures qui te font envie.
            </p>
            <a
              href="https://twitter.com/Nasake46"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/5 px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-white/8"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.4L6.48 22H3.36l7.25-8.29L2.97 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.84h1.73L8.43 4.05H6.58L17.8 19.84Z" />
              </svg>
              @Nasake46
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-cool)]">
                  {group.title}
                </p>
                <nav className="mt-4 grid gap-3" aria-label={group.title}>
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="w-fit text-sm leading-6 text-[var(--muted)] transition hover:text-[var(--accent)]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--line)] pt-6 text-xs leading-5 text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PlayerPG. Conçu avec passion pour le RPG.</p>
          <p>
            Données de jeu fournies par{' '}
            <a
              href="https://www.igdb.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--foreground)] transition hover:text-[var(--accent)]"
            >
              IGDB
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
