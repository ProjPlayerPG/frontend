import type { ProfileAccountController } from '@/components/profile/account/useProfileAccount'

export default function ProfileSettingsForm({ account }: { account: ProfileAccountController }) {
  return (
    <form onSubmit={account.handleProfileUpdate} className="mt-8 grid gap-5 rounded-[1.5rem] border border-[var(--line)] bg-black/14 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--accent-cool)]">Informations</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Modifie ton pseudo, ton e-mail ou ton mot de passe.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
          Pseudo
          <input
            name="username"
            autoComplete="username"
            value={account.profileUsernameInput}
            onChange={(event) => account.setProfileUsernameInput(event.target.value)}
            minLength={3}
            maxLength={24}
            required
            className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={account.profileEmailInput}
            onChange={(event) => account.setProfileEmailInput(event.target.value)}
            required
            className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
        Nouveau mot de passe
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          value={account.newPassword}
          onChange={(event) => account.setNewPassword(event.target.value)}
          minLength={6}
          className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
          placeholder="Laisse vide pour ne pas changer"
        />
      </label>

      <button
        type="submit"
        disabled={account.updatingProfile}
        className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#101722] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {account.updatingProfile ? 'Mise à jour...' : 'Enregistrer'}
      </button>
    </form>
  )
}
