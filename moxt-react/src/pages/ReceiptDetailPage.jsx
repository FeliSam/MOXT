import { FiDownload, FiFileText, FiShare2 } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import { TransferProofsSection } from '../features/transfers/detail/TransferProofsSection'
import {
  downloadReceiptImage,
  printReceipt,
  shareReceipt,
} from '../features/transfers/receiptExport'
import { phase3Text } from '../i18n/phase3I18n'

export function ReceiptDetailPage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const { receiptId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const receipt = useSelector((state) =>
    state.finance.receipts.find((item) => item.id === receiptId && item.userId === user.id),
  )
  const transfer = useSelector((state) =>
    receipt?.relatedId
      ? state.transfers.items.find((item) => item.id === receipt.relatedId)
      : null,
  )

  if (!receipt) {
    return (
      <div className="grid min-w-0 gap-6">
        <PageHeader
          eyebrow={p3('receipts.eyebrow')}
          title={p3('receipts.notFound')}
          actions={<BackButton fallback="/receipts" />}
        />
        <Card>
          <p className="text-sm text-[var(--app-text-muted)]">{p3('receipts.notFoundBody')}</p>
          <Link to="/receipts" className="mt-4 inline-block">
            <Button variant="secondary">{p3('receipts.backToList')}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  function downloadTxt() {
    const content = [
      p3('receipts.txt.header'),
      p3('receipts.txt.reference', { id: receipt.id }),
      p3('receipts.txt.subject', { title: receipt.title }),
      p3('receipts.txt.amount', { amount: formatMoney(receipt.amount, receipt.currency) }),
      p3('receipts.txt.status', {
        status: receipt.status || p3('receipts.txt.statusFallback'),
      }),
      p3('receipts.txt.createdAt', { date: formatDate(receipt.createdAt) }),
      p3('receipts.txt.footer'),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${receipt.id}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid min-w-0 gap-6 overflow-x-clip sm:gap-7">
      <PageHeader
        eyebrow={p3('receipts.eyebrow')}
        title={receipt.title}
        description={`${formatMoney(receipt.amount, receipt.currency)} · ${formatDate(receipt.createdAt)}`}
        actions={<BackButton fallback="/receipts" />}
      />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiFileText className="text-xl" />
            </span>
            <Badge tone="info">{p3('receipts.badge')}</Badge>
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-3">
              <dt className="text-xs text-[var(--app-text-muted)]">{p3('receipts.fields.reference')}</dt>
              <dd className="mt-1 break-all font-bold">{receipt.id}</dd>
            </div>
            <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-3">
              <dt className="text-xs text-[var(--app-text-muted)]">{p3('receipts.fields.amount')}</dt>
              <dd className="mt-1 font-bold">{formatMoney(receipt.amount, receipt.currency)}</dd>
            </div>
            <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-3">
              <dt className="text-xs text-[var(--app-text-muted)]">{p3('receipts.fields.date')}</dt>
              <dd className="mt-1 font-bold">{formatDate(receipt.createdAt)}</dd>
            </div>
            <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-3">
              <dt className="text-xs text-[var(--app-text-muted)]">{p3('receipts.fields.status')}</dt>
              <dd className="mt-1 font-bold">
                {receipt.status || p3('receipts.txt.statusFallback')}
              </dd>
            </div>
          </dl>

          {transfer ? (
            <div className="mt-5 min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <h3 className="text-sm font-black">{p3('receipts.processing')}</h3>
              <div className="mt-3 grid gap-2">
                {(transfer.timeline || []).map((event) => (
                  <div
                    key={`${event.status}-${event.at}`}
                    className="flex min-w-0 flex-col gap-0.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <strong className="min-w-0 break-words">{event.status}</strong>
                    <span className="shrink-0 text-[var(--app-text-muted)]">
                      {formatDate(event.at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {transfer || receipt.details?.proofs?.length ? (
            <TransferProofsSection className="mt-5" receipt={receipt} transfer={transfer} />
          ) : null}
        </Card>

        <Card className="min-w-0 content-start lg:sticky lg:top-28">
          <h2 className="font-black">{p3('receipts.actions')}</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">{p3('receipts.actionsHint')}</p>
          <div className="mt-5 grid gap-2">
            {transfer ? (
              <>
                <Button
                  className="w-full"
                  variant="secondary"
                  icon={FiDownload}
                  onClick={() => printReceipt(transfer, t)}
                >
                  {p3('receipts.pdf')}
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  icon={FiDownload}
                  onClick={() => downloadReceiptImage(transfer, t)}
                >
                  {p3('receipts.image')}
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  icon={FiShare2}
                  onClick={() => shareReceipt(transfer, t)}
                >
                  {p3('receipts.share')}
                </Button>
              </>
            ) : (
              <Button className="w-full" variant="secondary" icon={FiDownload} onClick={downloadTxt}>
                {p3('receipts.download')}
              </Button>
            )}
            {receipt.relatedId ? (
              <Link to={`/transfers/${receipt.relatedId}`} className="block">
                <Button className="w-full" variant="primary">
                  {p3('receipts.viewTransfer')}
                </Button>
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
