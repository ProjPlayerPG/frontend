import GlossaryCard from '@/components/glossary/glossaryCard'
import { createSupabaseAdminClient } from '@/lib/server/supabaseAdmin'

type GlossaryEntry = {
  id: string
  slug: string
  title: string
  short_description: string
}

async function getLatestPublishedEntries() {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('glossary_entries')
    .select('id, slug, title, short_description')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4)

  if (error) throw new Error(error.message)

  return (data ?? []) as GlossaryEntry[]
}

export default async function LatestGlossaryEntries() {
  const entries = await getLatestPublishedEntries()

  if (!entries.length) {
    return (
      <div className="panel rounded-[1.5rem] p-6 text-sm leading-7 text-[var(--muted)]">
        Aucune entrée n&apos;est encore publiée. Les premiers termes apparaîtront ici après validation.
      </div>
    )
  }

  return (
    <>
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
    </>
  )
}
