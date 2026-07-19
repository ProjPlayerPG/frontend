'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  announceNotificationsChanged,
  formatNotificationDate,
  notificationFields,
  notificationsChangedEvent,
  type AppNotification,
} from '@/lib/notifications'

export default function NotificationBell() {
  const [signedIn, setSignedIn] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      const { data: sessionData } = await supabase.auth.getSession()
      const hasSession = Boolean(sessionData.session)

      if (!active) return
      setSignedIn(hasSession)

      if (!hasSession) {
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
        setOpen(false)
        return
      }

      setLoading(true)
      const [latestResult, countResult] = await Promise.all([
        supabase
          .from('notifications')
          .select(notificationFields)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .is('read_at', null),
      ])

      if (!active) return

      const notificationError = latestResult.error ?? countResult.error
      if (notificationError) {
        setError('Impossible de charger les notifications.')
      } else {
        setError('')
        setNotifications((latestResult.data ?? []) as AppNotification[])
        setUnreadCount(countResult.count ?? 0)
      }
      setLoading(false)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadNotifications()
    })
    const reload = () => void loadNotifications()

    window.addEventListener(notificationsChangedEvent, reload)
    window.addEventListener('focus', reload)
    void loadNotifications()

    return () => {
      active = false
      authListener.subscription.unsubscribe()
      window.removeEventListener(notificationsChangedEvent, reload)
      window.removeEventListener('focus', reload)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  async function markAsRead(notification: AppNotification) {
    if (notification.read_at) return

    const readAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', notification.id)

    if (updateError) {
      setError('Impossible de marquer cette notification comme lue.')
      return
    }

    setNotifications((current) =>
      current.map((item) => item.id === notification.id ? { ...item, read_at: readAt } : item),
    )
    setUnreadCount((current) => Math.max(0, current - 1))
    announceNotificationsChanged()
  }

  async function markAllAsRead() {
    const readAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .is('read_at', null)

    if (updateError) {
      setError('Impossible de tout marquer comme lu.')
      return
    }

    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })))
    setUnreadCount(0)
    setError('')
    announceNotificationsChanged()
  }

  if (!signedIn) return null

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/6 text-[var(--accent)] transition hover:border-[var(--line-strong)] hover:bg-[var(--accent)]/12"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--background-deep)] bg-[var(--accent)] px-1 text-[10px] font-bold leading-none text-[var(--background-deep)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Dernières notifications"
          className="panel absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] shadow-[0_24px_80px_rgba(0,0,0,0.48)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <div>
              <p className="font-display text-xl text-[var(--foreground)]">Notifications</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {unreadCount ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
            </div>
            {unreadCount ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                Tout lire
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {loading ? (
              <div className="m-2 h-20 animate-pulse rounded-[1rem] bg-white/6" />
            ) : null}
            {error ? <p className="p-4 text-sm text-rose-200">{error}</p> : null}
            {!loading && !error && notifications.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted)]">Aucune notification pour le moment.</p>
            ) : null}
            {!loading
              ? notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.href ?? '/notifications'}
                    onClick={() => {
                      setOpen(false)
                      void markAsRead(notification)
                    }}
                    className={`relative block rounded-[1rem] px-4 py-3 transition hover:bg-white/7 ${notification.read_at ? '' : 'bg-[var(--accent)]/8'}`}
                  >
                    {!notification.read_at ? (
                      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--accent)]" />
                    ) : null}
                    <p className="pr-4 text-sm font-semibold text-[var(--foreground)]">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{notification.message}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--accent-cool)]">
                      {formatNotificationDate(notification.created_at, true)}
                    </p>
                  </Link>
                ))
              : null}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center justify-center border-t border-[var(--line)] text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-white/7"
          >
            Voir toutes les notifications
          </Link>
        </div>
      ) : null}
    </div>
  )
}
