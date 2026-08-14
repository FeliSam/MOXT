import { useMemo } from 'react'
import { FiStar } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProfileHeroCard } from '../features/profile/components/ProfileHeroCard'
import { ProfileLinkGrid } from '../features/profile/components/ProfileLinkGrid'
import { ProfileQuickStats } from '../features/profile/components/ProfileQuickStats'
import { ProfileSecuritySummary } from '../features/profile/components/ProfileSecuritySummary'
import { PhoneVerificationCard } from '../features/security/PhoneVerificationCard'
import { useLanguage } from '../contexts/useLanguage'
import { useScopedProfileReviews } from '../features/reviews/useScopedTargetReviews'
import { isPhoneVerified } from '@moxt/shared/auth/userSecurity.js'
import {
  accountSections,
  profileCompletionPercent,
  quickStatsConfig,
} from '../features/profile/profilePageConfig'

export function ProfilePage() {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const userId = user?.id
  const { rating: reviewRating } = useScopedProfileReviews(userId, {}, { enabled: Boolean(userId) })

  const profileCompletion = profileCompletionPercent(user)

  const transfersCount = useSelector(
    (state) =>
      userId
        ? state.transfers.items.filter((item) => item.userId === userId).length
        : 0,
  )
  const listingsCount = useSelector(
    (state) =>
      userId
        ? state.marketplace.items.filter((item) => item.ownerId === userId).length
        : 0,
  )
  const parcelsCount = useSelector(
    (state) =>
      userId
        ? state.parcels.items.filter((item) => item.ownerId === userId).length
        : 0,
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

  if (!user) return null

  const quickStats = quickStatsConfig.map((stat) => ({
    ...stat,
    value: countsByKey[stat.key],
  }))

  return (
    <div className="grid gap-6">
      <ProfileHeroCard profileCompletion={profileCompletion} user={user} />
      {!isPhoneVerified(user) ? <PhoneVerificationCard /> : null}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700 dark:text-brand-300">
            {t('reviews.reputation')}
          </p>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {reviewRating.count
              ? t('reviews.communityDescription', { count: reviewRating.count })
              : t('reviews.emptyDescription')}
          </p>
        </div>
        <Link to={`/users/${user.id}/publications?view=avis`}>
          <Button variant="secondary" icon={FiStar}>
            {t('publications.user.tabs.reviews')}
            {reviewRating.count ? ` (${reviewRating.count})` : ''}
          </Button>
        </Link>
      </Card>
      <ProfileQuickStats stats={quickStats} />
      <ProfileLinkGrid sections={accountSections} />
      <ProfileSecuritySummary verified={user.verified} />
    </div>
  )
}
