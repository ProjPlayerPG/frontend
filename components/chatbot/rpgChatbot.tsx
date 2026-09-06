'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  loadChatbotHistory,
  saveChatbotHistory,
  type ChatbotRecommendation,
} from '@/lib/chatbotPersistence'
import { normalizeBaseUrl } from '@/lib/igdb'
import { supabase } from '@/lib/supabaseClient'

const requiredPromptPrefix = 'Je veux'

function promptCompletion(value: string) {
  return value.trim().replace(/^je\s+veux\b[\s,:-]*/i, '')
}

export default function RpgChatbot() {
  const [message, setMessage] = useState('')
  const [recommendations, setRecommendations] = useState<ChatbotRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestInFlight = useRef(false)

  useEffect(() => {
    const history = loadChatbotHistory()
    if (!history) return

    setMessage(promptCompletion(history.message))
    setRecommendations(history.recommendations)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (requestInFlight.current) return

    const completion = promptCompletion(message)
    const query = `${requiredPromptPrefix} ${completion}`.trim()

    if (completion.length < 3) {
      setError('Complète la phrase pour décrire le RPG que tu cherches.')
      return
    }

    requestInFlight.current = true
    setLoading(true)
    setError('')

    try {
      const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)
      const { data: sessionData } = await supabase.auth.getSession()
      const response = await fetch(`${baseUrl}/api/chat/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ message: query }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.details || data?.error || 'Recommandation indisponible.')
      }

      const data = (await response.json()) as { recommendations?: ChatbotRecommendation[] }
      const nextRecommendations = data.recommendations ?? []

      setMessage(completion)
      setRecommendations(nextRecommendations)
      saveChatbotHistory({ message: query, recommendations: nextRecommendations })
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Recommandation indisponible.')
    } finally {
      requestInFlight.current = false
      setLoading(false)
    }
  }

  return (
    <section className="relative z-0 mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
            Guide RPG
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
            Trouver ta prochaine aventure
          </h2>
        </div>
        <p className="hidden max-w-md text-right text-sm leading-6 text-[var(--muted)] md:block">
          Décris ton envie, PlayerPG propose des RPG adaptés.
        </p>
      </div>

      <div className="panel mt-6 rounded-[1.5rem] p-5">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="flex min-w-0 items-center rounded-[1.1rem] border border-[var(--line)] bg-black/18 transition focus-within:border-[var(--accent)]">
            <span className="shrink-0 border-r border-[var(--line)] px-4 py-3 font-medium text-[var(--accent)]">
              {requiredPromptPrefix}
            </span>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              aria-label="Compléter la demande commençant par Je veux"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/60"
              placeholder="un tactical RPG récent avec une bonne histoire"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#101722] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? 'Recherche...' : 'Demander'}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-[1rem] border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        {recommendations.length ? (
          <div className="mt-5 grid gap-3">
            {recommendations.map((recommendation) => (
              <article
                key={recommendation.id}
                className="rounded-[1.2rem] border border-[var(--line)] bg-black/14 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl text-[var(--foreground)]">{recommendation.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{recommendation.reason}</p>
                  </div>
                  <Link
                    href={`/games/${recommendation.id}?from=chatbot`}
                    className="rounded-full border border-[var(--line-strong)] bg-white/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12"
                  >
                    Voir
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
