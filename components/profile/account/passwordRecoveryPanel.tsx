import AccountStatus from '@/components/profile/account/accountStatus'
import type { ProfileAccountController } from '@/components/profile/account/useProfileAccount'

export default function PasswordRecoveryPanel({ account }: { account: ProfileAccountController }) {
  return (
    <section className="panel rounded-[2rem] p-6 sm:p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Compte</p>
        <h1 className="font-display mt-2 text-5xl font-semibold leading-none text-[var(--foreground)]">
          Nouveau mot de passe
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Choisis un nouveau mot de passe pour reprendre ton aventure.
        </p>
      </div>

      <form onSubmit={account.handleRecoveryPassword} className="mt-8 grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
          Nouveau mot de passe
          <input
            type="password"
            value={account.recoveryPassword}
            onChange={(event) => account.setRecoveryPassword(event.target.value)}
            minLength={6}
            required
            className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
            placeholder="Minimum 6 caractères"
          />
        </label>

        <AccountStatus message={account.message} error={account.error} />

        <button
          type="submit"
          disabled={account.resettingPassword}
          className="rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#101722] shadow-[0_18px_40px_rgba(223,191,122,0.18)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {account.resettingPassword ? 'Mise à jour...' : 'Modifier le mot de passe'}
        </button>
      </form>
    </section>
  )
}
