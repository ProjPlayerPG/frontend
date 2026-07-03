import Link from 'next/link'
import GlossaryForm from '@/components/glossary/glossaryForm'

export default function ProposeGlossaryEntryPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <Link
        href="/glossaire"
        className="inline-flex text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]"
      >
        Retour au glossaire
      </Link>

      <div className="mt-6">
        <GlossaryForm />
      </div>
    </main>
  )
}
