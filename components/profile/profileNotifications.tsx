'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  href: string | null
  read_at: string | null
  created_at: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function ProfileNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  useEffect(() => {
    let mounted = true

    async function loadNotifications() {
      setLoading(true)
      setError('')

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        if (mounted) setLoading(false)
        return
      }

      const { data, error: notificationsError } = await supabase
        .from('notifications')
        .select('id, type, title, message, href, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(6)

      if (!mounted) return

      if (notificationsError) {
        setError(notificationsError.message)
        setNotifications([])
      } else {
        setNotifications((data ?? []) as Notification[])
      }

      setLoading(false)
    }

    loadNotifications()

    return () => {
      mounted = false
    }
  }, [])

  async function markAsRead(notificationId: string) {
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read_at: new Date().toISOString() }
          : notification,
      ),
    )
  }

  return (
    <section className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-black/14 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent-strong)] bg-[var(--accent)]/14 text-[var(--accent)]">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Notifications</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {unreadCount ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-[1rem] border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="h-20 animate-pulse rounded-[1.2rem] border border-[var(--line)] bg-white/5" />
        ) : null}

        {!loading && notifications.length === 0 ? (
          <p className="rounded-[1.2rem] border border-[var(--line)] bg-black/12 p-4 text-sm text-[var(--muted)]">
            Aucune notification pour le moment.
          </p>
        ) : null}

        {!loading
          ? notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-[1.2rem] border p-4 ${
                  notification.read_at
                    ? 'border-[var(--line)] bg-black/12'
                    : 'border-[var(--accent-strong)] bg-[var(--accent)]/10'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-display text-2xl leading-tight text-[var(--foreground)]">
                      {notification.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{notification.message}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-white/6 px-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12"
                      >
                        Voir
                      </Link>
                    ) : null}
                    {!notification.read_at ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="rounded-full border border-[var(--line)] px-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)] transition hover:bg-white/8"
                      >
                        Lu
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          : null}
      </div>
    </section>
  )
}
