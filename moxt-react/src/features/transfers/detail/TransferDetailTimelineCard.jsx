import { FiClock } from 'react-icons/fi'
import { Card } from '../../../components/ui/Card'
import { DetailTimeline } from '../../../components/ui/DetailBlocks'
import { useLanguage } from '../../../contexts/useLanguage'
import { formatDate } from '../transferUtils'
import { buildTransferTimelineItems } from './transferTimelineUtils'

export function TransferDetailTimelineCard({ transfer }) {
  const { t } = useLanguage()
  const items = buildTransferTimelineItems(transfer, t, formatDate)
  return (
    <Card className="ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
      <h2 className="flex items-center gap-2 font-black">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiClock className="text-sm" />
        </span>
        {t('transfers.detail.timeline.title')}
      </h2>
      <div className="mt-5">
        <DetailTimeline items={items} />
      </div>
    </Card>
  )
}
