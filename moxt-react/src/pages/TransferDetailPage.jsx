import { useState } from 'react'
import { FiArrowLeft, FiClock, FiRepeat, FiShield, FiUser } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { ContactButton } from '../features/communications/ContactButton'
import { openDispute } from '../features/disputes/disputeSlice'
import { createReceipt } from '../features/finance/financeSlice'
import { TransferDetailActionsPanel } from '../features/transfers/detail/TransferDetailActionsPanel'
import { TransferDetailAdminPanel } from '../features/transfers/detail/TransferDetailAdminPanel'
import { TransferDetailFinancialCard } from '../features/transfers/detail/TransferDetailFinancialCard'
import { TransferDetailHeroCard } from '../features/transfers/detail/TransferDetailHeroCard'
import { TransferDetailNextStepCard } from '../features/transfers/detail/TransferDetailNextStepCard'
import { TransferDetailNotFound } from '../features/transfers/detail/TransferDetailNotFound'
import { TransferDetailParticipantsSection } from '../features/transfers/detail/TransferDetailParticipantsSection'
import { TransferDetailStatusSection } from '../features/transfers/detail/TransferDetailStatusSection'
import { TransferDetailTimelineCard } from '../features/transfers/detail/TransferDetailTimelineCard'
import {
  getTransferDetailAccess,
  transferTimelineLabels,
} from '../features/transfers/detail/transferDetailConfig'
import { useTransferDetail } from '../features/transfers/detail/useTransferDetail'
import { printReceipt } from '../features/transfers/receiptExport'
import { cancelTransfer, declarePayment } from '../features/transfers/transferSlice'
import {
  directionLabel,
  formatDate,
  formatMoney,
  getTransferPricing,
} from '../features/transfers/transferUtils'
import { usePaymentCountdown } from '../features/transfers/usePaymentCountdown'
import { addToast } from '../features/ui/uiSlice'
import { storageService } from '../services/storageService'

export function TransferDetailPage() {
  const [proof, setProof] = useState(null)
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimReason, setClaimReason] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const dispatch = useDispatch()
  const { transferId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const { business, transfer } = useTransferDetail(transferId, user)
  const countdown = usePaymentCountdown(transfer?.paymentDeadlineAt)

  if (!transfer) {
    return <TransferDetailNotFound />
  }

  const pricing = getTransferPricing(transfer)
  const currFrom = transfer.currencyFrom || 'XOF'
  const currTo = transfer.currencyTo || 'RUB'
  const access = getTransferDetailAccess(transfer, user, business)

  function downloadReceipt() {
    dispatch(
      createReceipt({
        userId: user.id,
        relatedType: 'transfer',
        relatedId: transfer.id,
        title: `Transfert ${transfer.id}`,
        amount: pricing.totalToPay,
        currency: transfer.currencyFrom,
        status: transfer.status,
        details: { exchanger: transfer.exchanger?.name },
      }),
    )
    printReceipt(transfer)
  }

  function copyValue(value, label) {
    if (!value) return
    navigator.clipboard?.writeText(value)
    dispatch(
      addToast({
        title: 'Copié',
        message: `${label} copié dans le presse-papiers.`,
        tone: 'info',
      }),
    )
  }

  async function handleProofSelected(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setProof({ file, uploading: true })
    try {
      const url = await storageService.uploadTransferProof(user.id, transfer.id, file)
      setProof({ file, url, uploading: false })
      dispatch(
        addToast({
          title: 'Preuve ajoutée',
          message: 'Le justificatif de paiement est prêt.',
          tone: 'success',
        }),
      )
    } catch {
      setProof(null)
      dispatch(
        addToast({
          title: 'Envoi impossible',
          message: "Le justificatif n'a pas pu être envoyé.",
          tone: 'error',
        }),
      )
    }
  }

  return (
    <div className="finance-hero-glow grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        eyebrow={transfer.id}
        title="Détail du transfert"
        description={`${directionLabel(transfer.direction)} · créé le ${formatDate(transfer.createdAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <ContactButton
              ownerId={access.contactId}
              relatedId={transfer.id}
              relatedPath={`/transfers/${transfer.id}`}
              relatedTitle={`Transfert ${transfer.id} · ${access.contactTitle}`}
              relatedType="transfer"
              variant="secondary"
            />
            <Link to={access.isBusinessViewer ? '/professional' : '/transfers/history'}>
              <Button variant="secondary" icon={FiArrowLeft}>
                Retour
              </Button>
            </Link>
          </div>
        }
      />

      <DetailMetrics
        items={[
          { icon: FiRepeat, label: 'Direction', value: directionLabel(transfer.direction) },
          { icon: FiClock, label: 'Création', value: formatDate(transfer.createdAt) },
          {
            icon: FiUser,
            label: 'Destinataire',
            value: `${transfer.recipient.firstName} ${transfer.recipient.lastName}`,
          },
          {
            icon: FiShield,
            label: 'Partenaire',
            value: transfer.exchanger?.name || 'Partenaire historique',
          },
        ]}
      />

      <TransferDetailHeroCard transfer={transfer} />

      <TransferDetailStatusSection
        canDeclare={access.canDeclare}
        countdown={countdown}
        transfer={transfer}
      />

      <TransferDetailNextStepCard nextStep={access.nextStep} transfer={transfer} />

      <div className="grid gap-5 xl:grid-cols-2">
        <TransferDetailFinancialCard
          transfer={transfer}
          onCopyReference={() => copyValue(transfer.id, 'La référence')}
          onDownloadReceipt={downloadReceipt}
        />

        <TransferDetailParticipantsSection
          transfer={transfer}
          onCopyPaymentNumber={
            transfer.exchanger?.paymentDetails
              ? () =>
                  copyValue(
                    transfer.exchanger.paymentDetails.phone ||
                      transfer.exchanger.paymentDetails.accountNumber,
                    'Le numéro',
                  )
              : undefined
          }
        />

        <TransferDetailTimelineCard transfer={transfer} />

        <TransferDetailActionsPanel
          transfer={transfer}
          proof={proof}
          canDeclare={access.canDeclare}
          canCancel={access.canCancel}
          canReceive={access.canReceive}
          onProofSelected={handleProofSelected}
          onDeclarePayment={() =>
            dispatch(
              declarePayment({
                id: transfer.id,
                proof: {
                  name: proof.file.name,
                  size: proof.file.size,
                  type: proof.file.type,
                  url: proof.url,
                  uploadedAt: new Date().toISOString(),
                },
              }),
            )
          }
          onCancel={() => setCancelOpen(true)}
          onOpenClaim={() => setClaimOpen(true)}
        />

        {access.isAdminViewer ? <TransferDetailAdminPanel transfer={transfer} /> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title="Informations de l’opération">
          <DetailFacts
            items={[
              { label: 'Référence', value: transfer.id },
              { label: 'Statut', value: transferTimelineLabels[transfer.status] || transfer.status },
              {
                label: 'Montant envoyé',
                value: formatMoney(pricing.amountSent, currFrom),
              },
              {
                label: 'Montant reçu (estimé)',
                value: formatMoney(transfer.amountReceived ?? (pricing.amountSent * (transfer.rate || 1)), currTo),
              },
              {
                label: 'Total à payer',
                value: formatMoney(pricing.totalToPay, currFrom),
              },
              { label: 'Simulation', value: 'Oui, aucun argent transmis' },
            ]}
          />
        </DetailSection>
        <TrustPanel
          title="Protection de l’opération"
          items={[
            'Cette version ne transmet aucun argent réel.',
            'Les métadonnées de preuve restent enregistrées localement.',
            'Le reçu téléchargeable sert uniquement de démonstration.',
          ]}
        />
      </div>

      <Modal open={claimOpen} onClose={() => setClaimOpen(false)} title="Réclamation">
        <div className="grid gap-4">
          <Input
            id="transfer-claim"
            label="Motif de la réclamation"
            value={claimReason}
            onChange={(event) => setClaimReason(event.target.value)}
          />
          <p className="text-xs text-[var(--app-text-muted)]">
            Notre équipe examine chaque réclamation et vous recontacte sous 48h via votre messagerie
            MOXT.
          </p>
          <Button
            disabled={claimReason.trim().length < 5}
            onClick={() => {
              dispatch(
                openDispute({
                  openedBy: user.id,
                  businessId: transfer.businessId,
                  relatedType: 'transfer',
                  relatedId: transfer.id,
                  reason: claimReason,
                }),
              )
              setClaimReason('')
              setClaimOpen(false)
            }}
          >
            Envoyer la réclamation
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        title="Annuler ce transfert ?"
        description="Cette action est définitive. Le transfert sera marqué comme annulé et ne pourra plus être repris."
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          dispatch(cancelTransfer(transfer.id))
          setCancelOpen(false)
        }}
      />
    </div>
  )
}
