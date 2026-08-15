import { FiArrowRight, FiArrowUpRight, FiBriefcase, FiShield, FiTrendingUp } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { statusMeta } from '../../../config/statuses'
import { transferNeedsClientAction } from '../../transfers/transferActionUtils'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { formatMoney } from '../../transfers/transferUtils'
import { DashboardBusinessRail } from './DashboardBusinessRail'

export function DashboardOverviewPanels({ activeTransfers, rate, user, business }) {
  const { t } = useLanguage()
  const sortedTransfers = [...activeTransfers].sort((left, right) => {
    const leftTurn = Number(transferNeedsClientAction(left))
    const rightTurn = Number(transferNeedsClientAction(right))
    return rightTurn - leftTurn
  })

  return (
    <>
      {!user.verified ? (
        <Card className="flex flex-col gap-3 border border-amber-200 bg-amber-50 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <FiShield />
            </span>
            <p className="text-sm font-bold">{t('dashboard.identityBanner.short')}</p>
          </div>
          <Link to="/verification" className="shrink-0">
            <Button>{t('dashboard.identityBanner.verify')}</Button>
          </Link>
        </Card>
      ) : null}

      <DashboardBusinessRail />

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="!border-0 shadow-none">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiTrendingUp />
            </span>
            <h2 className="font-black">{t('dashboard.overview.rateTitle')}</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <span className="text-xs text-[var(--app-text-muted)]">1 XOF</span>
              <strong className="mt-1 block text-lg">
                {Number.isFinite(rate.originToRub) ? rate.originToRub.toFixed(4) : '—'} RUB
              </strong>
            </div>
            <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <span className="text-xs text-[var(--app-text-muted)]">1 RUB</span>
              <strong className="mt-1 block text-lg">
                {Number.isFinite(rate.rubToOrigin) ? rate.rubToOrigin.toFixed(2) : '—'} XOF
              </strong>
            </div>
          </div>
        </Card>

        <Card className="!border-0 shadow-none">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black">{t('dashboard.overview.transfersTitle')}</h2>
            <Link
              to="/transfers/history"
              className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--app-border)]"
              aria-label={t('dashboard.overview.history')}
            >
              <FiArrowUpRight />
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {sortedTransfers.length ? (
              sortedTransfers.slice(0, 3).map((transfer) => {
                const amount = transfer.amountSent ?? transfer.amount ?? transfer.totalToPay
                const currency = transfer.currencyFrom ?? transfer.currency ?? 'XOF'
                const yourTurn = transferNeedsClientAction(transfer)
                return (
                  <Link
                    key={transfer.id}
                    to={`/transfers/${transfer.id}`}
                    state={{ transferView: 'client' }}
                    className={`relative rounded-2xl p-3 transition hover:bg-[var(--app-accent-soft)] ${
                      yourTurn
                        ? 'border border-amber-300/80 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/30'
                        : 'bg-[var(--app-surface-muted)]'
                    }`}
                  >
                    <span className="absolute top-0 right-2">
                      <TransferStatusBadge status={transfer.status} />
                    </span>
                    <strong className="block truncate pr-20 text-sm">
                      {formatMoney(amount, currency)} ·{' '}
                      {transfer.exchanger?.name || t('dashboard.overview.transfer')}
                    </strong>
                    {yourTurn ? (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-200">
                        {t('transfers.detail.nextStep.yourTurn')}
                      </span>
                    ) : null}
                  </Link>
                )
              })
            ) : (
              <div className="grid place-items-center gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-5 text-center text-sm text-[var(--app-text-muted)]">
                {t('dashboard.overview.noTransfersShort')}
                <Link to="/transfers">
                  <Button icon={FiArrowRight}>{t('dashboard.overview.createTransfer')}</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </section>

      {business ? (
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiBriefcase />
            </span>
            <div>
              <h2 className="font-black">{business.name}</h2>
              <p className="text-xs text-[var(--app-text-muted)]">
                {statusMeta(business.status, t).label}
              </p>
            </div>
          </div>
          <Link to="/professional" className="shrink-0">
            <Button variant="secondary" icon={FiArrowRight}>
              {t('dashboard.overview.openProfessional')}
            </Button>
          </Link>
        </Card>
      ) : null}
    </>
  )
}
