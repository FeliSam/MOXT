import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiMapPin } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { Badge, VerifiedDisplayName } from '../../../components/ui/Badge'
import { useLanguage } from '../../../contexts/useLanguage'
import { activityByValue } from '../../../config/businessActivities'
import { statusMeta } from '../../../config/statuses'
import { SubscribeButton } from '../../account/SubscribeButton'
import {
  businessesOptionLabel,
  businessesServiceLabel,
  businessesText,
} from '../../businesses/businessesI18n'
import { isBusinessPublishReady } from '../../businesses/businessPublishUtils'
import { BusinessRatingBadge } from '../../reviews/BusinessRatingBadge'
import { useHorizontalScroll } from '../../../hooks/useHorizontalScroll'
import { selectDashboardBusinesses } from '../dashboardBrowseUtils'

const CARD_CLASS =
  'flex w-[clamp(15.5rem,78vw,19rem)] shrink-0 flex-col gap-2.5 rounded-[1.4rem] border-0 bg-[var(--app-surface)] p-3.5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:w-[clamp(16rem,42vw,19.5rem)]'

function shuffleBusinesses(items) {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swap]] = [next[swap], next[index]]
  }
  return next
}

export function DashboardBusinessRail() {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) =>
    selectDashboardBusinesses(state.businesses.items, user, { ownerId: user?.id }),
  )
  const businessIds = businesses.map((business) => business.id).join(',')
  const shuffledBusinesses = useMemo(
    () => shuffleBusinesses(businesses),
    // Re-mélange seulement au chargement ou si la liste d'entreprises change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids, pas la référence tableau
    [businessIds],
  )
  const scrollRef = useHorizontalScroll()

  if (!shuffledBusinesses.length) return null

  return (
    <div className="min-w-0">
      <div
        ref={scrollRef}
        className="scrollbar-hidden -mx-1 flex touch-pan-x items-stretch gap-3 overflow-x-auto px-1 py-1 sm:gap-3.5"
      >
        {shuffledBusinesses.map((business) => {
          const activity = activityByValue(business.primaryActivity)
          const roleLabel = businessesOptionLabel(t, activity) || business.sector
          const description = business.description?.trim() || ''
          const initial = (business.name || '?').slice(0, 2).toUpperCase()
          const verified = isBusinessPublishReady(business)
          const status = statusMeta(business.status, t)
          const services = (business.services || []).slice(0, 2)

          return (
            <article key={business.id} className={CARD_CLASS}>
              <Link to={`/businesses/${business.id}`} className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="flex min-w-0 items-start gap-2.5">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt=""
                      className="size-12 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-sm font-black text-white">
                      {initial}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <VerifiedDisplayName
                      name={business.name}
                      verified={verified}
                      iconSize="sm"
                      className="text-sm font-black"
                      nameClassName="truncate"
                    />
                    {roleLabel ? (
                      <p className="mt-0.5 truncate text-[11px] font-bold text-brand-700 dark:text-brand-300">
                        {roleLabel}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone={status.tone} className="!px-1.5 !py-px text-[9px]">
                        {status.label}
                      </Badge>
                      <BusinessRatingBadge business={business} showCount={false} />
                    </div>
                  </div>
                </div>

                {description ? (
                  <p className="line-clamp-2 text-[11px] leading-4 text-[var(--app-text-muted)]">
                    {description}
                  </p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-1.5">
                  {business.city ? (
                    <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-[var(--app-text-faint)]">
                      <FiMapPin className="shrink-0" />
                      <span className="truncate">{business.city}</span>
                    </span>
                  ) : null}
                  {services.map((service) => (
                    <Badge key={service} tone="teal" className="!px-1.5 !py-px text-[9px]">
                      {businessesServiceLabel(t, service)}
                    </Badge>
                  ))}
                </div>
              </Link>

              {user?.id && user.id !== business.ownerId ? (
                <div
                  className="border-t border-[var(--app-border)] pt-2"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                >
                  <SubscribeButton
                    publisherType="business"
                    publisherId={business.id}
                    publisherName={business.name}
                    publisherPath={`/businesses/${business.id}`}
                    size="sm"
                    className="w-full min-w-0"
                  />
                </div>
              ) : null}
            </article>
          )
        })}

        <Link to="/businesses" className={`${CARD_CLASS} items-center justify-center text-center`}>
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <HiOutlineBuildingOffice2 className="text-xl" />
          </span>
          <strong className="text-sm font-black">{businessesText(t, 'businesses.page.title')}</strong>
          <p className="text-[11px] text-[var(--app-text-muted)]">
            {businessesText(t, 'businesses.common.directory')}
          </p>
        </Link>
      </div>
    </div>
  )
}
