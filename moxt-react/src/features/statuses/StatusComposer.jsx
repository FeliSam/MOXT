import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'
import { HiOutlineBuildingOffice2, HiOutlineUser } from 'react-icons/hi2'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { PosterUploader } from '../../components/ui/PosterUploader'
import { createId } from '../../services/createId'
import { storageService } from '../../services/storageService'
import { useUploadProgress } from '../../hooks/useUploadProgress'
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
  const ownBusiness = useSelector((s) =>
    (s.businesses?.items ?? []).find((item) => item.ownerId === user.id),
  )
  const [caption, setCaption] = useState('')
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [postAs, setPostAs] = useState('personal')
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()
  const canPostAsBusiness = Boolean(ownBusiness) && !officialIdentity
  const postingAsBusiness = canPostAsBusiness && postAs === 'business'

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
    if (submitting) return
    const trimmed = caption.trim()
    if (!photos.length && !trimmed) return
    setSubmitting(true)
    try {
      const statusId = createId('STA')
      const urls = photos.length
        ? await trackUpload((onProgress) =>
            storageService.uploadStatusImages(
              user.id,
              statusId,
              photos.map((p) => p.file),
              { onProgress },
            ),
          )
        : []
      dispatch(
        createStatus({
          id: statusId,
          authorId: user.id,
          authorName: officialIdentity
            ? officialIdentity.name
            : postingAsBusiness
              ? ownBusiness.name
              : `${user.firstName} ${user.lastName}`,
          authorAvatarUrl: officialIdentity
            ? officialIdentity.avatarUrl || null
            : postingAsBusiness
              ? ownBusiness.logoUrl || null
              : user.avatarUrl || null,
          businessId: postingAsBusiness ? ownBusiness.id : null,
          images: urls,
          caption: trimmed,
          isOfficial: Boolean(officialIdentity),
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
      className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="grid max-h-[100dvh] w-full max-w-md gap-4 overflow-y-auto rounded-none border-0 bg-slate-950 p-5 text-white shadow-[var(--shadow-card-lg)] sm:max-h-[90dvh] sm:rounded-[var(--radius-card-lg)] sm:border sm:border-white/10 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-white">
              {officialIdentity ? t('status.composer.officialTitle') : t('status.composer.title')}
            </h2>
            <p className="mt-1 text-xs text-white/60">
              {officialIdentity
                ? t('status.composer.officialDescription')
                : t('status.composer.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('status.viewer.close')}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-white/70 transition hover:bg-white/10"
          >
            <FiX />
          </button>
        </div>

        {canPostAsBusiness ? (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setPostAs('personal')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                postAs === 'personal'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/55'
              }`}
            >
              <HiOutlineUser className="shrink-0" />
              <span className="truncate">{t('status.composer.postAsPersonal')}</span>
            </button>
            <button
              type="button"
              onClick={() => setPostAs('business')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                postAs === 'business'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/55'
              }`}
            >
              <HiOutlineBuildingOffice2 className="shrink-0" />
              <span className="truncate">{ownBusiness.name}</span>
            </button>
          </div>
        ) : null}

        <PosterUploader
          photos={photos}
          onAdd={addPhotos}
          onRemove={removePhoto}
          max={4}
          label={t('status.composer.title')}
          hint={t('status.composer.imagesOrText')}
          progress={uploadProgress}
        />

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t('status.composer.captionPlaceholder')}
          rows={3}
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand-400"
        />

        <Button
          onClick={handlePublish}
          loading={submitting}
          disabled={(!photos.length && !caption.trim()) || submitting}
        >
          {submitting ? t('status.composer.publishing') : t('status.composer.publish')}
        </Button>
      </div>
    </div>,
    document.body,
  )
}
