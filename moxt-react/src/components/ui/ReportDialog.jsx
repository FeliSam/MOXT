import { useRef, useState } from 'react'
import { FiImage, FiUpload } from 'react-icons/fi'
import { Modal } from './Modal'
import { Button } from './Button'
import { storageService } from '../../services/storageService'

/**
 * Dialogue de signalement : raison obligatoire + capture d’écran optionnelle.
 */
export function ReportDialog({
  open,
  onClose,
  onSubmit,
  title = 'Signaler',
  userId,
  submitting = false,
}) {
  const [reason, setReason] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

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
      setError('Seules les images (captures d’écran) sont acceptées.')
      return
    }
    if (next.size > 5 * 1024 * 1024) {
      setError('L’image ne doit pas dépasser 5 Mo.')
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
      setError('Expliquez la raison (au moins 8 caractères).')
      return
    }
    setUploading(true)
    setError('')
    try {
      let evidenceUrl = null
      if (file && userId) {
        evidenceUrl = await storageService.uploadSupportScreenshot(userId, file)
      }
      await onSubmit({ reason: trimmed, evidenceUrl })
      reset()
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Impossible d’envoyer le signalement.')
    } finally {
      setUploading(false)
    }
  }

  const busy = submitting || uploading

  return (
    <Modal open={open} onClose={handleClose} title={title} size="default">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-sm font-bold">Raison du signalement</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm outline-none focus:border-[var(--app-teal)]"
            placeholder="Décrivez le problème (contenu trompeur, spam, harcèlement…)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-bold">Capture d’écran (optionnel)</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-6 text-sm font-semibold text-[var(--app-text-muted)] transition hover:border-[var(--app-teal)]"
          >
            <FiUpload />
            {file ? file.name : 'Ajouter une image'}
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
              <img src={preview} alt="Aperçu du signalement" className="max-h-48 w-full object-contain" />
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-[var(--app-text-faint)]">
              <FiImage /> Une capture aide l’équipe à traiter plus vite.
            </p>
          )}
        </div>

        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="submit" loading={busy} disabled={busy}>
            Envoyer le signalement
          </Button>
        </div>
      </form>
    </Modal>
  )
}
