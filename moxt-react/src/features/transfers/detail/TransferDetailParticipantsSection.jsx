import { FiUsers } from 'react-icons/fi'
import { Card } from '../../../components/ui/Card'
import { TransferParticipantCard } from './TransferDetailParts'

export function TransferDetailParticipantsSection({ transfer }) {
  return (
    <Card className="ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
      <h2 className="flex items-center gap-2 font-black">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiUsers className="text-sm" />
        </span>
        Participants
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TransferParticipantCard title="Expéditeur" party={transfer.sender} />
        <TransferParticipantCard title="Destinataire" party={transfer.recipient} />
      </div>
    </Card>
  )
}
