'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { normalizeBaseUrl } from '@/lib/igdb'
import { supabase } from '@/lib/supabaseClient'

type Recommendation = {
  id: number
  name: string
  reason: string
}

export default function RpgChatbot() {
  const [message, setMessage] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (message.trim().length < 3) {
      setError('Dis-moi quel type de RPG tu cherches.')
      return
    }

    setLoading(true)
    setError('')
    setRecommendations([])

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
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.details || data?.error || 'Recommandation indisponible.')
      }

      const data = (await response.json()) as { recommendations?: Recommendation[] }
      setRecommendations(data.recommendations ?? [])
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Recommandation indisponible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative z-0 mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
            Conseiller RPG
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
            Trouver ta prochaine aventure
          </h2>
        </div>
        <p className="hidden max-w-md text-right text-sm leading-6 text-[var(--muted)] md:block">
          Decris ton envie, PlayerPG propose des RPG adaptes.
        </p>
      </div>

      <div className="panel mt-6 rounded-[1.5rem] p-5">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            placeholder="Ex: je veux un tactical RPG recent avec une bonne histoire"
          />
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
                    href={`/games/${recommendation.id}`}
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
