import Link from 'next/link'
import GlossaryCard from '@/components/glossary/glossaryCard'
import { createSupabaseAdminClient } from '@/lib/server/supabaseAdmin'

export const dynamic = 'force-dynamic'

type GlossaryEntry = {
  id: string
  slug: string
  title: string
  short_description: string
}

async function getPublishedEntries() {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('glossary_entries')
    .select('id, slug, title, short_description')
    .eq('status', 'published')
    .order('title', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as GlossaryEntry[]
}

export default async function GlossairePage() {
  const entries = await getPublishedEntries()

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Glossaire</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="font-display text-5xl font-semibold leading-none text-[var(--foreground)]">
            Les mots du RPG
          </h1>
          <Link
            href="/glossaire/proposer"
            className="inline-flex w-fit rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--background-deep)] transition hover:bg-[var(--accent-strong)]"
          >
            Proposer un terme
          </Link>
        </div>
      </section>

      {entries.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
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
        <section className="panel rounded-[1.5rem] p-6">
          <h2 className="font-display text-3xl text-[var(--foreground)]">Aucune entrée publiée</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Les premières propositions apparaîtront ici après validation.
          </p>
        </section>
      )}

    </main>
  )
}
