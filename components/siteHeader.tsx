'use client'

import Link from 'next/link'
import { useState } from 'react'
import GameSearchBar from './gameSearchBar'

const navItems = [
  { href: '/', label: 'Accueil' },
  { href: '/games', label: 'Jeux' },
  { href: '/glossaire', label: 'Glossaire' },
  { href: '/personnages', label: 'Personnages' },
]

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

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
          href="/profile"
          aria-label="Compte"
          title="Compte"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white/6 text-[var(--accent)] transition hover:border-[var(--line-strong)] hover:bg-[var(--accent)]/12 lg:flex"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6" />
          </svg>
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
            {[...navItems, { href: '/profile', label: 'Compte' }].map((item) => (
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
