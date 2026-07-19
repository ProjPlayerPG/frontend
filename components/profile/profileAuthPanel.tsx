'use client'

import AccountLoadingPanel from '@/components/profile/account/accountLoadingPanel'
import AuthenticatedProfilePanel from '@/components/profile/account/authenticatedProfilePanel'
import GuestAuthPanel from '@/components/profile/account/guestAuthPanel'
import PasswordRecoveryPanel from '@/components/profile/account/passwordRecoveryPanel'
import { useProfileAccount } from '@/components/profile/account/useProfileAccount'

export default function ProfileAuthPanel() {
  const account = useProfileAccount()

  if (account.loading) return <AccountLoadingPanel />
  if (account.passwordRecovery) return <PasswordRecoveryPanel account={account} />
  if (account.currentUser) return <AuthenticatedProfilePanel account={account} />
  return <GuestAuthPanel account={account} />
}
