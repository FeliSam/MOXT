import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { TransferStatusBadge } from '../TransferStatusBadge'

export function TransferDetailNextStepCard({ actionView, nextStep, transfer }) {
  const { t } = useLanguage()
  if (!nextStep) return null

  const title = nextStep.titleKey ? t(nextStep.titleKey) : nextStep.title
  const description = nextStep.descriptionKey
    ? t(nextStep.descriptionKey)
    : nextStep.description

  const isYourTurn =
    actionView === 'client' ||
    actionView === 'business' ||
    (actionView === 'admin' &&
      (title?.includes('client') ||
        title?.includes('entreprise') ||
        nextStep.title?.includes('client') ||
        nextStep.title?.includes('entreprise')))

  return (
    <Card
      className={`bg-[var(--app-surface)] shadow-xl shadow-slate-200/60 dark:shadow-black/20 ${
        isYourTurn && actionView !== 'admin' ? 'ring-2 ring-brand-300 dark:ring-brand-700' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
            {actionView === 'admin'
              ? t('transfers.detail.nextStep.globalView')
              : isYourTurn
                ? t('transfers.detail.nextStep.yourTurn')
                : t('transfers.detail.nextStep.tracking')}
          </span>
          <h2 className="mt-2 text-xl font-black">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--app-text-muted)]">
            {description}
          </p>
        </div>
        <TransferStatusBadge status={transfer.status} />
      </div>
    </Card>
  )
}
