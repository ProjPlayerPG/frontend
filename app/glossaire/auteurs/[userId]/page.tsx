import Link from 'next/link'
import { notFound } from 'next/navigation'
import GlossaryCard from '@/components/glossary/glossaryCard'
import { createSupabaseAdminClient } from '@/lib/server/supabaseAdmin'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ userId: string }>
}

type Author = {
  user_id: string
  username: string
  avatar_url: string | null
}

type GlossaryEntry = {
  id: string
  slug: string
  title: string
  short_description: string
}

async function getAuthorProfile(userId: string) {
  const admin = createSupabaseAdminClient()

  const [{ data: author, error: authorError }, { data: entries, error: entriesError }] = await Promise.all([
    admin
      .from('profiles')
      .select('user_id, username, avatar_url')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('glossary_entries')
      .select('id, slug, title, short_description')
      .eq('author_id', userId)
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
  ])

  if (authorError) throw new Error(authorError.message)
  if (entriesError) throw new Error(entriesError.message)

  if (!author) return null

  return {
    author: author as Author,
    entries: (entries ?? []) as GlossaryEntry[],
  }
}

export default async function GlossaryAuthorPage({ params }: PageProps) {
  const { userId } = await params
  const payload = await getAuthorProfile(userId)

  if (!payload) {
    notFound()
  }

  const { author, entries } = payload

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <Link
        href="/glossaire"
        className="inline-flex text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]"
      >
        Retour au glossaire
      </Link>

      <section className="panel mt-6 rounded-[2rem] p-6 sm:p-8">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
          Contributeur
        </p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            aria-label={`Avatar de ${author.username}`}
            className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--line-strong)] bg-black/24 bg-cover bg-center"
            role="img"
            style={author.avatar_url ? { backgroundImage: `url(${author.avatar_url})` } : undefined}
          >
            {author.avatar_url ? (
              <span className="sr-only">{author.username}</span>
            ) : (
              <span className="font-display text-4xl text-[var(--accent)]">
                {author.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-display text-5xl font-semibold leading-none text-[var(--foreground)]">
              {author.username}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {entries.length} entree{entries.length > 1 ? 's' : ''} publiee{entries.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
          Publications
        </p>
        <h2 className="font-display mt-2 text-4xl font-semibold text-[var(--foreground)]">
          Entrées du glossaire
        </h2>

        {entries.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {entries.map((entry) => (
              <GlossaryCard
                key={entry.id}
                slug={entry.slug}
                title={entry.title}
                description={entry.short_description}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-4 text-sm text-[var(--muted)]">
            Aucune entree publiee pour le moment.
          </p>
        )}
      </section>
    </main>
  )
}
