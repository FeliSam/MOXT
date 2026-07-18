import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { RevealListItem } from '../components/ui/RevealListItem'
import { RevealOnScroll } from '../components/ui/RevealOnScroll'
import { preloadRoute } from '../config/navigation'
import { useLanguage } from '../contexts/useLanguage'
import {
  coreServices,
  quickActionAccents,
  quickActions,
  serviceTones,
} from '../features/dashboard/dashboardConfig'
import { Dashboard3DIcon } from '../features/dashboard/components/Dashboard3DIcon'
import {
  filterMoxtHubLinksByRole,
  moxtHubAdminLinks,
  moxtHubSecondaryLinks,
} from '../features/moxt/moxtHubConfig'

function HubSectionHeading({ description, id, title }) {
  return (
    <div className="min-w-0">
      <h2 id={id} className="text-xl font-black tracking-[-0.03em] text-[var(--app-text)] sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  )
}

function SecondaryLinkTile({ icon: Icon, labelKey, path, t }) {
  return (
    <Link
      to={path}
      onFocus={() => preloadRoute(path)}
      onMouseEnter={() => preloadRoute(path)}
      className="group flex min-h-[3.75rem] items-center gap-3 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-[var(--shadow-card)] transition-all duration-[var(--transition-fast)] hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)] dark:hover:border-brand-800"
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
      <RevealOnScroll>
        <header className="relative overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/70 via-transparent to-[var(--app-cobalt-soft)]/25 dark:from-brand-950/35 dark:to-[var(--app-cobalt-soft)]/15"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">
                {t('moxtHub.eyebrow')}
              </p>
              <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em] text-[var(--app-text)] sm:text-5xl">
                MOXT
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--app-text-muted)] sm:text-base">
                {t('moxtHub.description')}
              </p>
            </div>
            <img
              src="/assets/brand/mark.png?v=20260714e"
              alt=""
              className="size-14 shrink-0 rounded-2xl object-cover shadow-[var(--shadow-card)] sm:size-16"
              aria-hidden="true"
            />
          </div>
        </header>
      </RevealOnScroll>

      <section className="grid min-w-0 gap-4" aria-labelledby="moxt-hub-services">
        <RevealOnScroll delay={40}>
          <HubSectionHeading
            id="moxt-hub-services"
            title={t('moxtHub.primaryServices')}
            description={t('moxtHub.primaryServicesDesc')}
          />
        </RevealOnScroll>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {coreServices.map(({ descriptionKey, image, imageLogo, path, tagKey, titleKey }, index) => (
            <RevealListItem key={titleKey} index={index}>
              <Link
                className="block h-full"
                to={path}
                onFocus={() => preloadRoute(path)}
                onMouseEnter={() => preloadRoute(path)}
              >
                <Card
                  variant="interactive"
                  className="group flex h-full flex-col overflow-hidden !p-3 text-center sm:!p-5 sm:text-left"
                >
                  <Dashboard3DIcon
                    className="mx-auto sm:mx-0"
                    imageLogo={imageLogo}
                    size="sm"
                    src={image}
                  />
                  <div className="mt-2 min-w-0 flex-1 sm:mt-3">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <h3 className="font-black tracking-tight text-[var(--app-text)]">
                        {t(titleKey)}
                      </h3>
                      <Badge tone={serviceTones[index]}>{t(tagKey)}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)] sm:text-sm">
                      {t(descriptionKey)}
                    </p>
                  </div>
                </Card>
              </Link>
            </RevealListItem>
          ))}
        </div>
      </section>

      <section className="grid min-w-0 gap-4" aria-labelledby="moxt-hub-actions">
        <RevealOnScroll delay={60}>
          <HubSectionHeading
            id="moxt-hub-actions"
            title={t('moxtHub.quickActions')}
            description={t('moxtHub.quickActionsDesc')}
          />
        </RevealOnScroll>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map(({ descriptionKey, image, imageLogo, labelKey, path }, index) => (
            <RevealListItem key={labelKey} index={index}>
              <Link
                className="block h-full"
                to={path}
                onFocus={() => preloadRoute(path)}
                onMouseEnter={() => preloadRoute(path)}
              >
                <Card
                  className={`group flex h-full min-h-[9.5rem] flex-col justify-between bg-gradient-to-br !p-4 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:!p-5 ${quickActionAccents[index]}`}
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-black leading-snug sm:text-base">{t(labelKey)}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-[var(--app-text-muted)]">
                      {t(descriptionKey)}
                    </p>
                  </div>
                  <Dashboard3DIcon
                    className="mt-3 self-end"
                    imageLogo={imageLogo}
                    size="sm"
                    src={image}
                  />
                </Card>
              </Link>
            </RevealListItem>
          ))}
        </div>
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
              description={t('moxtHub.adminDesc')}
            />
          </RevealOnScroll>
          <nav
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            aria-label={t('moxtHub.admin')}
          >
            {adminLinks.map((link, index) => (
              <RevealListItem key={link.path} index={index}>
                <SecondaryLinkTile {...link} t={t} />
              </RevealListItem>
            ))}
          </nav>
        </section>
      ) : null}

      <section
        className="grid min-w-0 gap-4 border-t border-[var(--app-border)] pt-8"
        aria-labelledby="moxt-hub-secondary"
      >
        <RevealOnScroll delay={80}>
          <HubSectionHeading
            id="moxt-hub-secondary"
            title={t('moxtHub.secondary')}
            description={t('moxtHub.secondaryDesc')}
          />
        </RevealOnScroll>
        <nav
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={t('moxtHub.secondary')}
        >
          {moxtHubSecondaryLinks.map((link, index) => (
            <RevealListItem key={link.path} index={index}>
              <SecondaryLinkTile {...link} t={t} />
            </RevealListItem>
          ))}
        </nav>
      </section>
    </div>
  )
}
