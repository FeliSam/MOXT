import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { RevealListItem } from '../../../components/ui/RevealListItem'
import { RevealOnScroll } from '../../../components/ui/RevealOnScroll'
import {
  dashboardFourUpItemClass,
  dashboardFourUpTrackClass,
  quickActionAccents,
  quickActions,
} from '../dashboardConfig'
import { Dashboard3DIcon } from './Dashboard3DIcon'
import { DashboardSectionHeading } from './DashboardSectionHeading'
import { ScrollArrows } from './ScrollArrows'

export function DashboardQuickActionsSection({ scrollRef }) {
  return (
    <section className="grid min-w-0 gap-3">
      <RevealOnScroll delay={80}>
        <DashboardSectionHeading title="Actions rapides" link="/activities" linkLabel="Mes activités" />
      </RevealOnScroll>
      <div className="relative min-w-0">
        <div ref={scrollRef} className={`${dashboardFourUpTrackClass} min-w-0`}>
          {quickActions.map(({ description, image, imageLogo, label, path }, index) => (
            <RevealListItem
              key={label}
              index={index}
              className={`${dashboardFourUpItemClass} !w-[clamp(12rem,68vw,16rem)] md:!w-auto`}
            >
              <Link className="block h-full" to={path}>
                <Card
                  className={`group flex h-full min-h-[10.5rem] flex-col justify-between bg-gradient-to-br p-4 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[11rem] sm:p-5 md:min-h-[11.5rem] lg:min-h-[10.5rem] lg:p-5 xl:flex-row xl:items-center xl:justify-between xl:gap-4 ${quickActionAccents[index]}`}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black leading-snug">{label}</h3>
                    <p className="mt-2 text-sm leading-5 text-[var(--app-text-muted)] lg:text-xs">
                      {description}
                    </p>
                  </div>
                  <Dashboard3DIcon
                    className="mt-3 self-end xl:mt-0 xl:self-center"
                    imageLogo={imageLogo}
                    size="quick"
                    src={image}
                  />
                </Card>
              </Link>
            </RevealListItem>
          ))}
        </div>
        <ScrollArrows scrollRef={scrollRef} />
      </div>
    </section>
  )
}
