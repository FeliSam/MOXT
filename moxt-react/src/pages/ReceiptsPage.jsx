import { FiDownload, FiFileText, FiShare2 } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
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

export function ReceiptsPage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const receipts = useSelector((state) =>
    state.finance.receipts.filter((item) => item.userId === user.id),
  )
  const transfers = useSelector((state) => state.transfers.items)

  function download(receipt) {
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
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('receipts.eyebrow')}
        title={p3('receipts.title')}
        description={p3('receipts.description')}
      />
      {receipts.length ? (
        <CatalogGrid>
          {receipts.map((receipt) => {
            const transfer = transfers.find((item) => item.id === receipt.relatedId)
            return (
              <Card key={receipt.id}>
                <div className="flex items-start justify-between gap-3">
                  <FiFileText className="text-2xl text-brand-600" />
                  <Badge tone="info">{p3('receipts.badge')}</Badge>
                </div>
                <h2 className="mt-4 font-black">{receipt.title}</h2>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                  {formatMoney(receipt.amount, receipt.currency)} · {formatDate(receipt.createdAt)}
                </p>
                {transfer || receipt.details?.proofs?.length ? (
                  <>
                    {transfer ? (
                      <div className="mt-5 rounded-2xl bg-[var(--app-surface-muted)] p-4">
                        <h3 className="text-sm font-black">{p3('receipts.processing')}</h3>
                        <div className="mt-3 grid gap-2">
                          {(transfer.timeline || []).map((event) => (
                            <div
                              key={`${event.status}-${event.at}`}
                              className="flex justify-between gap-3 text-xs"
                            >
                              <strong>{event.status}</strong>
                              <span className="text-[var(--app-text-muted)]">
                                {formatDate(event.at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <TransferProofsSection
                      className="mt-5"
                      receipt={receipt}
                      transfer={transfer}
                    />
                    {transfer ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          icon={FiDownload}
                          onClick={() => printReceipt(transfer, t)}
                        >
                          {p3('receipts.pdf')}
                        </Button>
                        <Button
                          variant="secondary"
                          icon={FiDownload}
                          onClick={() => downloadReceiptImage(transfer, t)}
                        >
                          {p3('receipts.image')}
                        </Button>
                        <Button
                          variant="secondary"
                          icon={FiShare2}
                          onClick={() => shareReceipt(transfer, t)}
                        >
                          {p3('receipts.share')}
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <Button
                    className="mt-5"
                    variant="secondary"
                    icon={FiDownload}
                    onClick={() => download(receipt)}
                  >
                    {p3('receipts.download')}
                  </Button>
                )}
              </Card>
            )
          })}
        </CatalogGrid>
      ) : (
        <EmptyState icon={FiFileText} title={p3('receipts.empty')} />
      )}
    </div>
  )
}
