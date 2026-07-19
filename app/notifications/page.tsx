import NotificationsCenter from '@/components/notifications/notificationsCenter'

export default function NotificationsPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">
          Centre personnel
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold leading-none text-[var(--foreground)] sm:text-5xl">
          Vos notifications
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Suivez les décisions concernant vos propositions et gardez votre espace organisé.
        </p>
      </section>

      <NotificationsCenter />
    </main>
  )
}
