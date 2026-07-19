export type AppNotification = {
  id: string
  type: string
  title: string
  message: string
  href: string | null
  read_at: string | null
  created_at: string
}

export const notificationFields = 'id, type, title, message, href, read_at, created_at'
export const notificationsChangedEvent = 'playerpg:notifications-changed'

export function unreadNotificationCount(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notification.read_at).length
}

export function notificationCountLabel(count: number) {
  if (count <= 0) return 'Tout est lu'
  return `${count} notification${count > 1 ? 's' : ''} non lue${count > 1 ? 's' : ''}`
}

export function formatNotificationDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

export function announceNotificationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(notificationsChangedEvent))
  }
}
