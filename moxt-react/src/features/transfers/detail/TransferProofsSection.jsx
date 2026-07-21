import { useState } from 'react'
import { FiCheck, FiDownload, FiFileText } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { useLanguage } from '../../../contexts/useLanguage'
import { addToast } from '../../ui/uiSlice'
import { formatDate } from '../transferUtils'
import { downloadTransferProofFile } from '../transferProofDownload'
import { getReceiptProofEntries, getTransferProofEntries } from '../transferProofUtils'
import { shortenFileName } from '../../../services/uploadProgress'

export function TransferProofsSection({ className = '', compact = false, receipt, transfer }) {
  const { t } = useLanguage()
  const entries = transfer
    ? getTransferProofEntries(transfer)
    : getReceiptProofEntries(receipt, transfer)
  if (!entries.length) return null

  return (
    <div
      className={`${compact ? '' : 'rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/30'} ${className}`}
    >
      {!compact ? (
        <div className="border-b border-[var(--app-border)] px-4 py-3 sm:px-5">
          <p className="text-xs font-black uppercase tracking-wide text-brand-700 dark:text-brand-300">
            {t('transfers.proof.sectionTitle')}
          </p>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {t('transfers.proof.sectionDescription')}
          </p>
        </div>
      ) : null}
      <div className={`grid gap-2 ${compact ? '' : 'p-4 sm:p-5'}`}>
        {entries.map((entry) => (
          <ProofDownloadRow
            key={entry.kind}
            compact={compact}
            entry={entry}
            transfer={transfer}
            transferId={transfer?.id || receipt?.relatedId}
          />
        ))}
      </div>
    </div>
  )
}

function ProofDownloadRow({ compact, entry, transfer, transferId }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [downloading, setDownloading] = useState(false)
  const { proof } = entry
  const label = entry.labelKey ? t(entry.labelKey) : entry.label
  const shortLabel = entry.shortLabelKey ? t(entry.shortLabelKey) : entry.shortLabel

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadTransferProofFile({
        proof,
        path: entry.path,
        transfer,
        transferId,
        kind: entry.kind,
      })
    } catch {
      dispatch(
        addToast({
          title: t('transfers.proof.downloadFailedTitle'),
          message: t('transfers.proof.downloadFailedMessage'),
          tone: 'error',
        }),
      )
    } finally {
      setDownloading(false)
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        className="inline-flex max-w-full items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
        onClick={handleDownload}
        disabled={downloading}
      >
        <FiCheck className="shrink-0" />
        <span className="truncate">{shortLabel}</span>
        <FiDownload className="shrink-0 opacity-70" />
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiFileText />
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-bold">{label}</p>
          <p className="truncate text-xs text-[var(--app-text-muted)]" title={proof.name}>
            {shortenFileName(proof.name, 36)}
          </p>
          {proof.uploadedAt ? (
            <p className="text-[11px] text-[var(--app-text-faint)]">
              {t('transfers.proof.addedOn', { date: formatDate(proof.uploadedAt) })}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        className="shrink-0"
        variant="secondary"
        icon={FiDownload}
        loading={downloading}
        onClick={handleDownload}
      >
        {t('transfers.proof.download')}
      </Button>
    </div>
  )
}
