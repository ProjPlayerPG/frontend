'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  announceNotificationsChanged,
  formatNotificationDate,
  notificationCountLabel,
  notificationFields,
  notificationsChangedEvent,
  type AppNotification,
  unreadNotificationCount,
} from '@/lib/notifications'

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState('')
  const [error, setError] = useState('')
  const unreadCount = useMemo(() => unreadNotificationCount(notifications), [notifications])

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      const { data: sessionData } = await supabase.auth.getSession()
      const hasSession = Boolean(sessionData.session)

      if (!active) return
      setSignedIn(hasSession)

      if (!hasSession) {
        setNotifications([])
        setLoading(false)
        return
      }

      const { data, error: notificationsError } = await supabase
        .from('notifications')
        .select(notificationFields)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!active) return

      if (notificationsError) {
        setError('Impossible de charger les notifications.')
        setNotifications([])
      } else {
        setError('')
        setNotifications((data ?? []) as AppNotification[])
      }
      setLoading(false)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadNotifications()
    })
    const reload = () => void loadNotifications()

    window.addEventListener(notificationsChangedEvent, reload)
    void loadNotifications()

    return () => {
      active = false
      authListener.subscription.unsubscribe()
      window.removeEventListener(notificationsChangedEvent, reload)
    }
  }, [])

  async function markAsRead(notificationId: string) {
    const readAt = new Date().toISOString()
    setPendingAction(`read:${notificationId}`)
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', notificationId)

    if (updateError) {
      setError('Impossible de marquer cette notification comme lue.')
    } else {
      setNotifications((current) =>
        current.map((item) => item.id === notificationId ? { ...item, read_at: readAt } : item),
      )
      setError('')
      announceNotificationsChanged()
    }
    setPendingAction('')
  }

  async function markAllAsRead() {
    const readAt = new Date().toISOString()
    setPendingAction('read-all')
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .is('read_at', null)

    if (updateError) {
      setError('Impossible de tout marquer comme lu.')
    } else {
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })))
      setError('')
      announceNotificationsChanged()
    }
    setPendingAction('')
  }

  async function deleteNotification(notificationId: string) {
    setPendingAction(`delete:${notificationId}`)
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (deleteError) {
      setError('Impossible de supprimer cette notification.')
    } else {
      setNotifications((current) => current.filter((item) => item.id !== notificationId))
      setError('')
      announceNotificationsChanged()
    }
    setPendingAction('')
  }

  async function deleteAllNotifications() {
    if (!window.confirm('Supprimer définitivement toutes vos notifications ?')) return

    setPendingAction('delete-all')
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .not('id', 'is', null)

    if (deleteError) {
      setError('Impossible de supprimer toutes les notifications.')
    } else {
      setNotifications([])
      setError('')
      announceNotificationsChanged()
    }
    setPendingAction('')
  }

  if (signedIn === false) {
    return (
      <section className="panel rounded-[1.5rem] p-7 text-center">
        <h2 className="font-display text-3xl text-[var(--foreground)]">Connectez-vous pour consulter vos notifications</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Les décisions concernant vos propositions de glossaire apparaîtront ici.
        </p>
        <Link
          href="/profile"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--background-deep)] transition hover:bg-[var(--accent-strong)]"
        >
          Accéder au compte
        </Link>
      </section>
    )
  }

  return (
    <section>
      <div className="panel flex flex-col gap-5 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--accent-strong)] bg-[var(--accent)]/14 text-[var(--accent)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{notificationCountLabel(unreadCount)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{notifications.length} notification{notifications.length > 1 ? 's' : ''} au total</p>
          </div>
        </div>

        {notifications.length ? (
          <div className="flex flex-wrap gap-2">
            {unreadCount ? (
              <button
                type="button"
                disabled={Boolean(pendingAction)}
                onClick={markAllAsRead}
                className="min-h-10 rounded-full border border-[var(--line)] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:bg-white/7 disabled:opacity-50"
              >
                Tout marquer comme lu
              </button>
            ) : null}
            <button
              type="button"
              disabled={Boolean(pendingAction)}
              onClick={deleteAllNotifications}
              className="min-h-10 rounded-full border border-rose-300/25 px-4 text-xs font-bold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-50"
            >
              Tout supprimer
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-5 rounded-[1rem] border border-rose-300/25 bg-rose-300/10 p-4 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {loading || signedIn === null ? (
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="panel h-32 animate-pulse rounded-[1.4rem] bg-white/5" />
          ))
        ) : null}

        {!loading && signedIn && notifications.length === 0 ? (
          <div className="panel rounded-[1.5rem] p-8 text-center">
            <p className="font-display text-3xl text-[var(--foreground)]">Aucune notification</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Les prochaines décisions de modération apparaîtront ici.
            </p>
          </div>
        ) : null}

        {!loading
          ? notifications.map((notification) => (
              <article
                key={notification.id}
                className={`panel rounded-[1.4rem] p-5 ${notification.read_at ? '' : 'border-[var(--accent-strong)] bg-[var(--accent)]/8'}`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      {!notification.read_at ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)]" /> : null}
                      <h2 className="font-display text-2xl leading-tight text-[var(--foreground)]">{notification.title}</h2>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{notification.message}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--accent-cool)]">
                      {formatNotificationDate(notification.created_at, true)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        onClick={() => {
                          if (!notification.read_at) void markAsRead(notification.id)
                        }}
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-white/6 px-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12"
                      >
                        Voir
                      </Link>
                    ) : null}
                    {!notification.read_at ? (
                      <button
                        type="button"
                        disabled={Boolean(pendingAction)}
                        onClick={() => markAsRead(notification.id)}
                        className="min-h-10 rounded-full border border-[var(--line)] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)] transition hover:bg-white/7 disabled:opacity-50"
                      >
                        Marquer comme lu
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={Boolean(pendingAction)}
                      onClick={() => deleteNotification(notification.id)}
                      className="min-h-10 rounded-full border border-rose-300/20 px-4 text-xs font-bold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))
          : null}
      </div>
    </section>
  )
}
