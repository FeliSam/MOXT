import { FiClock, FiRepeat, FiShield, FiUser } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { BackButton } from '../components/ui/BackButton'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
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
import { TransferWorkflowPanel } from '../features/transfers/detail/TransferWorkflowPanel'
import { TransferProofsSection } from '../features/transfers/detail/TransferProofsSection'
import { TransferDetailAdminPanel } from '../features/transfers/detail/TransferDetailAdminPanel'
import { TransferDetailFinancialCard } from '../features/transfers/detail/TransferDetailFinancialCard'
import { TransferDetailHeroCard } from '../features/transfers/detail/TransferDetailHeroCard'
import { TransferDetailNotFound } from '../features/transfers/detail/TransferDetailNotFound'
import { TransferDetailParticipantsSection } from '../features/transfers/detail/TransferDetailParticipantsSection'
import { TransferDetailTimelineCard } from '../features/transfers/detail/TransferDetailTimelineCard'
import { TransferReceivingAccountCard } from '../features/transfers/TransferReceivingAccountCard'
import { TRANSFER_STATUS } from '../features/transfers/transferConfig'
import {
  getTransferDetailAccess,
  transferTimelineLabels,
} from '../features/transfers/detail/transferDetailConfig'
import {
  resolveTransferActionView,
} from '../features/transfers/detail/transferDetailRoleLogic'
import { useTransferDetail } from '../features/transfers/detail/useTransferDetail'
import { selectOwnedBusinessIds } from '../features/transfers/transferSelectors'
import { canApplyModerateTransfer } from '../features/transfers/transferActionUtils'
import { printReceipt } from '../features/transfers/receiptExport'
import { cancelTransfer, declarePayment, moderateTransfer } from '../features/transfers/transferSlice'
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
  const [businessProof, setBusinessProof] = useState(null)
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimReason, setClaimReason] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [detailTab, setDetailTab] = useState('suivi')
  const dispatch = useDispatch()
  const location = useLocation()
  const { transferId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const ownedBusinessIds = useSelector((state) => selectOwnedBusinessIds(state, user?.id))
  const { business, transfer } = useTransferDetail(transferId, user)
  const countdown = usePaymentCountdown(transfer?.paymentDeadlineAt)

  if (!transfer) {
    return <TransferDetailNotFound />
  }

  const pricing = getTransferPricing(transfer)
  const currFrom = transfer.currencyFrom || 'XOF'
  const currTo = transfer.currencyTo || 'RUB'
  const access = getTransferDetailAccess(transfer, user, business, ownedBusinessIds)
  const actionView = resolveTransferActionView(access, location.state || {}, transfer)
  const receivingAccount = transfer.exchanger?.paymentDetails || null
  const originCountry = transfer.originCountry || user.originCountry || 'BJ'

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
      const { url, path } = await storageService.uploadTransferProof(user.id, transfer.id, file)
      setProof({ file, url, path, uploading: false })
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

  async function handleBusinessProofSelected(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusinessProof({ file, uploading: true })
    try {
      const { url, path } = await storageService.uploadBusinessTransferProof(
        user.id,
        transfer.id,
        file,
      )
      setBusinessProof({ file, url, path, uploading: false })
      dispatch(
        addToast({
          title: 'Preuve ajoutée',
          message: 'Le justificatif de virement est prêt.',
          tone: 'success',
        }),
      )
    } catch {
      setBusinessProof(null)
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
              relatedEntity={transfer}
              relatedId={transfer.id}
              relatedPath={`/transfers/${transfer.id}`}
              relatedTitle={`Transfert ${transfer.id} · ${access.contactTitle}`}
              relatedType="transfer"
              variant="secondary"
            />
            <BackButton
              fallback={access.isBusinessViewer ? '/professional' : '/transfers/history'}
            />
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

      <CatalogArchiveTabs
        active={detailTab}
        onChange={setDetailTab}
        variant="section"
        tabs={[
          { key: 'suivi', label: 'Suivi' },
          { key: 'paiement', label: 'Paiement' },
          { key: 'details', label: 'Détails' },
        ]}
      />

      {detailTab === 'suivi' ? (
        <>
          {![TRANSFER_STATUS.CANCELLED, TRANSFER_STATUS.EXPIRED].includes(transfer.status) ? (
            <TransferWorkflowPanel
              access={access}
              actionView={actionView}
              businessProof={businessProof}
              canCancel={access.canCancel}
              countdown={countdown}
              proof={proof}
              transfer={transfer}
              onProofSelected={handleProofSelected}
              onBusinessProofSelected={handleBusinessProofSelected}
              onDeclarePayment={() => {
                if (!access.canDeclare) return
                dispatch(
                  declarePayment({
                    id: transfer.id,
                    proof: {
                      name: proof.file.name,
                      size: proof.file.size,
                      type: proof.file.type,
                      url: proof.url,
                      path: proof.path,
                      uploadedAt: new Date().toISOString(),
                    },
                  }),
                )
                dispatch(
                  addToast({
                    title: 'Paiement déclaré',
                    message: 'L’entreprise va vérifier la réception de votre paiement.',
                    tone: 'success',
                  }),
                )
              }}
              onCompleteBusinessStep={(nextStatus) => {
                if (!access.isBusinessViewer) return

                const proofPayload = businessProof
                  ? {
                      name: businessProof.name || businessProof.file?.name,
                      size: businessProof.size || businessProof.file?.size,
                      type: businessProof.type || businessProof.file?.type,
                      url: businessProof.url,
                      path: businessProof.path,
                      uploadedAt: new Date().toISOString(),
                    }
                  : transfer.businessProof

                if (nextStatus === TRANSFER_STATUS.RECEIVED && !access.canConfirmPaymentReception) {
                  return
                }
                if (nextStatus === TRANSFER_STATUS.PAID_OUT && !access.canConfirmPayout) {
                  return
                }

                if (!canApplyModerateTransfer(transfer, nextStatus, proofPayload)) {
                  dispatch(
                    addToast({
                      title: 'Action impossible',
                      message:
                        nextStatus === TRANSFER_STATUS.RECEIVED
                          ? 'La réception du paiement a déjà été confirmée ou le statut a changé.'
                          : 'Ajoutez une preuve de virement avant de confirmer le transfert.',
                      tone: 'error',
                    }),
                  )
                  return
                }

                dispatch(
                  moderateTransfer({
                    id: transfer.id,
                    status: nextStatus,
                    actorId: user.id,
                    proof: proofPayload,
                  }),
                )

                dispatch(
                  addToast({
                    title:
                      nextStatus === TRANSFER_STATUS.RECEIVED
                        ? 'Réception confirmée'
                        : 'Transfert confirmé',
                    message:
                      nextStatus === TRANSFER_STATUS.RECEIVED
                        ? 'Passez à l’étape suivante : preuve et confirmation du virement.'
                        : 'Le client peut déclarer la réception des fonds.',
                    tone: 'success',
                  }),
                )

                if (nextStatus === TRANSFER_STATUS.RECEIVED) {
                  setBusinessProof(null)
                }
              }}
              onCancel={() => setCancelOpen(true)}
              onOpenClaim={() => setClaimOpen(true)}
            />
          ) : (
            <>
              <Card className="p-5 text-sm text-[var(--app-text-muted)]">
                Ce transfert est {transfer.status === TRANSFER_STATUS.CANCELLED ? 'annulé' : 'expiré'}.
                Aucune action n’est possible.
              </Card>
              <TransferProofsSection transfer={transfer} />
            </>
          )}
          {access.isAdminViewer ? <TransferDetailAdminPanel transfer={transfer} /> : null}
        </>
      ) : null}

      {detailTab === 'paiement' ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <TransferReceivingAccountCard
            account={receivingAccount}
            direction={transfer.direction}
            originCountry={originCountry}
            onCopy={(value) => copyValue(value, 'Les coordonnées')}
          />
          <TransferDetailFinancialCard
            transfer={transfer}
            onCopyReference={() => copyValue(transfer.id, 'La référence')}
            onDownloadReceipt={downloadReceipt}
          />
        </div>
      ) : null}

      {detailTab === 'details' ? (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <TransferDetailFinancialCard
              transfer={transfer}
              onCopyReference={() => copyValue(transfer.id, 'La référence')}
              onDownloadReceipt={downloadReceipt}
            />
            <TransferDetailParticipantsSection transfer={transfer} />
            <TransferDetailTimelineCard transfer={transfer} />
            <TransferProofsSection transfer={transfer} />
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
                    value: formatMoney(
                      transfer.amountReceived ?? pricing.amountSent * (transfer.rate || 1),
                      currTo,
                    ),
                  },
                  {
                    label: 'Total à payer',
                    value: formatMoney(pricing.totalToPay, currFrom),
                  },
                  { label: 'Mode', value: 'Transfert assisté MOXT' },
                ]}
              />
            </DetailSection>
            <TrustPanel
              title="Protection de l’opération"
              items={[
                'Vérifiez l’identité de l’échangeur et les coordonnées de paiement.',
                'Conservez vos preuves de paiement dans MOXT.',
                'Le reçu téléchargeable fait foi pour le suivi de l’opération.',
              ]}
            />
          </div>
        </>
      ) : null}

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
