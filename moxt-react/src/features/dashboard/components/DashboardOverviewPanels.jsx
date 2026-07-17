import {
  FiArrowRight,
  FiArrowUpRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiInbox,
  FiRepeat,
  FiShield,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { RevealOnScroll } from '../../../components/ui/RevealOnScroll'
import { useLanguage } from '../../../contexts/useLanguage'
import { statusMeta } from '../../../config/statuses'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { formatMoney } from '../../transfers/transferUtils'

export function DashboardOverviewPanels({
  activeTransfers,
  onboardingComplete,
  onboardingDone,
  onboardingSteps,
  profileCompletion,
  rate,
  todoItems,
  user,
  business,
}) {
  const { t } = useLanguage()

  return (
    <>
      {!user.verified ? (
        <RevealOnScroll delay={40}>
          <Card className="flex flex-col gap-4 border border-amber-200 bg-amber-50 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <FiShield />
              </span>
              <div>
                <h2 className="font-black">{t('dashboard.identityBanner.title')}</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {t('dashboard.identityBanner.description')}
                </p>
              </div>
            </div>
            <Link to="/verification" className="shrink-0">
              <Button>{t('dashboard.identityBanner.verify')}</Button>
            </Link>
          </Card>
        </RevealOnScroll>
      ) : null}

      <RevealOnScroll as="section" className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <FiInbox />
            </span>
            <div>
              <h2 className="font-black">{t('dashboard.overview.todoTitle')}</h2>
              <p className="text-xs text-[var(--app-text-muted)]">{t('dashboard.overview.todoDescription')}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {todoItems.length ? (
              todoItems.map((item) => (
                <Link
                  key={item.labelKey}
                  to={item.to}
                  className="group/row flex items-center gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-3 transition-all duration-[var(--transition-base)] hover:translate-x-1 hover:bg-[var(--app-accent-soft)]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-surface)] text-[var(--app-accent)] transition-transform duration-[var(--transition-base)] group-hover/row:scale-110">
                    <item.icon />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-bold">
                    {t(item.labelKey, { count: item.count })}
                  </span>
                  <FiChevronRight className="shrink-0 text-[var(--app-text-muted)] transition-transform duration-[var(--transition-base)] group-hover/row:translate-x-0.5 group-hover/row:text-[var(--app-accent)]" />
                </Link>
              ))
            ) : (
              <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <FiCheckCircle /> {t('dashboard.overview.allUpToDate')}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <FiRepeat />
              </span>
              <div>
                <h2 className="font-black">{t('dashboard.overview.transfersTitle')}</h2>
                <p className="text-xs text-[var(--app-text-muted)]">{t('dashboard.overview.transfersDescription')}</p>
              </div>
            </div>
            <Link
              to="/transfers/history"
              className="group/arrow grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--app-border)] transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] hover:shadow-[var(--shadow-card-hover)]"
              aria-label={t('dashboard.overview.history')}
            >
              <FiArrowUpRight className="transition-transform duration-[var(--transition-base)] group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5" />
            </Link>
          </div>
          <div className="mt-5 grid gap-2">
            {activeTransfers.length ? (
              activeTransfers.slice(0, 4).map((transfer) => {
                const amount = transfer.amountSent ?? transfer.amount ?? transfer.totalToPay
                const currency = transfer.currencyFrom ?? transfer.currency ?? 'XOF'
                return (
                  <Link
                    key={transfer.id}
                    to={`/transfers/${transfer.id}`}
                    state={{ transferView: 'client' }}
                    className="relative rounded-2xl bg-[var(--app-surface-muted)] p-3 transition-all duration-[var(--transition-base)] hover:translate-x-1 hover:bg-[var(--app-accent-soft)] hover:shadow-[var(--shadow-card)]"
                  >
                    <span className="absolute top-0 right-2">
                      <TransferStatusBadge status={transfer.status} />
                    </span>
                    <strong className="block truncate text-sm">
                      {formatMoney(amount, currency)} ·{' '}
                      {transfer.exchanger?.name || t('dashboard.overview.transfer')}
                    </strong>
                    <span className="text-xs text-[var(--app-text-muted)]">{transfer.id}</span>
                  </Link>
                )
              })
            ) : (
              <div className="grid place-items-center gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-5 text-center text-sm text-[var(--app-text-muted)]">
                {t('dashboard.overview.noTransfers')}
                <Link to="/transfers">
                  <Button icon={FiArrowRight}>{t('dashboard.overview.createTransfer')}</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </RevealOnScroll>

      <RevealOnScroll as="section" className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiTrendingUp />
            </span>
            <div className="min-w-0">
              <h2 className="font-black">{t('dashboard.overview.rateTitle')}</h2>
              <p className="truncate text-xs text-[var(--app-text-muted)]">
                {rate.source || t('dashboard.overview.referenceRate')} ·{' '}
                {rate.date || t('dashboard.overview.today')}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <span className="text-xs text-[var(--app-text-muted)]">1 XOF</span>
              <strong className="mt-1 block text-lg">{rate.xofToRub?.toFixed?.(4) ?? '—'} RUB</strong>
            </div>
            <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <span className="text-xs text-[var(--app-text-muted)]">1 RUB</span>
              <strong className="mt-1 block text-lg">{rate.rubToXof?.toFixed?.(2) ?? '—'} XOF</strong>
            </div>
          </div>
          <Link to="/transfers" className="mt-4 inline-block">
            <Button icon={FiArrowRight}>{t('dashboard.overview.sendMoney')}</Button>
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiUser />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black">{t('dashboard.overview.profileCompletion')}</h2>
              <p className="text-xs text-[var(--app-text-muted)]">
                {t('dashboard.overview.profileFields')}
              </p>
            </div>
            <span className="text-2xl font-black">{profileCompletion}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${profileCompletion}%` }} />
          </div>
          {profileCompletion < 100 ? (
            <Link to="/profile/information" className="mt-4 inline-block">
              <Button variant="secondary" icon={FiArrowRight}>
                {t('dashboard.overview.completeProfile')}
              </Button>
            </Link>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <FiCheckCircle /> {t('dashboard.overview.profileComplete')}
            </p>
          )}
        </Card>
      </RevealOnScroll>

      {business ? (
        <RevealOnScroll>
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <FiBriefcase />
              </span>
              <div>
                <h2 className="font-black">{business.name}</h2>
                <p className="text-xs text-[var(--app-text-muted)]">
                  {t('dashboard.overview.professionalSpace', {
                    status: statusMeta(business.status, t).label,
                  })}
                </p>
              </div>
            </div>
            <Link to="/professional" className="shrink-0">
              <Button variant="secondary" icon={FiArrowRight}>
                {t('dashboard.overview.openProfessional')}
              </Button>
            </Link>
          </Card>
        </RevealOnScroll>
      ) : null}

      {!onboardingComplete ? (
        <RevealOnScroll>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black">{t('dashboard.overview.onboardingTitle')}</h2>
                <p className="text-xs text-[var(--app-text-muted)]">
                  {t('dashboard.overview.onboardingDescription')}
                </p>
              </div>
              <Badge>
                {onboardingDone}/{onboardingSteps.length}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {onboardingSteps.map((step) => (
                <Link
                  key={step.labelKey}
                  to={step.to}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition-all duration-[var(--transition-base)] ${
                    step.done
                      ? 'bg-[var(--app-surface-muted)] opacity-70'
                      : 'bg-[var(--app-surface-muted)] hover:-translate-y-0.5 hover:bg-[var(--app-accent-soft)] hover:shadow-[var(--shadow-card)]'
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${
                      step.done
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-[var(--app-border)] text-transparent'
                    }`}
                  >
                    <FiCheck />
                  </span>
                  <span className={`min-w-0 flex-1 text-sm font-bold ${step.done ? 'line-through' : ''}`}>
                    {t(step.labelKey)}
                  </span>
                  {!step.done ? (
                    <FiChevronRight className="shrink-0 text-[var(--app-text-muted)]" />
                  ) : null}
                </Link>
              ))}
            </div>
          </Card>
        </RevealOnScroll>
      ) : null}
    </>
  )
}
