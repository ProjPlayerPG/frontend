import Link from 'next/link'

type GlossaryCardProps = {
  slug: string
  title: string
  description: string
}

export default function GlossaryCard({ slug, title, description }: GlossaryCardProps) {
  return (
    <Link
      href={`/glossaire/${slug}`}
      className="panel group block rounded-[1.5rem] p-6 transition hover:-translate-y-1 hover:border-[var(--line-strong)] hover:bg-white/[0.02]"
    >
      <article>
        <h2 className="font-display text-3xl text-[var(--foreground)] transition group-hover:text-[var(--accent)]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          Lire l&apos;entrée
        </p>
      </article>
    </Link>
  )
}
