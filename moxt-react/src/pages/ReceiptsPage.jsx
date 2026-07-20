import { FiChevronRight, FiFileText } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { phase3Text } from '../i18n/phase3I18n'

export function ReceiptsPage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const receipts = useSelector((state) =>
    state.finance.receipts.filter((item) => item.userId === user.id),
  )

  return (
    <div className="grid min-w-0 gap-6 sm:gap-7">
      <PageHeader
        eyebrow={p3('receipts.eyebrow')}
        title={p3('receipts.title')}
        description={p3('receipts.description')}
      />
      {receipts.length ? (
        <CatalogGrid columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" lazy={false}>
          {receipts.map((receipt) => (
            <Link key={receipt.id} to={`/receipts/${receipt.id}`} className="min-w-0 block h-full">
              <Card className="flex h-full min-w-0 flex-col transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                    <FiFileText className="text-lg" />
                  </span>
                  <Badge tone="info">{p3('receipts.badge')}</Badge>
                </div>
                <h2 className="mt-4 line-clamp-2 min-w-0 break-words font-black">{receipt.title}</h2>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                  <span className="font-bold text-[var(--app-text)]">
                    {formatMoney(receipt.amount, receipt.currency)}
                  </span>
                  <span className="mx-1.5">·</span>
                  {formatDate(receipt.createdAt)}
                </p>
                <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-bold text-brand-700 dark:text-brand-300">
                  {p3('receipts.open')}
                  <FiChevronRight />
                </span>
              </Card>
            </Link>
          ))}
        </CatalogGrid>
      ) : (
        <EmptyState icon={FiFileText} title={p3('receipts.empty')} />
      )}
    </div>
  )
}
