import { FiClock } from 'react-icons/fi'
import { Card } from '../../../components/ui/Card'
import { DetailTimeline } from '../../../components/ui/DetailBlocks'
import { formatDate } from '../transferUtils'
import { transferTimelineLabels } from './transferDetailConfig'

export function TransferDetailTimelineCard({ transfer }) {
  return (
    <Card className="ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
      <h2 className="flex items-center gap-2 font-black">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiClock className="text-sm" />
        </span>
        Chronologie
      </h2>
      <div className="mt-5">
        <DetailTimeline
          items={transfer.timeline.map((event) => ({
            label: transferTimelineLabels[event.status],
            date: formatDate(event.at),
          }))}
        />
      </div>
    </Card>
  )
}
