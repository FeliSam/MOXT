import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiPlus, FiX } from 'react-icons/fi'
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
import { DEFAULT_QUOTA_CONFIG, statusExpiresAt } from '../stars/starsConfig'
import { StarsInsufficientError, starsOwnerFromPublish } from '../stars/starsPublish'
import { StarsPublishGate } from '../stars/StarsPublishGate'
import { StatusDurationSheet } from '../stars/StatusDurationSheet'
import { useStarsPublishFlow } from '../stars/useStarsPublishFlow'

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
  const [durationKey, setDurationKey] = useState('24h')
  const { pendingQuote, confirmPaid, acceptSpend, cancelSpend, withStarsConsume, starsEnabled } =
    useStarsPublishFlow()
  const starsBalance = useSelector((s) => s.stars.balance)
  const [dialogEl, setDialogEl] = useState(null)
  const titleId = useId()
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()
  const canPostAsBusiness = Boolean(ownBusiness) && !officialIdentity
  const postingAsBusiness = canPostAsBusiness && postAs === 'business'

  useEffect(() => {
    dialogEl?.focus()
  }, [dialogEl])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
      const owner = starsOwnerFromPublish({
        useBusiness: postingAsBusiness,
        business: ownBusiness,
        user,
      })
      const outcome = await withStarsConsume({
        category: 'status',
        ...owner,
        entityId: statusId,
        durationKey: starsEnabled && starsBalance?.enforced ? durationKey : null,
        confirmPaid,
        publish: async () => {
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
              expiresAt:
                starsEnabled && starsBalance?.enforced
                  ? statusExpiresAt(durationKey, new Date(), starsBalance?.config || DEFAULT_QUOTA_CONFIG)
                  : undefined,
            }),
          )
        },
      })
      if (outcome?.cancelled) return
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
          title: err instanceof StarsInsufficientError ? t('stars.insufficientTitle') : t('common.error'),
          message:
            err instanceof StarsInsufficientError
              ? t('stars.insufficientBody')
              : err?.message || t('common.retryLater'),
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
        ref={setDialogEl}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="scrollbar-hidden max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[var(--app-surface)] shadow-2xl outline-none"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiPlus className="text-sm" />
            </span>
            <div>
              <h2 id={titleId} className="text-sm font-black">
                {officialIdentity ? t('status.composer.officialTitle') : t('status.composer.title')}
              </h2>
              <p className="text-xs text-[var(--app-text-muted)]">
                {officialIdentity
                  ? t('status.composer.officialDescription')
                  : t('status.composer.description')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('status.viewer.close')}
            className="grid size-8 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
          >
            <FiX />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          {canPostAsBusiness ? (
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[var(--app-surface-muted)] p-1">
              <button
                type="button"
                onClick={() => setPostAs('personal')}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  postAs === 'personal'
                    ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm'
                    : 'text-[var(--app-text-muted)]'
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
                    ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm'
                    : 'text-[var(--app-text-muted)]'
                }`}
              >
                <HiOutlineBuildingOffice2 className="shrink-0" />
                <span className="truncate">{ownBusiness.name}</span>
              </button>
            </div>
          ) : null}

          {starsEnabled ? (
            <div className="flex flex-wrap items-center gap-2">
              <StarsPublishGate
                category="status"
                ownerType={postingAsBusiness ? 'business' : 'user'}
                ownerId={postingAsBusiness ? ownBusiness?.id : user?.id}
                pendingQuote={pendingQuote}
                onCancel={cancelSpend}
                onConfirm={acceptSpend}
              />
            </div>
          ) : null}
          {starsEnabled ? (
            <StatusDurationSheet
              value={durationKey}
              onChange={setDurationKey}
              enforced={Boolean(starsBalance?.enforced)}
              config={starsBalance?.config || DEFAULT_QUOTA_CONFIG}
            />
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
            className="w-full resize-none rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-faint)] focus:border-[var(--app-accent)]"
          />

          <Button
            onClick={handlePublish}
            loading={submitting}
            disabled={(!photos.length && !caption.trim()) || submitting}
          >
            {submitting ? t('status.composer.publishing') : t('status.composer.publish')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
