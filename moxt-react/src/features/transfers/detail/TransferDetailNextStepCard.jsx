import { Card } from '../../../components/ui/Card'
import { TransferStatusBadge } from '../TransferStatusBadge'

export function TransferDetailNextStepCard({ nextStep, transfer }) {
  if (!nextStep) return null

  return (
    <Card className="bg-[var(--app-surface)] shadow-xl shadow-slate-200/60 dark:shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
            Prochaine étape
          </span>
          <h2 className="mt-2 text-xl font-black">{nextStep.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--app-text-muted)]">
            {nextStep.description}
          </p>
        </div>
        <TransferStatusBadge status={transfer.status} />
      </div>
    </Card>
  )
}
