import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ProfileHeroCard } from '../features/profile/components/ProfileHeroCard'
import { ProfileLinkGrid } from '../features/profile/components/ProfileLinkGrid'
import { ProfileQuickStats } from '../features/profile/components/ProfileQuickStats'
import { ProfileSecuritySummary } from '../features/profile/components/ProfileSecuritySummary'
import { PhoneVerificationCard } from '../features/security/PhoneVerificationCard'
import { isPhoneVerified } from '@moxt/shared/auth/userSecurity.js'
import {
  accountSections,
  profileCompletionPercent,
  quickStatsConfig,
} from '../features/profile/profilePageConfig'

export function ProfilePage() {
  const user = useSelector((state) => state.auth.user)

  const profileCompletion = profileCompletionPercent(user)

  const transfersCount = useSelector(
    (state) => state.transfers.items.filter((item) => item.userId === user.id).length,
  )
  const listingsCount = useSelector(
    (state) => state.marketplace.items.filter((item) => item.ownerId === user.id).length,
  )
  const parcelsCount = useSelector(
    (state) => state.parcels.items.filter((item) => item.ownerId === user.id).length,
  )
  const favoritesCount = useSelector((state) => state.account.favorites.length)

  const countsByKey = useMemo(
    () => ({
      transfers: transfersCount,
      listings: listingsCount,
      parcels: parcelsCount,
      favorites: favoritesCount,
    }),
    [favoritesCount, listingsCount, parcelsCount, transfersCount],
  )

  const quickStats = quickStatsConfig.map((stat) => ({
    ...stat,
    value: countsByKey[stat.key],
  }))

  return (
    <div className="grid gap-6">
      <ProfileHeroCard profileCompletion={profileCompletion} user={user} />
      {!isPhoneVerified(user) ? <PhoneVerificationCard /> : null}
      <ProfileQuickStats stats={quickStats} />
      <ProfileLinkGrid sections={accountSections} />
      <ProfileSecuritySummary verified={user.verified} />
    </div>
  )
}
