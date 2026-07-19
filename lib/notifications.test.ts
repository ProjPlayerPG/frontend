import { describe, expect, it } from 'vitest'
import {
  notificationCountLabel,
  type AppNotification,
  unreadNotificationCount,
} from '@/lib/notifications'

function notification(id: string, readAt: string | null): AppNotification {
  return {
    id,
    type: 'glossary_published',
    title: 'Titre',
    message: 'Message',
    href: null,
    read_at: readAt,
    created_at: '2026-07-19T12:00:00.000Z',
  }
}

describe('notifications', () => {
  it('compte uniquement les notifications non lues', () => {
    expect(
      unreadNotificationCount([
        notification('1', null),
        notification('2', '2026-07-19T13:00:00.000Z'),
        notification('3', null),
      ]),
    ).toBe(2)
  })

  it.each([
    [0, 'Tout est lu'],
    [1, '1 notification non lue'],
    [3, '3 notifications non lues'],
  ])('formule correctement le compteur %s', (count, expected) => {
    expect(notificationCountLabel(count)).toBe(expected)
  })
})
