'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import GameSearchBar from './gameSearchBar'

const navItems = [
  { href: '/', label: 'Accueil' },
  { href: '/games', label: 'Jeux' },
  { href: '/glossaire', label: 'Glossaire' },
  { href: '/personnages', label: 'Personnages' },
]

const assistantItem = { href: '/chatbot', label: 'Conseiller RPG' }

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadAvatar() {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id

      if (!userId) {
        if (active) {
          setAvatarUrl(null)
        }
        return
      }

      const { data } = await supabase.from('profiles').select('avatar_url').eq('user_id', userId).maybeSingle()

      if (active) {
        setAvatarUrl(data?.avatar_url ?? null)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAvatarUrl(null)
        return
      }

      loadAvatar()
    })

    loadAvatar()

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(4,9,18,0.76)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:gap-6 lg:px-10">
        <Link href="/" className="font-display shrink-0 text-2xl font-semibold leading-none text-[var(--foreground)]">
          PlayerPG
        </Link>

        <nav className="hidden min-w-0 shrink items-center gap-1 rounded-full border border-[var(--line)] bg-white/5 p-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)] transition hover:bg-white/7 hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="min-w-0 flex-1 sm:max-w-72 lg:w-60 lg:flex-none">
          <GameSearchBar compact />
        </div>

        <Link
          href={assistantItem.href}
          aria-label={assistantItem.label}
          title={assistantItem.label}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] text-[var(--background-deep)] shadow-[0_12px_28px_rgba(223,191,122,0.26)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
            <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3z" />
            <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
            <path d="M5 15l.7 1.8L7.5 17.5l-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15z" />
          </svg>
        </Link>

        <Link
          href="/profile"
          aria-label="Compte"
          title="Compte"
          className="hidden h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-white/6 bg-cover bg-center text-[var(--accent)] transition hover:border-[var(--line-strong)] hover:bg-[var(--accent)]/12 lg:flex"
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        >
          {avatarUrl ? (
            <span className="sr-only">Compte</span>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
              <circle cx="12" cy="8" r="4" />
              <path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6" />
            </svg>
          )}
        </Link>

        <button
          type="button"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white/6 text-[var(--accent)] transition hover:border-[var(--line-strong)] hover:bg-[var(--accent)]/12 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
            {menuOpen ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen ? (
        <div className="mx-auto max-w-6xl px-5 pb-4 sm:px-8 lg:hidden">
          <nav className="panel grid gap-2 rounded-[1.25rem] p-3">
            {[assistantItem, ...navItems, { href: '/profile', label: 'Compte' }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-[1rem] px-4 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)] transition hover:bg-white/7 hover:text-[var(--foreground)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
