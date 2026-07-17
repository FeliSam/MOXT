import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { RevealListItem } from '../../../components/ui/RevealListItem'
import { RevealOnScroll } from '../../../components/ui/RevealOnScroll'
import { useLanguage } from '../../../contexts/useLanguage'
import {
  coreServices,
  dashboardFourUpItemClass,
  dashboardFourUpTrackClass,
  dashboardServiceItemClass,
  dashboardServicesTrackClass,
  serviceTones,
  trustHighlights,
} from '../dashboardConfig'
import { Dashboard3DIcon } from './Dashboard3DIcon'
import { DashboardSectionHeading } from './DashboardSectionHeading'
import { ScrollArrows } from './ScrollArrows'
import { useAutoHorizontalScroll } from '../../../hooks/useAutoHorizontalScroll'

export function DashboardServiceCarousels({ coreServicesRef, trustHighlightsRef }) {
  const { t } = useLanguage()
  useAutoHorizontalScroll(coreServicesRef, { loop: true })
  const essentialServices = [...coreServices, ...coreServices]
  return (
    <>
      <div className="relative min-w-0 pb-3">
        <div ref={trustHighlightsRef} className={`${dashboardFourUpTrackClass} min-w-0`}>
          {trustHighlights.map(({ titleKey, descriptionKey }, index) => (
            <RevealListItem key={titleKey} index={index} className={dashboardFourUpItemClass}>
              <Card className="relative flex h-full min-h-[9.5rem] flex-col overflow-hidden lg:min-h-[10.5rem] lg:p-6">
                <span className="text-3xl font-black text-brand-200 dark:text-brand-800">0{index + 1}</span>
                <h2 className="mt-5 font-black leading-snug lg:text-base">{t(titleKey)}</h2>
                <p className="mt-2 flex-1 text-xs leading-5 text-[var(--app-text-muted)] lg:text-sm">
                  {t(descriptionKey)}
                </p>
              </Card>
            </RevealListItem>
          ))}
        </div>
        <ScrollArrows scrollRef={trustHighlightsRef} />
      </div>

      <RevealOnScroll delay={80}>
        <DashboardSectionHeading
          title={t('dashboard.services.title')}
          link="/businesses"
          linkLabel={t('dashboard.services.exploreAll')}
        />
      </RevealOnScroll>
      <div className="relative min-w-0 pb-3">
        <div ref={coreServicesRef} className={`${dashboardServicesTrackClass} min-w-0`}>
          {essentialServices.map(({ descriptionKey, image, imageLogo, path, tagKey, titleKey }, index) => (
            <RevealListItem
              key={`${titleKey}-${index}`}
              index={index % coreServices.length}
              className={dashboardServiceItemClass}
            >
              <Link className="block h-full" to={path} tabIndex={index < coreServices.length ? undefined : -1} aria-hidden={index >= coreServices.length}>
                <Card className="group flex h-full flex-col overflow-hidden p-3 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <Dashboard3DIcon className="mx-auto -mb-1" imageLogo={imageLogo} size="lg" src={image} />
                  <h3 className="mt-3 font-black tracking-tight">{t(titleKey)}</h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-[var(--app-text-muted)]">{t(descriptionKey)}</p>
                  <div className="mt-4">
                    <Badge tone={serviceTones[index % coreServices.length]}>{t(tagKey)}</Badge>
                  </div>
                </Card>
              </Link>
            </RevealListItem>
          ))}
        </div>
        <ScrollArrows scrollRef={coreServicesRef} />
      </div>
    </>
  )
}
