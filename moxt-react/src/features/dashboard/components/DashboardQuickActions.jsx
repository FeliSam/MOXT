import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { RevealListItem } from '../../../components/ui/RevealListItem'
import {
  dashboardFourUpItemClass,
  dashboardFourUpTrackClass,
  quickActionAccents,
  quickActions,
} from '../dashboardConfig'
import { Dashboard3DIcon } from './Dashboard3DIcon'

export function DashboardQuickActions({ scrollRef }) {
  return (
    <div ref={scrollRef} className={dashboardFourUpTrackClass}>
      {quickActions.map(({ description, image, imageLogo, label, path }, index) => (
        <RevealListItem key={label} index={index} className={dashboardFourUpItemClass}>
          <Link className="block h-full" to={path}>
            <Card
              className={`group flex h-full min-h-[9.5rem] flex-col justify-between bg-gradient-to-br transition duration-300 hover:-translate-y-1 hover:shadow-xl lg:min-h-[10.5rem] lg:p-5 ${quickActionAccents[index]}`}
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-black leading-snug lg:text-base">{label}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">{description}</p>
              </div>
              <Dashboard3DIcon
                className="mt-4 self-end lg:self-center"
                imageLogo={imageLogo}
                size="md"
                src={image}
              />
            </Card>
          </Link>
        </RevealListItem>
      ))}
    </div>
  )
}
