import { FiAlertCircle, FiCheck, FiCopy, FiCreditCard } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { countryLabel, receivingSlotForDirection, transferAccountSlotMeta } from './transferAccountUtils'
import { directionLabel } from './transferUtils'

export function TransferReceivingAccountCard({
  account,
  direction,
  originCountry = 'BJ',
  onCopy,
  className = '',
  compact = false,
}) {
  const slotMeta = transferAccountSlotMeta(receivingSlotForDirection(direction), originCountry)

  if (!account) {
    return (
      <Card className={`border border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 ${className}`}>
        <div className="flex items-start gap-3">
          <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-black text-amber-900 dark:text-amber-200">
              Coordonnées de réception indisponibles
            </p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              Cette entreprise n&apos;a pas encore configuré le compte actif pour{' '}
              {direction ? directionLabel(direction).toLowerCase() : 'ce sens de transfert'}.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const copyValue = account.phone || account.accountNumber

  return (
    <Card
      className={`ring-1 ring-brand-200/70 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)] dark:ring-brand-800/70 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <FiCreditCard />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
              Compte de réception actif
            </p>
            <h3 className="mt-1 font-black">
              {account.label || account.method || 'Coordonnées entreprise'}
            </h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {direction ? directionLabel(direction) : slotMeta.directionHint} ·{' '}
              {countryLabel(account.country)}
            </p>
          </div>
        </div>
        <Badge tone="success">
          <FiCheck className="mr-1 inline text-xs" />
          Actif
        </Badge>
      </div>

      <div className={`mt-4 grid gap-2 ${compact ? 'text-sm' : ''}`}>
        <InfoRow label="Bénéficiaire" value={account.recipientName} />
        <InfoRow label="Méthode" value={account.method || account.bankName} />
        <InfoRow label="Numéro ou compte" value={account.phone || account.accountNumber} />
        {account.bankName ? <InfoRow label="Banque" value={account.bankName} /> : null}
        {account.instructions ? (
          <p className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">
            {account.instructions}
          </p>
        ) : null}
      </div>

      {copyValue && onCopy ? (
        <Button
          variant="secondary"
          icon={FiCopy}
          className="mt-4"
          onClick={() => onCopy(copyValue)}
        >
          Copier les coordonnées
        </Button>
      ) : null}
    </Card>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--app-border)] py-2 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
        {label}
      </span>
      <strong className="text-right text-sm">{value}</strong>
    </div>
  )
}
