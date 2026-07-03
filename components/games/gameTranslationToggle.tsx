'use client'

import { useState } from 'react'
import { normalizeBaseUrl } from '@/lib/igdb'

type GameTranslationToggleProps = {
  gameId: number
  summary?: string
  storyline?: string
}

type Translation = {
  summary_fr: string | null
  storyline_fr: string | null
}

export default function GameTranslationToggle({ gameId, summary, storyline }: GameTranslationToggleProps) {
  const [language, setLanguage] = useState<'original' | 'fr'>('original')
  const [translation, setTranslation] = useState<Translation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function showFrench() {
    setLanguage('fr')

    if (translation || loading) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
      const response = await fetch(`${baseUrl}/api/games/${gameId}/translation`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.details || data?.error || 'Traduction indisponible.')
      }

      const data = (await response.json()) as Translation
      setTranslation(data)
    } catch (translationError) {
      setError(translationError instanceof Error ? translationError.message : 'Traduction indisponible.')
    } finally {
      setLoading(false)
    }
  }

  const summaryText = language === 'fr' && translation?.summary_fr ? translation.summary_fr : summary
  const storylineText = language === 'fr' && translation?.storyline_fr ? translation.storyline_fr : storyline

  return (
    <div className="mt-8 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Synopsis</p>
        <div className="flex rounded-full border border-[var(--line)] bg-black/18 p-1">
          <button
            type="button"
            onClick={() => setLanguage('original')}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
              language === 'original'
                ? 'bg-[var(--accent)] text-[#101722]'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Original
          </button>
          <button
            type="button"
            onClick={showFrench}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
              language === 'fr'
                ? 'bg-[var(--accent)] text-[#101722]'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Francais
          </button>
        </div>
      </div>

      {loading ? <p className="mt-3 text-sm text-[var(--accent-cool)]">Traduction en cours...</p> : null}
      {error ? (
        <p className="mt-3 rounded-[1rem] border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <p className="mt-3 text-base leading-8 text-[var(--muted)] sm:text-lg">
        {summaryText ?? 'Aucun resume nest disponible pour cette fiche.'}
      </p>

      {storylineText ? (
        <div className="mt-6">
          <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent)]">Histoire</p>
          <p className="mt-3 text-base leading-8 text-[var(--muted)] sm:text-lg">{storylineText}</p>
        </div>
      ) : null}
    </div>
  )
}
