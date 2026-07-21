import { useRef, useState } from 'react'
import { FiImage, FiUpload } from 'react-icons/fi'
import { Modal } from './Modal'
import { Button } from './Button'
import { UploadProgress } from './UploadProgress'
import { FileNameText } from './FileNameText'
import { storageService } from '../../services/storageService'
import { useUploadProgress } from '../../hooks/useUploadProgress'
import { useLanguage } from '../../contexts/useLanguage'

/**
 * Dialogue de signalement : raison obligatoire + capture d’écran optionnelle.
 */
export function ReportDialog({
  open,
  onClose,
  onSubmit,
  title,
  userId,
  submitting = false,
}) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()

  if (!open) return null

  function reset() {
    setReason('')
    setFile(null)
    setPreview('')
    setError('')
    setUploading(false)
  }

  function handleClose() {
    reset()
    onClose?.()
  }

  function onPickFile(event) {
    const next = event.target.files?.[0]
    if (!next) return
    if (!next.type.startsWith('image/')) {
      setError(t('report.errors.imagesOnly'))
      return
    }
    if (next.size > 5 * 1024 * 1024) {
      setError(t('report.errors.imageTooLarge'))
      return
    }
    setError('')
    setFile(next)
    setPreview(URL.createObjectURL(next))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = reason.trim()
    if (trimmed.length < 8) {
      setError(t('report.errors.reasonTooShort'))
      return
    }
    setUploading(true)
    setError('')
    try {
      let evidenceUrl = null
      if (file && userId) {
        evidenceUrl = await trackUpload((onProgress) =>
          storageService.uploadSupportScreenshot(userId, file, { onProgress }),
        )
      }
      await onSubmit({ reason: trimmed, evidenceUrl })
      reset()
      onClose?.()
    } catch (err) {
      setError(err?.message || t('report.errors.submitFailed'))
    } finally {
      setUploading(false)
    }
  }

  const busy = submitting || uploading

  return (
    <Modal open={open} onClose={handleClose} title={title ?? t('report.title')} size="default">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">{t('report.reasonLabel')}</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm outline-none focus:border-[var(--app-teal)]"
            placeholder={t('report.reasonPlaceholder')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-bold">{t('report.screenshotLabel')}</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-w-0 max-w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-6 text-sm font-semibold text-[var(--app-text-muted)] transition hover:border-[var(--app-teal)]"
          >
            <FiUpload className="shrink-0" />
            {file ? (
              <FileNameText name={file.name} className="font-semibold" maxLength={36} />
            ) : (
              t('report.addImage')
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
          {preview ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--app-border)]">
              <img src={preview} alt={t('report.previewAlt')} className="max-h-48 w-full object-contain" />
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-[var(--app-text-faint)]">
              <FiImage /> {t('report.screenshotHint')}
            </p>
          )}
          {uploadProgress.active ||
          uploadProgress.phase === 'done' ||
          uploadProgress.phase === 'error' ? (
            <UploadProgress progress={uploadProgress} compact />
          ) : null}
        </div>

        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={busy} disabled={busy}>
            {t('report.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
