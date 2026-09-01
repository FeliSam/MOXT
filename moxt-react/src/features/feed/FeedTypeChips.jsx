import { FiArrowLeft } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { FEED_TYPE_FILTERS, feedPath } from './feedItemUtils'
import { readSearchParam } from './feedCollectionUtils'
import { FeedPublishMenu } from './FeedPublishMenu'

const FEED_BACK_BTN_CLASS =
  'grid size-9 shrink-0 place-items-center rounded-full bg-black/40 text-white/90 ring-1 ring-white/20 backdrop-blur-md transition active:scale-95'

/**
 * @param {{
 *   counts?: Record<string, number>,
 *   totalCount?: number,
 *   showPublish?: boolean,
 *   className?: string,
 * }} props
 */
export function FeedTypeChips({
  counts = {},
  totalCount = 0,
  showPublish = true,
  backHref = '/dashboard',
  className = '',
}) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [searchParams] = useSearchParams()
  const current = readSearchParam(searchParams, 'type', 'all')
  const item = readSearchParam(searchParams, 'item')

  const visible = FEED_TYPE_FILTERS.filter((filter) => {
    if (filter.id === 'all') return true
    return (counts[filter.id] || 0) > 0
  })

  // Un seul type réel → le filtre n’apporte rien.
  const showFilters = totalCount > 0 && visible.length > 2

  if (!showFilters && !showPublish) return null

  return (
    <div
      className={`pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-center gap-1.5 px-2.5 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] ${className}`}
      data-testid="feed-type-chips"
    >
      <Link to={backHref} aria-label={p3('common.back')} className={FEED_BACK_BTN_CLASS}>
        <FiArrowLeft className="text-lg" aria-hidden="true" />
      </Link>

      {showFilters ? (
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-proximity touch-pan-x scrollbar-hidden">
          {visible.map((filter) => {
            const active =
              current === filter.id || (filter.id === 'all' && (!current || current === 'all'))
            const to = feedPath({
              type: filter.id === 'all' ? undefined : filter.id,
              item: item || undefined,
            })
            return (
              <Link
                key={filter.id}
                to={to}
                className={`inline-flex h-9 shrink-0 snap-start items-center justify-center whitespace-nowrap rounded-full px-3 text-[11px] font-bold leading-none backdrop-blur-md transition active:scale-[0.98] ${
                  active
                    ? 'bg-white text-black'
                    : 'bg-black/40 text-white/90 ring-1 ring-white/20'
                }`}
              >
                {p3(filter.labelKey)}
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      {showPublish ? <FeedPublishMenu /> : null}
    </div>
  )
}
