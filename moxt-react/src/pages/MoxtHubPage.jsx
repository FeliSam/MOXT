import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { RevealListItem } from '../components/ui/RevealListItem'
import { RevealOnScroll } from '../components/ui/RevealOnScroll'
import { preloadRoute } from '../config/navigation'
import { useLanguage } from '../contexts/useLanguage'
import { coreServices, quickActions } from '../features/dashboard/dashboardConfig'
import { DashboardBentoGrid } from '../features/dashboard/components/DashboardBentoGrid'
import {
  filterMoxtHubLinksByRole,
  moxtHubAdminLinks,
  moxtHubSecondaryGroups,
} from '../features/moxt/moxtHubConfig'

function HubSectionHeading({ id, title }) {
  return (
    <div className="min-w-0">
      <h2 id={id} className="text-xl font-black tracking-[-0.03em] text-[var(--app-text)] sm:text-2xl">
        {title}
      </h2>
    </div>
  )
}

function SecondaryLinkTile({ icon: Icon, labelKey, path, t, borderless = false }) {
  return (
    <Link
      to={path}
      onFocus={() => preloadRoute(path)}
      onMouseEnter={() => preloadRoute(path)}
      className={`group flex min-h-[3.75rem] items-center gap-3 rounded-[var(--radius-card)] bg-[var(--app-surface)] p-3 transition-all duration-[var(--transition-fast)] ${
        borderless
          ? 'shadow-none'
          : 'border border-[var(--app-border)] shadow-[var(--shadow-card)] hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)] dark:hover:border-brand-800'
      }`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface-muted)] text-[var(--app-accent)] dark:text-[var(--app-teal)]">
        <Icon className="text-lg" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--app-text)]">
        {t(labelKey)}
      </span>
      <FiChevronRight
        className="shrink-0 text-[var(--app-text-faint)] transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  )
}

export function MoxtHubPage() {
  const { t } = useLanguage()
  const role = useSelector((state) => state.auth.user?.role)
  const adminLinks = useMemo(
    () => filterMoxtHubLinksByRole(moxtHubAdminLinks, role),
    [role],
  )

  return (
    <div className="grid min-w-0 gap-8 overflow-x-clip sm:gap-10">
      <h1 className="sr-only">MOXT</h1>

      <section className="grid min-w-0 gap-4" aria-labelledby="moxt-hub-services">
        <RevealOnScroll>
          <HubSectionHeading
            id="moxt-hub-services"
            title={t('moxtHub.primaryServices')}
          />
        </RevealOnScroll>
        <DashboardBentoGrid items={coreServices} />
      </section>

      <section className="grid min-w-0 gap-4" aria-labelledby="moxt-hub-actions">
        <RevealOnScroll delay={60}>
          <HubSectionHeading
            id="moxt-hub-actions"
            title={t('moxtHub.quickActions')}
          />
        </RevealOnScroll>
        <DashboardBentoGrid items={quickActions} />
      </section>

      {adminLinks.length > 0 ? (
        <section
          className="grid min-w-0 gap-4 border-t border-[var(--app-border)] pt-8"
          aria-labelledby="moxt-hub-admin"
        >
          <RevealOnScroll delay={70}>
            <HubSectionHeading
              id="moxt-hub-admin"
              title={t('moxtHub.admin')}
            />
          </RevealOnScroll>
          <nav
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            aria-label={t('moxtHub.admin')}
          >
            {adminLinks.map((link, index) => (
              <RevealListItem key={link.path} index={index}>
                <SecondaryLinkTile {...link} t={t} borderless />
              </RevealListItem>
            ))}
          </nav>
        </section>
      ) : null}

      <section
        className="grid min-w-0 gap-6 border-t border-[var(--app-border)] pt-8"
        aria-labelledby="moxt-hub-secondary"
      >
        <RevealOnScroll delay={80}>
          <HubSectionHeading
            id="moxt-hub-secondary"
            title={t('moxtHub.secondary')}
          />
        </RevealOnScroll>
        {moxtHubSecondaryGroups.map((group) => (
          <div key={group.id} className="grid min-w-0 gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--app-text-faint)]">
              {t(group.titleKey)}
            </h3>
            <nav
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
              aria-label={t(group.titleKey)}
            >
              {group.links.map((link, index) => (
                <RevealListItem key={link.id || link.path} index={index}>
                  <SecondaryLinkTile {...link} t={t} borderless />
                </RevealListItem>
              ))}
            </nav>
          </div>
        ))}
      </section>
    </div>
  )
}
