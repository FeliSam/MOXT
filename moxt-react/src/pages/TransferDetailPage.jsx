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
  transferTimelineLabelKeys,
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
import { useLanguage } from '../contexts/useLanguage'
import { storageService } from '../services/storageService'

export function TransferDetailPage() {
  const { t } = useLanguage()
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
        title: t('transfers.detail.receiptTitle', { id: transfer.id }),
        amount: pricing.totalToPay,
        currency: transfer.currencyFrom,
        status: transfer.status,
        details: { exchanger: transfer.exchanger?.name },
      }),
    )
    printReceipt(transfer, t)
  }

  function copyValue(value, label) {
    if (!value) return
    navigator.clipboard?.writeText(value)
    dispatch(
      addToast({
        title: t('transfers.detail.copiedTitle'),
        message: t('transfers.detail.copiedMessage', { label }),
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
          title: t('transfers.detail.proofAddedTitle'),
          message: t('transfers.detail.paymentProofReady'),
          tone: 'success',
        }),
      )
    } catch {
      setProof(null)
      dispatch(
        addToast({
          title: t('transfers.detail.uploadFailedTitle'),
          message: t('transfers.detail.uploadFailedMessage'),
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
          title: t('transfers.detail.proofAddedTitle'),
          message: t('transfers.detail.payoutProofReady'),
          tone: 'success',
        }),
      )
    } catch {
      setBusinessProof(null)
      dispatch(
        addToast({
          title: t('transfers.detail.uploadFailedTitle'),
          message: t('transfers.detail.uploadFailedMessage'),
          tone: 'error',
        }),
      )
    }
  }

  return (
    <div className="finance-hero-glow grid gap-7 rounded-[var(--radius-card-lg)]">
      <PageHeader
        title={t('transfers.detail.title')}
        actions={
          <div className="flex flex-wrap gap-2">
            <ContactButton
              ownerId={access.contactId}
              relatedEntity={transfer}
              relatedId={transfer.id}
              relatedPath={`/transfers/${transfer.id}`}
              relatedTitle={t('transfers.detail.relatedTitle', { id: transfer.id, contact: access.contactTitle })}
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
          { icon: FiRepeat, label: t('transfers.detail.metrics.direction'), value: directionLabel(transfer.direction, t) },
          { icon: FiClock, label: t('transfers.detail.metrics.created'), value: formatDate(transfer.createdAt) },
          {
            icon: FiUser,
            label: t('transfers.detail.metrics.recipient'),
            value: `${transfer.recipient.firstName} ${transfer.recipient.lastName}`,
          },
          {
            icon: FiShield,
            label: t('transfers.detail.metrics.partner'),
            value: transfer.exchanger?.name || t('transfers.detail.financial.historicPartner'),
          },
        ]}
      />

      <TransferDetailHeroCard transfer={transfer} />

      <CatalogArchiveTabs
        active={detailTab}
        onChange={setDetailTab}
        variant="section"
        tabs={[
          { key: 'suivi', label: t('transfers.detail.tabs.tracking') },
          { key: 'paiement', label: t('transfers.detail.tabs.payment') },
          { key: 'details', label: t('transfers.detail.tabs.details') },
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
                    actorId: user.id,
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
                    title: t('transfers.detail.toasts.paymentDeclaredTitle'),
                    message: t('transfers.detail.toasts.paymentDeclaredMessage'),
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
                      title: t('transfers.detail.toasts.actionImpossibleTitle'),
                      message:
                        nextStatus === TRANSFER_STATUS.RECEIVED
                          ? t('transfers.detail.toasts.receptionAlreadyConfirmed')
                          : t('transfers.detail.toasts.addPayoutProof'),
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
                    actorRole: user.role,
                    proof: proofPayload,
                  }),
                )

                dispatch(
                  addToast({
                    title:
                      nextStatus === TRANSFER_STATUS.RECEIVED
                        ? t('transfers.detail.toasts.receptionConfirmedTitle')
                        : t('transfers.detail.toasts.transferConfirmedTitle'),
                    message:
                      nextStatus === TRANSFER_STATUS.RECEIVED
                        ? t('transfers.detail.toasts.receptionConfirmedMessage')
                        : t('transfers.detail.toasts.transferConfirmedMessage'),
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
                {t('transfers.detail.closedNotice', { status: transfer.status === TRANSFER_STATUS.CANCELLED ? t('transfers.status.cancelled').toLowerCase() : t('transfers.status.expired').toLowerCase() })}
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
            onCopy={(value) => copyValue(value, t('transfers.detail.copy.coordinates'))}
          />
          <TransferDetailFinancialCard
            transfer={transfer}
            onCopyReference={() => copyValue(transfer.id, t('transfers.detail.copy.reference'))}
            onDownloadReceipt={downloadReceipt}
          />
        </div>
      ) : null}

      {detailTab === 'details' ? (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <TransferDetailFinancialCard
              transfer={transfer}
              onCopyReference={() => copyValue(transfer.id, t('transfers.detail.copy.reference'))}
              onDownloadReceipt={downloadReceipt}
            />
            <TransferDetailParticipantsSection transfer={transfer} />
            <TransferDetailTimelineCard transfer={transfer} />
            <TransferProofsSection transfer={transfer} />
          </div>
          <div className="grid gap-5">
            <DetailSection title={t('transfers.detail.info.title')}>
              <DetailFacts
                items={[
                  { label: t('transfers.detail.info.reference'), value: transfer.id },
                  {
                    label: t('transfers.detail.info.status'),
                    value: transferTimelineLabelKeys[transfer.status]
                      ? t(transferTimelineLabelKeys[transfer.status])
                      : transferTimelineLabels[transfer.status] || transfer.status,
                  },
                  {
                    label: t('transfers.detail.info.amountSent'),
                    value: formatMoney(pricing.amountSent, currFrom),
                  },
                  {
                    label: t('transfers.detail.info.amountReceivedEstimated'),
                    value: formatMoney(
                      transfer.amountReceived ?? pricing.amountSent * (transfer.rate || 1),
                      currTo,
                    ),
                  },
                  {
                    label: t('transfers.detail.info.totalToPay'),
                    value: formatMoney(pricing.totalToPay, currFrom),
                  },
                  { label: t('transfers.detail.info.mode'), value: t('transfers.detail.info.modeValue') },
                ]}
              />
            </DetailSection>
          </div>
        </>
      ) : null}

      <Modal open={claimOpen} onClose={() => setClaimOpen(false)} title={t('transfers.detail.claim.title')}>
        <div className="grid gap-4">
          <Input
            id="transfer-claim"
            label={t('transfers.detail.claim.reason')}
            value={claimReason}
            onChange={(event) => setClaimReason(event.target.value)}
          />
          <p className="text-xs text-[var(--app-text-muted)]">
            {t('transfers.detail.claim.help')}
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
            {t('transfers.detail.claim.submit')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        title={t('transfers.detail.cancel.title')}
        description={t('transfers.detail.cancel.description')}
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          dispatch(cancelTransfer({ id: transfer.id, actorId: user.id }))
          setCancelOpen(false)
        }}
      />
    </div>
  )
}
