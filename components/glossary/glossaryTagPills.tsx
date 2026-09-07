import Link from 'next/link'
import type { GlossaryTag } from '@/lib/glossaryTags'

type GlossaryTagPillsProps = {
  tags: GlossaryTag[]
  linked?: boolean
  className?: string
}

export default function GlossaryTagPills({
  tags,
  linked = false,
  className = '',
}: GlossaryTagPillsProps) {
  if (!tags.length) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} aria-label="Tags">
      {tags.map((tag) => {
        const classes = 'rounded-full border border-[var(--accent-cool)]/35 bg-[var(--accent-cool)]/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--accent-cool)]'

        return linked ? (
          <Link
            key={tag.id}
            href={`/glossaire?tag=${encodeURIComponent(tag.slug)}`}
            className={`${classes} transition hover:border-[var(--accent-cool)] hover:bg-[var(--accent-cool)]/18`}
          >
            {tag.name}
          </Link>
        ) : (
          <span key={tag.id} className={classes}>
            {tag.name}
          </span>
        )
      })}
    </div>
  )
}
