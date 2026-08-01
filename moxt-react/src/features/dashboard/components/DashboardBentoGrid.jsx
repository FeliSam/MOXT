import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { preloadRoute } from '../../../config/navigation'
import { Dashboard3DIcon } from './Dashboard3DIcon'

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

function titleKeyOf(item) {
  return item.titleKey || item.labelKey
}

function descriptionKeyOf(item) {
  return item.descriptionKey
}

/**
 * Grille bento asymétrique (hero / featured / medium / compact).
 * items: { path, image, imageLogo, size, iconPos, surface, titleKey|labelKey, descriptionKey?, tagKey? }
 */
export function DashboardBentoGrid({ items, className = '' }) {
  const { t } = useLanguage()

  return (
    <div className={`dashboard-services-bento ${className}`.trim()}>
      {items.map((item) => {
        const size = item.size || 'compact'
        const titleKey = titleKeyOf(item)
        const descriptionKey = descriptionKeyOf(item)
        const showDescription =
          (size === 'hero' || size === 'featured') && Boolean(descriptionKey)

        return (
          <Link
            key={item.id || titleKey}
            to={item.path}
            onFocus={() => preloadRoute(item.path)}
            onMouseEnter={() => preloadRoute(item.path)}
            className={`dashboard-bento-tile group ${SIZE_CLASS[size]} ${item.surface || 'bg-[var(--app-surface-muted)]'}`}
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
                  {t(titleKey)}
                </h3>
                {showDescription ? (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--app-text-muted)] sm:text-sm sm:leading-6">
                    {t(descriptionKey)}
                  </p>
                ) : null}
              </div>
              {item.tagKey ? (
                <span className="mt-3 w-fit rounded-lg bg-[color-mix(in_srgb,var(--app-surface)_72%,transparent)] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                  {t(item.tagKey)}
                </span>
              ) : null}
            </div>
            <Dashboard3DIcon
              imageLogo={item.imageLogo}
              pos={item.iconPos || 'br'}
              size={ICON_SIZE[size]}
              src={item.image}
            />
          </Link>
        )
      })}
    </div>
  )
}
