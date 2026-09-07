export const MAX_GLOSSARY_TAGS_PER_ENTRY = 3

export type GlossaryTag = {
  id: string
  slug: string
  name: string
}

export type GlossaryEntryTag = {
  glossary_entry_id: string
  tag_id: string
}

export function validateGlossaryTagIds(value: unknown) {
  if (!Array.isArray(value)) {
    return { tagIds: [] as string[], error: 'Choisis au moins un tag.' }
  }

  const tagIds = [...new Set(value.filter((tagId): tagId is string =>
    typeof tagId === 'string' && Boolean(tagId.trim()),
  ).map((tagId) => tagId.trim()))]

  if (!tagIds.length) {
    return { tagIds, error: 'Choisis au moins un tag.' }
  }

  if (tagIds.length > MAX_GLOSSARY_TAGS_PER_ENTRY) {
    return {
      tagIds,
      error: `Choisis au maximum ${MAX_GLOSSARY_TAGS_PER_ENTRY} tags.`,
    }
  }

  return { tagIds, error: '' }
}

export function normalizeGlossaryTagName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function tagsByEntryId(
  tags: GlossaryTag[],
  entryTags: GlossaryEntryTag[],
) {
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]))
  const result = new Map<string, GlossaryTag[]>()

  for (const entryTag of entryTags) {
    const tag = tagsById.get(entryTag.tag_id)
    if (!tag) continue

    const currentTags = result.get(entryTag.glossary_entry_id) ?? []
    currentTags.push(tag)
    result.set(entryTag.glossary_entry_id, currentTags)
  }

  for (const currentTags of result.values()) {
    currentTags.sort((first, second) => first.name.localeCompare(second.name, 'fr'))
  }

  return result
}
