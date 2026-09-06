'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { igdbUrlWithSize, normalizeBaseUrl } from '@/lib/igdb'
import { validateHttpsSource } from '@/lib/glossaryValidation'

type SearchGame = {
  id: number
  name: string
  cover?: { url?: string }
}

type SelectedGame = {
  igdb_game_id: number
  game_name: string
  cover_url: string | null
}

type SourceInput = {
  label: string
  url: string
}

const emptySource: SourceInput = { label: '', url: '' }

export default function GlossaryForm() {
  const [sessionReady, setSessionReady] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [detailedDescription, setDetailedDescription] = useState('')
  const [sources, setSources] = useState<SourceInput[]>([{ ...emptySource }])
  const [gameQuery, setGameQuery] = useState('')
  const [gameResults, setGameResults] = useState<SearchGame[]>([])
  const [selectedGames, setSelectedGames] = useState<SelectedGame[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_GAME_SERVICE_URL)

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      setIsConnected(Boolean(data.session))
      setSessionReady(true)
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsConnected(Boolean(session))
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const query = gameQuery.trim()

    if (query.length < 2) {
      setGameResults([])
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      setLoadingGames(true)

      try {
        const url = new URL(`${baseUrl}/api/games/search`)
        url.searchParams.set('q', query)
        url.searchParams.set('limit', '8')
        url.searchParams.set('offset', '0')

        const response = await fetch(url.toString(), { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = (await response.json()) as SearchGame[]
        setGameResults(data)
      } catch {
        setGameResults([])
      } finally {
        setLoadingGames(false)
      }
    }, 280)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [baseUrl, gameQuery])

  function updateSource(index: number, key: keyof SourceInput, value: string) {
    setSources((currentSources) =>
      currentSources.map((source, currentIndex) =>
        currentIndex === index ? { ...source, [key]: value } : source,
      ),
    )
  }

  function addSource() {
    setSources((currentSources) => [...currentSources, { ...emptySource }])
  }

  function removeSource(index: number) {
    setSources((currentSources) =>
      currentSources.length === 1
        ? [{ ...emptySource }]
        : currentSources.filter((_source, currentIndex) => currentIndex !== index),
    )
  }

  function addGame(game: SearchGame) {
    if (selectedGames.some((selectedGame) => selectedGame.igdb_game_id === game.id)) {
      return
    }

    setSelectedGames((currentGames) => [
      ...currentGames,
      {
        igdb_game_id: game.id,
        game_name: game.name,
        cover_url: igdbUrlWithSize(game.cover?.url, 't_cover_big'),
      },
    ])
    setGameQuery('')
    setGameResults([])
  }

  function removeGame(gameId: number) {
    setSelectedGames((currentGames) => currentGames.filter((game) => game.igdb_game_id !== gameId))
  }

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    const cleanedSources = sources
      .map((source) => ({
        label: source.label.trim(),
        url: source.url.trim(),
      }))
      .filter((source) => source.url)

    if (!title.trim() || !shortDescription.trim() || !detailedDescription.trim()) {
      setError('Remplis le titre, la description courte et la description avancée.')
      return
    }

    if (cleanedSources.length === 0) {
      setError('Ajoute au moins une source HTTPS.')
      return
    }

    const sourceError = cleanedSources
      .map((source) => validateHttpsSource(source.url, 'Cette source doit être une URL HTTPS valide.'))
      .find(Boolean)
    if (sourceError) {
      setError(sourceError)
      return
    }

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) {
      setError('Connecte-toi pour proposer une entrée.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/glossary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          shortDescription: shortDescription.trim(),
          detailedDescription: detailedDescription.trim(),
          sources: cleanedSources,
          games: selectedGames,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Impossible d’envoyer cette proposition.')
      }

      setTitle('')
      setShortDescription('')
      setDetailedDescription('')
      setSources([{ ...emptySource }])
      setSelectedGames([])
      setMessage(
        payload.status === 'published'
          ? 'Entrée publiée dans le glossaire.'
          : 'Proposition envoyée. Elle sera visible après validation admin.',
      )
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Impossible d’envoyer cette proposition.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="proposer" className="panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
            Contribution
          </p>
          <h2 className="font-display mt-2 text-3xl text-[var(--foreground)]">Proposer une entrée</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
          Les sources HTTPS sont obligatoires pour garder un glossaire fiable.
        </p>
      </div>

      {!sessionReady ? (
        <div className="mt-6 h-28 animate-pulse rounded-[1.3rem] border border-[var(--line)] bg-white/5" />
      ) : !isConnected ? (
        <div className="mt-6 rounded-[1.3rem] border border-[var(--line)] bg-black/14 p-5">
          <p className="text-sm leading-7 text-[var(--muted)]">
            Connecte-toi pour proposer un terme au glossaire.
          </p>
          <a
            href="/profile"
            className="mt-4 inline-flex rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--background-deep)]"
          >
            Se connecter
          </a>
        </div>
      ) : (
        <form onSubmit={submitEntry} className="mt-6 grid gap-5">
          {message ? (
            <p className="rounded-[1rem] border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-[1rem] border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm font-bold text-[var(--muted)]">Titre</span>
            <input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={90}
              className="rounded-[1.2rem] border border-[var(--line)] bg-black/18 px-5 py-4 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="JRPG, Build, Tactical RPG..."
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-[var(--muted)]">Description courte</span>
            <textarea
              name="shortDescription"
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              maxLength={220}
              rows={3}
              className="resize-none rounded-[1.2rem] border border-[var(--line)] bg-black/18 px-5 py-4 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="La phrase qui apparaîtra sur la carte du glossaire."
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-[var(--muted)]">Description avancée</span>
            <textarea
              name="detailedDescription"
              value={detailedDescription}
              onChange={(event) => setDetailedDescription(event.target.value)}
              rows={8}
              className="resize-y rounded-[1.2rem] border border-[var(--line)] bg-black/18 px-5 py-4 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="Le contenu détaillé affiché sur la page de l&apos;entrée."
            />
          </label>

          <div className="grid gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--muted)]">Sources HTTPS</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]/80">
                Une source minimum. Les liens locaux ou non HTTPS sont refusées.
              </p>
            </div>

            {sources.map((source, index) => (
              <div key={index} className="grid gap-3 rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-4 md:grid-cols-[0.8fr_1.4fr_auto]">
                <input
                  name={`sources.${index}.label`}
                  value={source.label}
                  onChange={(event) => updateSource(index, 'label', event.target.value)}
                  maxLength={80}
                  className="rounded-full border border-[var(--line)] bg-black/18 px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  placeholder="Label optionnel"
                />
                <input
                  name={`sources.${index}.url`}
                  type="url"
                  autoComplete="url"
                  value={source.url}
                  onChange={(event) => updateSource(index, 'url', event.target.value)}
                  className="rounded-full border border-[var(--line)] bg-black/18 px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  className="rounded-full border border-[var(--line)] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white/8"
                >
                  Retirer
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addSource}
              className="w-fit rounded-full border border-[var(--accent-cool)] bg-[var(--accent-cool)]/12 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:bg-[var(--accent-cool)]/20"
            >
              Ajouter une source
            </button>
          </div>

          <div className="grid gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--muted)]">Jeux liés</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]/80">
                Optionnel, mais utile pour illustrer le terme.
              </p>
            </div>

            <div className="relative">
              <input
                name="relatedGameSearch"
                autoComplete="off"
                value={gameQuery}
                onChange={(event) => setGameQuery(event.target.value)}
                className="w-full rounded-[1.2rem] border border-[var(--line)] bg-black/18 px-5 py-4 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                placeholder="Chercher Dragon Quest, Final Fantasy..."
              />
              {gameResults.length || loadingGames ? (
                <div className="panel absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-[1.2rem] p-2">
                  {loadingGames ? (
                    <p className="px-4 py-3 text-sm text-[var(--muted)]">Recherche...</p>
                  ) : (
                    gameResults.map((game) => {
                      const coverUrl = igdbUrlWithSize(game.cover?.url, 't_cover_big')

                      return (
                        <button
                          key={game.id}
                          type="button"
                          onClick={() => addGame(game)}
                          className="flex w-full items-center gap-3 rounded-[1rem] p-3 text-left transition hover:bg-white/6"
                        >
                          <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-white/8">
                            {coverUrl ? (
                              <Image src={coverUrl} alt={game.name} width={44} height={56} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                                RPG
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-[var(--foreground)]">{game.name}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>

            {selectedGames.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedGames.map((game) => (
                  <button
                    key={game.igdb_game_id}
                    type="button"
                    onClick={() => removeGame(game.igdb_game_id)}
                    className="rounded-full border border-[var(--line)] bg-white/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:bg-red-400/10 hover:text-red-100"
                  >
                    {game.game_name} - retirer
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--background-deep)] shadow-[0_14px_34px_rgba(223,191,122,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? 'Envoi...' : 'Confirmer la proposition'}
          </button>
        </form>
      )}
    </section>
  )
}
