import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/server/supabaseAdmin'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string | string[] }>
}

type GlossaryEntry = {
  id: string
  slug: string
  title: string
  short_description: string
  detailed_description: string
  author_id: string | null
  published_at: string | null
}

type GlossaryGame = {
  id: string
  igdb_game_id: number
  game_name: string
  cover_url: string | null
  sort_order: number
}

type GlossarySource = {
  id: string
  label: string | null
  url: string
}

type GlossaryAuthor = {
  user_id: string
  username: string
  avatar_url: string | null
}

type AuthorEntry = {
  id: string
  slug: string
  title: string
}

async function getGlossaryEntry(slug: string) {
  const admin = createSupabaseAdminClient()

  const { data: entry, error: entryError } = await admin
    .from('glossary_entries')
    .select('id, slug, title, short_description, detailed_description, author_id, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (entryError) {
    throw new Error(entryError.message)
  }

  if (!entry) {
    return null
  }

  const [{ data: games, error: gamesError }, { data: sources, error: sourcesError }] = await Promise.all([
    admin
      .from('glossary_entry_games')
      .select('id, igdb_game_id, game_name, cover_url, sort_order')
      .eq('glossary_entry_id', entry.id)
      .order('sort_order', { ascending: true }),
    admin
      .from('glossary_entry_sources')
      .select('id, label, url')
      .eq('glossary_entry_id', entry.id)
      .order('created_at', { ascending: true }),
  ])

  if (gamesError) throw new Error(gamesError.message)
  if (sourcesError) throw new Error(sourcesError.message)

  const typedEntry = entry as GlossaryEntry
  const [{ data: author, error: authorError }, { data: otherEntries, error: otherEntriesError }] =
    typedEntry.author_id
      ? await Promise.all([
          admin
            .from('profiles')
            .select('user_id, username, avatar_url')
            .eq('user_id', typedEntry.author_id)
            .maybeSingle(),
          admin
            .from('glossary_entries')
            .select('id, slug, title')
            .eq('author_id', typedEntry.author_id)
            .eq('status', 'published')
            .neq('id', typedEntry.id)
            .order('published_at', { ascending: false })
            .limit(4),
        ])
      : [{ data: null, error: null }, { data: [], error: null }]

  if (authorError) throw new Error(authorError.message)
  if (otherEntriesError) throw new Error(otherEntriesError.message)

  return {
    entry: typedEntry,
    games: (games ?? []) as GlossaryGame[],
    sources: (sources ?? []) as GlossarySource[],
    author: (author ?? null) as GlossaryAuthor | null,
    otherEntries: (otherEntries ?? []) as AuthorEntry[],
  }
}

export default async function GlossaryDetailPage({ params, searchParams }: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const fromAdmin = Array.isArray(resolvedSearchParams.from)
    ? resolvedSearchParams.from.includes('admin')
    : resolvedSearchParams.from === 'admin'
  const glossaryEntryHref = (entrySlug: string) =>
    `/glossaire/${entrySlug}${fromAdmin ? '?from=admin' : ''}`
  const payload = await getGlossaryEntry(slug)

  if (!payload) {
    notFound()
  }

  const { entry, games, sources, author, otherEntries } = payload

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <Link
        href={fromAdmin ? '/admin' : '/glossaire'}
        className="inline-flex text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]"
      >
        ← {fromAdmin ? 'Retour à l’administration' : 'Retour au glossaire'}
      </Link>

      <article className="panel mt-6 rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
          Glossaire RPG
        </p>
        <h1 className="font-display mt-3 text-5xl font-semibold leading-none text-[var(--foreground)] sm:text-6xl">
          {entry.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">{entry.short_description}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Définition</h2>
            <div className="mt-4 space-y-5 text-base leading-8 text-[var(--muted)]">
              {entry.detailed_description.split(/\n{2,}/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="grid content-start gap-4">
            {author ? (
              <section className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent-cool)]">
                  Proposé par
                </h2>
                <Link
                  href={`/glossaire/auteurs/${author.user_id}${fromAdmin ? '?from=admin' : ''}`}
                  className="mt-4 flex items-center gap-3 rounded-[1rem] border border-[var(--line)] bg-white/5 p-3 transition hover:border-[var(--line-strong)]"
                >
                  <span
                    aria-label={`Avatar de ${author.username}`}
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] border border-[var(--line)] bg-black/24 bg-cover bg-center"
                    role="img"
                    style={author.avatar_url ? { backgroundImage: `url(${author.avatar_url})` } : undefined}
                  >
                    {author.avatar_url ? (
                      <span className="sr-only">{author.username}</span>
                    ) : (
                      <span className="font-display text-xl text-[var(--accent)]">
                        {author.username.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span>
                    <span className="block font-display text-2xl leading-tight text-[var(--foreground)]">
                      {author.username}
                    </span>
                    <span className="mt-1 block text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                      Voir ses entrées
                    </span>
                  </span>
                </Link>

                {otherEntries.length ? (
                  <div className="mt-4 grid gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Autres entrées
                    </p>
                    {otherEntries.map((otherEntry) => (
                      <Link
                        key={otherEntry.id}
                        href={glossaryEntryHref(otherEntry.slug)}
                        className="rounded-[0.9rem] border border-[var(--line)] bg-black/12 px-3 py-2 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
                      >
                        {otherEntry.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent-cool)]">
                Sources
              </h2>
              <div className="mt-4 grid gap-3">
                {sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="break-words rounded-[1rem] border border-[var(--line)] bg-white/5 px-4 py-3 text-sm text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
                  >
                    {source.label || source.url}
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </article>

      {games.length ? (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
                Illustrations
              </p>
              <h2 className="font-display mt-2 text-3xl font-semibold text-[var(--foreground)]">
                Jeux liés
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.igdb_game_id}`}
                className="panel group flex gap-4 rounded-[1.5rem] p-4 transition hover:-translate-y-1 hover:border-[var(--line-strong)]"
              >
                <div className="flex h-28 w-22 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[var(--line)] bg-white/8">
                  {game.cover_url ? (
                    <Image
                      src={game.cover_url}
                      alt={game.game_name}
                      width={88}
                      height={112}
                      sizes="88px"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">RPG</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl leading-tight text-[var(--foreground)] transition group-hover:text-[var(--accent)]">
                    {game.game_name}
                  </h3>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                    Voir la fiche
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
