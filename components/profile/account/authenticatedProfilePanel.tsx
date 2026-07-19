import Link from 'next/link'
import AccountStatus from '@/components/profile/account/accountStatus'
import DangerZone from '@/components/profile/account/dangerZone'
import FavoritesSection from '@/components/profile/account/favoritesSection'
import ProfileSettingsForm from '@/components/profile/account/profileSettingsForm'
import type { ProfileAccountController } from '@/components/profile/account/useProfileAccount'
import ProfileNotifications from '@/components/profile/profileNotifications'

export default function AuthenticatedProfilePanel({ account }: { account: ProfileAccountController }) {
  return (
    <section className="panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Compte</p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              aria-label={`Avatar de ${account.displayUsername}`}
              className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--line-strong)] bg-black/24 bg-cover bg-center"
              role="img"
              style={account.profile?.avatar_url ? { backgroundImage: `url(${account.profile.avatar_url})` } : undefined}
            >
              {account.profile?.avatar_url ? (
                <span className="sr-only">{account.displayUsername}</span>
              ) : (
                <span className="font-display text-4xl text-[var(--accent)]">
                  {account.displayUsername.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-5xl font-semibold leading-none text-[var(--foreground)]">
                  {account.displayUsername}
                </h1>
                {account.isAdmin ? (
                  <span className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)]/14 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Admin
                  </span>
                ) : null}
              </div>
              <label className="mt-4 inline-flex cursor-pointer rounded-full border border-[var(--line-strong)] bg-white/6 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12">
                {account.uploadingAvatar ? 'Envoi...' : 'Changer avatar'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={account.handleAvatarChange}
                  disabled={account.uploadingAvatar}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={account.handleSignOut}
          disabled={account.submitting}
          className="rounded-full border border-[var(--line-strong)] bg-white/6 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-[var(--accent)]/12 disabled:cursor-not-allowed disabled:opacity-55"
        >
          Déconnexion
        </button>
      </div>

      <AccountStatus message={account.message} error={account.error} className="mt-6" />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Bibliothèque</p>
          <p className="font-display mt-2 text-2xl text-[var(--foreground)]">
            {account.loadingFavorites ? '...' : `${account.favorites.length} favori${account.favorites.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-[var(--line)] bg-black/14 p-5">
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Membre depuis</p>
          <p className="mt-2 text-base text-[var(--foreground)]">{account.memberSince}</p>
        </div>
        {account.isAdmin ? (
          <Link
            href="/admin"
            className="rounded-[1.4rem] border border-[var(--accent-strong)] bg-[var(--accent)]/12 p-5 transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/20"
          >
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Administration</p>
            <p className="font-display mt-2 text-2xl text-[var(--foreground)]">Ouvrir</p>
          </Link>
        ) : null}
      </div>

      <FavoritesSection
        favorites={account.favorites}
        loading={account.loadingFavorites}
        onRemove={(favorite) => void account.handleRemoveFavorite(favorite)}
      />

      <ProfileNotifications />
      <ProfileSettingsForm account={account} />
      <DangerZone account={account} />
    </section>
  )
}
