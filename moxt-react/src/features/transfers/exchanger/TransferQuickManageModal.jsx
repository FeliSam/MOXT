import { useState } from 'react'
import { FiCheck, FiExternalLink, FiUpload } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { FileNameText } from '../../../components/ui/FileNameText'
import { Modal } from '../../../components/ui/Modal'
import { storageService } from '../../../services/storageService'
import {
  canActorPerformBusinessTransferAction,
  canApplyModerateTransfer,
  isClaimOnlyPhase,
} from '../transferActionUtils'
import { TRANSFER_STATUS } from '../transferConfig'
import { TransferStatusBadge } from '../TransferStatusBadge'
import { TransferRecipientAccountCard } from '../TransferRecipientAccountCard'
import {
  directionInfo,
  directionLabel,
  formatMoney,
  getTransferPricing,
} from '../transferUtils'
import { moderateTransfer } from '../transferSlice'
import { addToast } from '../../ui/uiSlice'

export function TransferQuickManageModal({
  open,
  transfer,
  user,
  dispatch,
  onClose,
  t,
}) {
  const [proof, setProof] = useState(null)
  const [uploading, setUploading] = useState(false)

  if (!transfer) return null

  const canAct = canActorPerformBusinessTransferAction(transfer, user?.id, user?.role)
  const claimOnly = isClaimOnlyPhase(transfer)
  const awaitingReception = canAct && !claimOnly && transfer.status === TRANSFER_STATUS.DECLARED
  const awaitingPayout = canAct && !claimOnly && transfer.status === TRANSFER_STATUS.RECEIVED
  const pricing = getTransferPricing(transfer)
  const info = directionInfo(transfer.direction, transfer.originCountry)
  const currencyFrom = transfer.currencyFrom || info.from
  const currencyTo = transfer.currencyTo || info.to
  const note = String(transfer.noteToExchanger || '').trim()

  async function handleProofSelected(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url, path } = await storageService.uploadBusinessTransferProof(
        user.id,
        transfer.id,
        file,
      )
      setProof({
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        path,
        uploadedAt: new Date().toISOString(),
      })
      dispatch(
        addToast({
          title: t('exchanger.manage.proofReadyTitle'),
          message: t('exchanger.manage.proofReadyBody'),
          tone: 'success',
        }),
      )
    } catch {
      setProof(null)
      dispatch(
        addToast({
          title: t('exchanger.manage.uploadFailedTitle'),
          message: t('exchanger.manage.uploadFailedBody'),
          tone: 'error',
        }),
      )
    } finally {
      setUploading(false)
    }
  }

  function confirmReception() {
    if (!canApplyModerateTransfer(transfer, TRANSFER_STATUS.RECEIVED)) {
      dispatch(
        addToast({
          title: t('exchanger.manage.errorTitle'),
          message: t('exchanger.manage.receptionBlocked'),
          tone: 'error',
        }),
      )
      return
    }
    dispatch(
      moderateTransfer({
        id: transfer.id,
        status: TRANSFER_STATUS.RECEIVED,
        actorId: user.id,
        actorRole: user.role,
      }),
    )
    dispatch(
      addToast({
        title: t('exchanger.manage.receptionTitle'),
        message: t('exchanger.manage.receptionBody'),
        tone: 'success',
      }),
    )
    onClose()
  }

  function confirmPayout() {
    const proofPayload = proof || transfer.businessProof || null
    if (!canApplyModerateTransfer(transfer, TRANSFER_STATUS.PAID_OUT, proofPayload)) {
      dispatch(
        addToast({
          title: t('exchanger.manage.errorTitle'),
          message: t('exchanger.manage.proofRequired'),
          tone: 'error',
        }),
      )
      return
    }
    dispatch(
      moderateTransfer({
        id: transfer.id,
        status: TRANSFER_STATUS.PAID_OUT,
        actorId: user.id,
        actorRole: user.role,
        proof: proofPayload,
      }),
    )
    dispatch(
      addToast({
        title: t('exchanger.manage.payoutTitle'),
        message: t('exchanger.manage.payoutBody'),
        tone: 'success',
      }),
    )
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('exchanger.manage.title', { id: transfer.id })} size="large">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TransferStatusBadge status={transfer.status} />
          <span className="text-xs text-[var(--app-text-muted)]">
            {directionLabel(transfer.direction, t)}
          </span>
        </div>

        <div className="grid gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
              {t('exchanger.manage.youReceive')}
            </p>
            <p className="text-lg font-black tabular-nums">
              {formatMoney(pricing.totalToPay, currencyFrom)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
              {t('exchanger.manage.recipientGets')}
            </p>
            <p className="text-lg font-black tabular-nums">
              {transfer.amountReceived
                ? formatMoney(transfer.amountReceived, currencyTo)
                : formatMoney(pricing.amountReceived, currencyTo)}
            </p>
          </div>
          <div className="sm:col-span-2 text-sm text-[var(--app-text-muted)]">
            {transfer.sender?.firstName} {transfer.sender?.lastName} →{' '}
            {transfer.recipient?.firstName} {transfer.recipient?.lastName}
          </div>
        </div>

        {note ? (
          <div className="rounded-xl border border-[var(--app-border)] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
              {t('exchanger.manage.clientNote')}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{note}</p>
          </div>
        ) : null}

        <TransferRecipientAccountCard transfer={transfer} compact />

        {awaitingReception ? (
          <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-800 dark:bg-brand-950/20">
            <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
              {t('exchanger.manage.stepReceptionTitle')}
            </p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {t('exchanger.manage.stepReceptionBody')}
            </p>
            <Button className="mt-3" icon={FiCheck} onClick={confirmReception}>
              {t('exchanger.manage.confirmReception')}
            </Button>
          </div>
        ) : null}

        {awaitingPayout ? (
          <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-800 dark:bg-brand-950/20">
            <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
              {t('exchanger.manage.stepPayoutTitle')}
            </p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {t('exchanger.manage.stepPayoutBody')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm">
                <FiUpload className="shrink-0" />
                {proof ? (
                  <FileNameText name={proof.name} className="font-bold" maxLength={28} />
                ) : uploading ? (
                  <span>{t('exchanger.manage.uploading')}</span>
                ) : (
                  <span>{t('exchanger.manage.proofLabel')}</span>
                )}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*,.pdf"
                  disabled={uploading}
                  onChange={handleProofSelected}
                />
              </label>
              <Button
                icon={FiCheck}
                disabled={!proof && !transfer.businessProof}
                onClick={confirmPayout}
              >
                {t('exchanger.manage.confirmPayout')}
              </Button>
            </div>
          </div>
        ) : null}

        {!awaitingReception && !awaitingPayout ? (
          <p className="text-sm text-[var(--app-text-muted)]">{t('exchanger.manage.noAction')}</p>
        ) : null}

        <Link
          to={`/transfers/${transfer.id}`}
          state={{ transferView: 'business' }}
          className="inline-flex"
        >
          <Button variant="secondary" icon={FiExternalLink}>
            {t('exchanger.manage.openDetail')}
          </Button>
        </Link>
      </div>
    </Modal>
  )
}
