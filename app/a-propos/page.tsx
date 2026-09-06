import Link from 'next/link'
import AboutPageShell from '@/components/about/aboutPageShell'

const paths = [
  {
    href: '/a-propos/guide-rpg',
    eyebrow: 'Recommandations',
    title: 'Le guide RPG',
    description: "Ce que fait l'IA, ce qu'elle reçoit et pourquoi elle ne remplace jamais ton propre avis.",
  },
  {
    href: '/a-propos/glossaire',
    eyebrow: 'Contributions',
    title: 'Le glossaire',
    description: 'Comment les définitions sont proposées, relues et publiées avec la communauté.',
  },
  {
    href: '/a-propos/donnees-jeux',
    eyebrow: 'Transparence',
    title: 'Données de jeu',
    description: "D'où viennent les fiches et quels contenus sont volontairement écartés.",
  },
]

export default function AboutPage() {
  return (
    <AboutPageShell
      currentSlug="index"
      eyebrow="Bienvenue au campement"
      title="PlayerPG, simplement"
      introduction="PlayerPG veut rassembler au même endroit ce qu'il faut pour découvrir et mieux comprendre les RPG. Pas une encyclopédie froide : plutôt un compagnon de route pour trouver un jeu, mettre un mot sur une mécanique et partager ce que l'on connaît."
    >
      <section>
        <h2>Pourquoi ce projet ?</h2>
        <p>
          Le RPG est un genre immense. Entre les sous-genres, les systèmes de combat, les univers et les habitudes de chaque communauté, il est facile de s&apos;y perdre. PlayerPG crée des passerelles entre tout cela, avec des fiches de jeux, un glossaire participatif et un guide de recommandation.
        </p>
      </section>

      <section>
        <h2>Trois chemins pour commencer</h2>
        <div className="not-prose mt-5 grid gap-4 sm:grid-cols-3">
          {paths.map((path) => (
            <Link
              key={path.href}
              href={path.href}
              className="panel group rounded-[1.25rem] p-5 transition hover:-translate-y-1 hover:border-[var(--line-strong)]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-cool)]">
                {path.eyebrow}
              </p>
              <h3 className="font-display mt-2 text-2xl text-[var(--foreground)] transition group-hover:text-[var(--accent)]">
                {path.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{path.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <aside className="about-note">
        <p>
          PlayerPG est encore en construction. Certaines pages évolueront en même temps que la plateforme — et c&apos;est volontairement indiqué quand une information n&apos;est pas encore définitive.
        </p>
      </aside>
    </AboutPageShell>
  )
}
