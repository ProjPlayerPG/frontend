import type { SupabaseClient } from '@supabase/supabase-js'
import {
  tagsByEntryId,
  type GlossaryEntryTag,
  type GlossaryTag,
} from '@/lib/glossaryTags'

export async function getGlossaryTags(client: SupabaseClient) {
  const { data, error } = await client
    .from('glossary_tags')
    .select('id, slug, name')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as GlossaryTag[]
}

export async function getGlossaryTagsByEntryId(
  client: SupabaseClient,
  entryIds: string[],
) {
  if (!entryIds.length) return new Map<string, GlossaryTag[]>()

  const [{ data: tags, error: tagsError }, { data: entryTags, error: entryTagsError }] =
    await Promise.all([
      client.from('glossary_tags').select('id, slug, name').order('name', { ascending: true }),
      client
        .from('glossary_entry_tags')
        .select('glossary_entry_id, tag_id')
        .in('glossary_entry_id', entryIds),
    ])

  if (tagsError) throw new Error(tagsError.message)
  if (entryTagsError) throw new Error(entryTagsError.message)

  return tagsByEntryId(
    (tags ?? []) as GlossaryTag[],
    (entryTags ?? []) as GlossaryEntryTag[],
  )
}
