import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useLanguage } from '../../../contexts/useLanguage'
import { businessesText } from '../../businesses/businessesI18n'
import { BusinessDiscoveryCard } from '../../businesses/BusinessDiscoveryCard'
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
        {shuffledBusinesses.map((business) => (
          <BusinessDiscoveryCard
            key={business.id}
            business={business}
            user={user}
            className={`${CARD_CLASS} shrink-0`}
          />
        ))}

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
