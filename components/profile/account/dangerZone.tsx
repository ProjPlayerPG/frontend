import type { ProfileAccountController } from '@/components/profile/account/useProfileAccount'

export default function DangerZone({ account }: { account: ProfileAccountController }) {
  return (
    <div className="mt-5 rounded-[1.5rem] border border-red-300/25 bg-red-400/8 p-5">
      <p className="text-xs uppercase tracking-[0.26em] text-red-100">Zone dangereuse</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        La suppression retire ton profil, tes favoris, ton avatar et ton accès de connexion.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          name="deleteConfirmation"
          autoComplete="off"
          value={account.deleteConfirmation}
          onChange={(event) => account.setDeleteConfirmation(event.target.value)}
          className="rounded-[1.1rem] border border-red-300/25 bg-black/18 px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-red-200"
          placeholder="Tape SUPPRIMER"
        />
        <button
          type="button"
          onClick={account.handleDeleteAccount}
          disabled={account.deletingAccount || account.deleteConfirmation !== 'SUPPRIMER'}
          className="rounded-full border border-red-200/50 bg-red-400/16 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-400/24 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {account.deletingAccount ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </div>
  )
}
