import { FiDownload, FiFileText, FiShare2 } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'
import {
  downloadReceiptImage,
  printReceipt,
  shareReceipt,
} from '../features/transfers/receiptExport'

export function ReceiptsPage() {
  const user = useSelector((state) => state.auth.user)
  const receipts = useSelector((state) =>
    state.finance.receipts.filter((item) => item.userId === user.id),
  )
  const transfers = useSelector((state) => state.transfers.items)

  function download(receipt) {
    const content = [
      'MOXT — REÇU DE SIMULATION',
      `Référence: ${receipt.id}`,
      `Objet: ${receipt.title}`,
      `Montant: ${formatMoney(receipt.amount, receipt.currency)}`,
      `Statut: ${receipt.status || 'non défini'}`,
      `Créé le: ${formatDate(receipt.createdAt)}`,
      'Ce document ne constitue pas une preuve de paiement réel.',
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
        eyebrow="Finances simulées"
        title="Reçus"
        description="Documents locaux associés aux parcours de démonstration."
      />
      {receipts.length ? (
        <CatalogGrid>
          {receipts.map((receipt) => {
            const transfer = transfers.find((item) => item.id === receipt.relatedId)
            return (
              <Card key={receipt.id}>
                <div className="flex items-start justify-between gap-3">
                  <FiFileText className="text-2xl text-brand-600" />
                  <Badge tone="info">Simulation</Badge>
                </div>
                <h2 className="mt-4 font-black">{receipt.title}</h2>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                  {formatMoney(receipt.amount, receipt.currency)} · {formatDate(receipt.createdAt)}
                </p>
                {transfer ? (
                  <>
                    <div className="mt-5 rounded-2xl bg-[var(--app-surface-muted)] p-4">
                      <h3 className="text-sm font-black">Traitement</h3>
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
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        icon={FiDownload}
                        onClick={() => printReceipt(transfer)}
                      >
                        PDF
                      </Button>
                      <Button
                        variant="secondary"
                        icon={FiDownload}
                        onClick={() => downloadReceiptImage(transfer)}
                      >
                        Image
                      </Button>
                      <Button
                        variant="secondary"
                        icon={FiShare2}
                        onClick={() => shareReceipt(transfer)}
                      >
                        Partager
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    className="mt-5"
                    variant="secondary"
                    icon={FiDownload}
                    onClick={() => download(receipt)}
                  >
                    Télécharger
                  </Button>
                )}
              </Card>
            )
          })}
        </CatalogGrid>
      ) : (
        <EmptyState icon={FiFileText} title="Aucun reçu enregistré" />
      )}
    </div>
  )
}
