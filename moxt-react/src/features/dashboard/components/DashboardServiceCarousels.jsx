import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import {
  coreServices,
  dashboardServiceItemClass,
  dashboardServicesTrackClass,
  serviceTones,
} from '../dashboardConfig'
import { Dashboard3DIcon } from './Dashboard3DIcon'
import { DashboardSectionHeading } from './DashboardSectionHeading'
import { ScrollArrows } from './ScrollArrows'

export function DashboardServiceCarousels({ coreServicesRef }) {
  const { t } = useLanguage()

  return (
    <section className="grid min-w-0 gap-3">
      <DashboardSectionHeading
        title={t('dashboard.services.title')}
        link="/businesses"
        linkLabel={t('dashboard.services.exploreAll')}
      />
      <div className="relative min-w-0 pb-3">
        <div ref={coreServicesRef} className={`${dashboardServicesTrackClass} min-w-0`}>
          {coreServices.map(({ descriptionKey, image, imageLogo, path, tagKey, titleKey }, index) => (
            <div key={titleKey} className={dashboardServiceItemClass}>
              <Link className="block h-full" to={path}>
                <Card className="group flex h-full flex-col overflow-hidden p-3 transition hover:shadow-lg">
                  <Dashboard3DIcon className="mx-auto -mb-1" imageLogo={imageLogo} size="lg" src={image} />
                  <h3 className="mt-3 font-black tracking-tight">{t(titleKey)}</h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-[var(--app-text-muted)]">
                    {t(descriptionKey)}
                  </p>
                  <div className="mt-4">
                    <Badge tone={serviceTones[index % coreServices.length]}>{t(tagKey)}</Badge>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
        <ScrollArrows scrollRef={coreServicesRef} />
      </div>
    </section>
  )
}
