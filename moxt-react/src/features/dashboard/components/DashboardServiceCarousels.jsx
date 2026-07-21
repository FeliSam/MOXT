import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { coreServices } from '../dashboardConfig'
import { Dashboard3DIcon } from './Dashboard3DIcon'
import { DashboardSectionHeading } from './DashboardSectionHeading'

const SIZE_CLASS = {
  hero: 'dashboard-bento-tile--hero col-span-2 min-h-[9.25rem] sm:min-h-[10rem]',
  featured: 'dashboard-bento-tile--featured min-h-[8.5rem] sm:row-span-2 sm:min-h-0',
  medium: 'dashboard-bento-tile--medium min-h-[7.25rem]',
  compact: 'dashboard-bento-tile--compact min-h-[6.35rem]',
}

const ICON_SIZE = {
  hero: 'hero',
  featured: 'featured',
  medium: 'lg',
  compact: 'compact',
}

export function DashboardServiceCarousels() {
  const { t } = useLanguage()

  return (
    <section className="grid min-w-0 gap-3">
      <DashboardSectionHeading
        title={t('dashboard.services.title')}
        link="/businesses"
        linkLabel={t('dashboard.services.exploreAll')}
      />

      <div className="dashboard-services-bento">
        {coreServices.map((service) => {
          const size = service.size || 'compact'
          const showDescription = size === 'hero' || size === 'featured'
          return (
            <Link
              key={service.id || service.titleKey}
              to={service.path}
              className={`dashboard-bento-tile group ${SIZE_CLASS[size]} ${service.surface || 'bg-[var(--app-surface-muted)]'}`}
            >
              <div className="relative z-[1] flex h-full min-h-0 flex-col justify-between pr-14 sm:pr-16">
                <div className="min-w-0">
                  <h3
                    className={`font-black tracking-tight text-[var(--app-text)] ${
                      size === 'hero'
                        ? 'text-lg sm:text-xl'
                        : size === 'featured'
                          ? 'text-base sm:text-lg'
                          : 'text-sm sm:text-base'
                    }`}
                  >
                    {t(service.titleKey)}
                  </h3>
                  {showDescription ? (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--app-text-muted)] sm:text-sm sm:leading-6">
                      {t(service.descriptionKey)}
                    </p>
                  ) : null}
                </div>
                {service.tagKey ? (
                  <span className="mt-3 w-fit rounded-lg bg-[color-mix(in_srgb,var(--app-surface)_72%,transparent)] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                    {t(service.tagKey)}
                  </span>
                ) : null}
              </div>
              <Dashboard3DIcon
                imageLogo={service.imageLogo}
                pos={service.iconPos || 'br'}
                size={ICON_SIZE[size]}
                src={service.image}
              />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
