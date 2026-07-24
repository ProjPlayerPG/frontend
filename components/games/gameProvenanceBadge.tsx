export type GameProvenance = 'official' | 'community' | 'unverified'

const provenancePresentation: Record<
  GameProvenance,
  { label: string; title: string; className: string }
> = {
  official: {
    label: 'Licence officielle',
    title: 'IGDB relie ce jeu à une franchise ou une collection officielle.',
    className: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
  },
  community: {
    label: 'Contenu communautaire',
    title: 'Ce jeu est identifié comme un fangame, un mod ou un ROM hack.',
    className: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
  },
  unverified: {
    label: 'Statut non confirmé',
    title: 'Les données IGDB ne permettent pas de confirmer le caractère officiel de ce jeu.',
    className: 'border-white/15 bg-white/5 text-[var(--muted)]',
  },
}

export default function GameProvenanceBadge({
  provenance,
  compact = false,
}: {
  provenance?: GameProvenance
  compact?: boolean
}) {
  if (!provenance) return null

  const presentation = provenancePresentation[provenance]

  return (
    <span
      title={presentation.title}
      className={`inline-flex items-center rounded-full border font-bold uppercase ${
        compact
          ? 'px-2 py-1 text-[0.6rem] tracking-[0.14em]'
          : 'px-3 py-1 text-xs tracking-[0.18em]'
      } ${presentation.className}`}
    >
      {presentation.label}
    </span>
  )
}
