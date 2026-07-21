import { FiArrowRight, FiArrowUpRight, FiBriefcase, FiRepeat, FiShield, FiTrendingUp } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { statusMeta } from '../../../config/statuses'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { formatMoney } from '../../transfers/transferUtils'

export function DashboardOverviewPanels({ activeTransfers, rate, user, business }) {
  const { t } = useLanguage()

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

      <section className="grid gap-5 lg:grid-cols-2">
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
            {activeTransfers.length ? (
              activeTransfers.slice(0, 3).map((transfer) => {
                const amount = transfer.amountSent ?? transfer.amount ?? transfer.totalToPay
                const currency = transfer.currencyFrom ?? transfer.currency ?? 'XOF'
                return (
                  <Link
                    key={transfer.id}
                    to={`/transfers/${transfer.id}`}
                    state={{ transferView: 'client' }}
                    className="relative rounded-2xl bg-[var(--app-surface-muted)] p-3 transition hover:bg-[var(--app-accent-soft)]"
                  >
                    <span className="absolute top-0 right-2">
                      <TransferStatusBadge status={transfer.status} />
                    </span>
                    <strong className="block truncate text-sm">
                      {formatMoney(amount, currency)} ·{' '}
                      {transfer.exchanger?.name || t('dashboard.overview.transfer')}
                    </strong>
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
