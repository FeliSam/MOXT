import { FiArrowUpRight, FiCalendar, FiChevronRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { useHorizontalScroll } from '../../../hooks/useHorizontalScroll'
import {
  dashboardLiveAccents,
  dashboardLiveCardClass,
  dashboardLiveItemClass,
  dashboardLiveTrackClass,
} from '../dashboardConfig'

function DashboardLiveTile({ accent, icon: ItemIcon, item, path }) {
  const styles = dashboardLiveAccents[accent] || dashboardLiveAccents.parcels

  return (
    <Link to={`${path}/${item.id}`} className={`group block h-full shrink-0 ${dashboardLiveItemClass}`}>
      <article className="relative flex h-full min-h-[11.25rem] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-card)] transition-all duration-[var(--transition-fast)] group-hover:border-brand-200 group-hover:shadow-[var(--shadow-card-hover)] lg:min-h-[13.8rem] dark:group-hover:border-brand-800">
        <span
          className={`block h-1 w-full bg-gradient-to-r ${styles.stripe}`}
          aria-hidden="true"
        />

        <div className="flex flex-1 flex-col p-3.5 lg:p-[1.15rem]">
          <div className="flex items-start gap-3 lg:gap-3.5">
            {ItemIcon ? (
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-[0.75rem] lg:size-11 ${styles.icon}`}
              >
                <ItemIcon className="text-lg lg:text-[1.2rem]" aria-hidden="true" />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[0.95rem] font-bold leading-snug tracking-[-0.01em] text-[var(--app-text)] lg:text-[1.05rem]">
                {item.title}
              </h3>
              {item.meta ? (
                <p className="mt-1.5 truncate text-xs text-[var(--app-text-muted)] lg:text-[0.82rem]">
                  {item.meta}
                </p>
              ) : null}
            </div>
            <FiChevronRight
              className="mt-0.5 size-4 shrink-0 text-[var(--app-text-faint)] opacity-0 transition-all duration-[var(--transition-fast)] group-hover:translate-x-0.5 group-hover:opacity-100 lg:size-[1.125rem]"
              aria-hidden="true"
            />
          </div>

          {item.highlight ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-brand-700 lg:text-[0.82rem] dark:text-brand-300">
              <FiCalendar className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.highlight}</span>
            </p>
          ) : null}

          {item.chips?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5 lg:mt-3.5 lg:gap-2">
              {item.chips.map((chip) => (
                <span
                  key={chip}
                  className={`inline-flex max-w-full truncate rounded-md px-2 py-1 text-[10px] font-bold lg:px-2.5 lg:text-[11px] ${styles.chip}`}
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          {item.footer || item.badge ? (
            <div className="mt-auto border-t border-[var(--app-border)] pt-3 lg:pt-3.5">
              {item.footer ? (
                <p className="truncate text-xs font-semibold text-brand-700 lg:text-[0.82rem] dark:text-brand-300">
                  {item.footer}
                </p>
              ) : null}
              {item.badge ? (
                <Badge className="mt-1.5 max-w-full truncate lg:mt-2">{item.badge}</Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  )
}

export function DashboardLiveList({
  accent = 'parcels',
  description,
  emptyLabel = 'Aucun contenu récent.',
  icon: SectionIcon,
  items,
  loading = false,
  path,
  scrollRef: externalScrollRef,
  title,
}) {
  const internalScrollRef = useHorizontalScroll()
  const scrollRef = externalScrollRef || internalScrollRef
  const headerIconStyle = dashboardLiveAccents[accent]?.icon || dashboardLiveAccents.parcels.icon

  return (
    <Card className={dashboardLiveCardClass}>
      <div className="p-5 sm:p-6 sm:pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {SectionIcon ? (
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-[0.75rem] ${headerIconStyle}`}
              >
                <SectionIcon className="text-lg" aria-hidden="true" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-[var(--app-text)] sm:text-xl">
                {title}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--app-text-muted)] sm:text-sm">{description}</p>
            </div>
          </div>
          <Link
            to={path}
            className="group/arrow grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--app-border)] bg-white transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:border-brand-200 hover:bg-[var(--app-surface-muted)] hover:shadow-[var(--shadow-card-hover)] dark:bg-[var(--app-surface)] dark:hover:border-brand-800"
            aria-label={`Voir ${title}`}
          >
            <FiArrowUpRight
              className="transition-transform duration-[var(--transition-base)] group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      <div ref={scrollRef} className={`${dashboardLiveTrackClass} px-5 pb-5 sm:px-6 sm:pb-6`}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`shrink-0 ${dashboardLiveItemClass}`}>
                <SkeletonCard />
              </div>
            ))
          : items.length
            ? items.map((item) => (
                <DashboardLiveTile
                  key={item.id}
                  accent={accent}
                  icon={item.icon || SectionIcon}
                  item={item}
                  path={path}
                />
              ))
            : (
              <p className="min-w-full shrink-0 rounded-[var(--radius-card)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 px-5 py-8 text-center text-sm text-[var(--app-text-muted)]">
                {emptyLabel}
              </p>
              )}
      </div>
    </Card>
  )
}
