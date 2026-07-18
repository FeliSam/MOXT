import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { PosterUploader } from '../../components/ui/PosterUploader'
import { createId } from '../../services/createId'
import { storageService } from '../../services/storageService'
import { addToast } from '../ui/uiSlice'
import { useLanguage } from '../../contexts/useLanguage'
import { createStatus } from './statusesSlice'

/**
 * Composeur de statut — plein écran mobile, centré en modal sur desktop.
 * Réutilise PosterUploader (même sélecteur multi-images que Job/Événement).
 */
export function StatusComposer({ onClose, officialIdentity }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const user = useSelector((s) => s.auth.user)
  const [caption, setCaption] = useState('')
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)

  function addPhotos(files) {
    const added = Array.from(files)
      .slice(0, 4 - photos.length)
      .map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name }))
    setPhotos((p) => [...p, ...added])
  }

  function removePhoto(i) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].url)
      return p.filter((_, idx) => idx !== i)
    })
  }

  async function handlePublish() {
    if (!photos.length || submitting) return
    setSubmitting(true)
    try {
      const statusId = createId('STA')
      const urls = await storageService.uploadStatusImages(
        user.id,
        statusId,
        photos.map((p) => p.file),
      )
      dispatch(
        createStatus({
          id: statusId,
          authorId: user.id,
          authorName: officialIdentity ? officialIdentity.name : `${user.firstName} ${user.lastName}`,
          authorAvatarUrl: officialIdentity
            ? officialIdentity.avatarUrl || null
            : user.avatarUrl || null,
          images: urls,
          caption: caption.trim(),
          isOfficial: officialIdentity ? true : user.role === 'admin' || user.role === 'superadmin',
        }),
      )
      dispatch(
        addToast({
          title: t('status.composer.publishedTitle'),
          message: t('status.composer.publishedMessage'),
          tone: 'success',
        }),
      )
      photos.forEach((p) => URL.revokeObjectURL(p.url))
      onClose()
    } catch (err) {
      dispatch(
        addToast({
          title: t('common.error'),
          message: err?.message || t('common.retryLater'),
          tone: 'error',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="grid w-full max-w-md gap-4 rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card-lg)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight">
              {officialIdentity ? t('status.composer.officialTitle') : t('status.composer.title')}
            </h2>
            <p className="mt-1 text-xs text-[var(--app-text-muted)]">
              {officialIdentity
                ? t('status.composer.officialDescription')
                : t('status.composer.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('status.viewer.close')}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
          >
            <FiX />
          </button>
        </div>

        <PosterUploader
          photos={photos}
          onAdd={addPhotos}
          onRemove={removePhoto}
          max={4}
          label={t('status.composer.title')}
          hint={t('status.composer.imagesRequired')}
        />

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t('status.composer.captionPlaceholder')}
          rows={2}
          className="w-full resize-none rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm outline-none focus:border-[var(--app-accent)]"
        />

        <Button
          onClick={handlePublish}
          loading={submitting}
          disabled={!photos.length || submitting}
        >
          {submitting ? t('status.composer.publishing') : t('status.composer.publish')}
        </Button>
      </div>
    </div>,
    document.body,
  )
}
