import AccountStatus from '@/components/profile/account/accountStatus'
import type { ProfileAccountController } from '@/components/profile/account/useProfileAccount'

export default function GuestAuthPanel({ account }: { account: ProfileAccountController }) {
  return (
    <section className="panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-cool)]">Compte</p>
          <h1 className="font-display mt-2 text-5xl font-semibold leading-none text-[var(--foreground)]">
            {account.isSignup ? 'Créer un profil' : account.isForgotPassword ? 'Mot de passe oublié' : 'Connexion'}
          </h1>
        </div>

        <div className="flex rounded-full border border-[var(--line)] bg-black/18 p-1">
          <button
            type="button"
            onClick={() => account.changeMode('signin')}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
              !account.isSignup ? 'bg-[var(--accent)] text-[#101722]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => account.changeMode('signup')}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
              account.isSignup ? 'bg-[var(--accent)] text-[#101722]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Inscription
          </button>
        </div>
      </div>

      {account.isForgotPassword ? (
        <form onSubmit={account.handleForgotPassword} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
            E-mail
            <input
              type="email"
              name="forgotEmail"
              autoComplete="email"
              value={account.forgotEmail}
              onChange={(event) => account.setForgotEmail(event.target.value)}
              required
              className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              placeholder="joueur@playerpg.fr"
            />
          </label>

          <AccountStatus message={account.message} error={account.error} />

          <button
            type="submit"
            disabled={account.submitting}
            className="mt-2 rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#101722] shadow-[0_18px_40px_rgba(223,191,122,0.18)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {account.submitting ? 'Envoi...' : 'Recevoir le lien'}
          </button>

          <button
            type="button"
            onClick={() => account.changeMode('signin')}
            className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
          >
            Retour à la connexion
          </button>
        </form>
      ) : (
        <form onSubmit={account.handleSubmit} className="mt-8 grid gap-5">
          {account.isSignup ? (
            <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
              Pseudo
              <input
                name="username"
                autoComplete="username"
                value={account.username}
                onChange={(event) => account.setUsername(event.target.value)}
                minLength={3}
                maxLength={24}
                required
                className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
                placeholder="Nasake"
              />
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
            E-mail
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={account.email}
              onChange={(event) => account.setEmail(event.target.value)}
              required
              className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              placeholder="joueur@playerpg.fr"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
            Mot de passe
            <input
              type="password"
              name="password"
              autoComplete={account.isSignup ? 'new-password' : 'current-password'}
              value={account.password}
              onChange={(event) => account.setPassword(event.target.value)}
              minLength={6}
              required
              className="rounded-[1.1rem] border border-[var(--line)] bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
              placeholder="Minimum 6 caractères"
            />
          </label>

          <AccountStatus message={account.message} error={account.error} />

          <button
            type="submit"
            disabled={account.submitting}
            className="mt-2 rounded-full border border-[var(--accent-strong)] bg-[var(--accent)] px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#101722] shadow-[0_18px_40px_rgba(223,191,122,0.18)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {account.submitting ? 'Chargement...' : account.isSignup ? 'Créer mon compte' : 'Se connecter'}
          </button>

          {!account.isSignup ? (
            <button
              type="button"
              onClick={() => account.changeMode('forgot')}
              className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--accent-cool)] transition hover:text-[var(--foreground)]"
            >
              Mot de passe oublié ?
            </button>
          ) : null}
        </form>
      )}
    </section>
  )
}
