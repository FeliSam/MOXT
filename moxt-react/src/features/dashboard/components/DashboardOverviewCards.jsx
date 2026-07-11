import {
  FiArrowRight,
  FiArrowUpRight,
  FiCheckCircle,
  FiChevronRight,
  FiInbox,
  FiRepeat,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { RevealOnScroll } from '../../../components/ui/RevealOnScroll'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { formatMoney } from '../../transfers/transferUtils'

export function DashboardOverviewCards({ activeTransfers, todoItems }) {
  return (
    <RevealOnScroll as="section" className="grid gap-5 lg:grid-cols-2">
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <FiInbox />
          </span>
          <div>
            <h2 className="font-black">Actions à faire</h2>
            <p className="text-xs text-[var(--app-text-muted)]">Ce qui attend votre intervention.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          {todoItems.length ? (
            todoItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-3 transition hover:bg-[var(--app-accent-soft)]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-surface)] text-[var(--app-accent)]">
                  <item.icon />
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold">{item.label}</span>
                <FiChevronRight className="shrink-0 text-[var(--app-text-muted)]" />
              </Link>
            ))
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <FiCheckCircle /> Tout est à jour, aucune action en attente.
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
              <h2 className="font-black">Mes transferts en cours</h2>
              <p className="text-xs text-[var(--app-text-muted)]">Suivi de vos opérations actives.</p>
            </div>
          </div>
          <Link
            to="/transfers/history"
            className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[var(--app-border)]"
            aria-label="Voir l’historique des transferts"
          >
            <FiArrowUpRight />
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
                  className="relative rounded-2xl bg-[var(--app-surface-muted)] p-3 transition hover:bg-[var(--app-accent-soft)]"
                >
                  <span className="absolute top-0 right-2">
                    <TransferStatusBadge status={transfer.status} />
                  </span>
                  <strong className="block truncate text-sm">
                    {formatMoney(amount, currency)} ·{' '}
                    {transfer.exchanger?.name || 'Transfert'}
                  </strong>
                  <span className="text-xs text-[var(--app-text-muted)]">{transfer.id}</span>
                </Link>
              )
            })
          ) : (
            <div className="grid place-items-center gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-5 text-center text-sm text-[var(--app-text-muted)]">
              Aucun transfert en cours.
              <Link to="/transfers">
                <Button icon={FiArrowRight}>Créer un transfert</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </RevealOnScroll>
  )
}
