import { FiAlertTriangle, FiCreditCard, FiTrendingDown, FiTrendingUp } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'

export function WalletPage() {
  const user = useSelector((state) => state.auth.user)
  const entries = useSelector((state) =>
    state.finance.walletEntries.filter((item) => item.userId === user.id),
  )
  const balances = entries.reduce((result, entry) => {
    const sign = entry.direction === 'in' ? 1 : -1
    result[entry.currency] = (result[entry.currency] || 0) + entry.amount * sign
    return result
  }, {})

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Finances"
        title="Portefeuille"
        description="Vue consolidée de vos soldes et mouvements sur MOXT."
      />
      <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex gap-3">
          <FiAlertTriangle className="mt-1 text-xl text-amber-600" />
          <p className="text-sm">
            Vérifiez toujours vos opérations et conservez vos justificatifs. En cas de doute, contactez le support MOXT.
          </p>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['XOF', 'RUB', 'EUR', 'USD'].map((currency) => (
          <Card key={currency}>
            <FiCreditCard className="text-xl text-brand-600" />
            <strong className="mt-4 block text-2xl">
              {formatMoney(balances[currency] || 0, currency)}
            </strong>
            <Badge tone="info">{currency}</Badge>
          </Card>
        ))}
      </div>
      {entries.length ? (
        <div className="grid gap-3">
          {entries.map((entry) => {
            const Icon = entry.direction === 'in' ? FiTrendingUp : FiTrendingDown
            return (
              <Card key={entry.id} className="flex items-center gap-4">
                <Icon className="text-xl text-brand-600" />
                <div className="min-w-0 flex-1">
                  <strong>{entry.label}</strong>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
                <strong>
                  {entry.direction === 'in' ? '+' : '-'}
                  {formatMoney(entry.amount, entry.currency)}
                </strong>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState title="Aucune écriture enregistrée" />
      )}
    </div>
  )
}
