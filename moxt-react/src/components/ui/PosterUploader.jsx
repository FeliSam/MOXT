import { useRef } from 'react'
import { FiImage, FiX } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { UploadProgress } from './UploadProgress'

/**
 * Sélecteur multi-images réutilisable (affiches job / événement, etc.).
 * `photos` : [{ file, url, name }]. Le parent gère l'état + l'upload.
 * `progress` : état de useUploadProgress() pour afficher la barre pendant l'envoi.
 */
export function PosterUploader({
  photos,
  onAdd,
  onRemove,
  max = 5,
  label,
  hint,
  progress = null,
  disabled = false,
}) {
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const resolvedLabel = label ?? t('common.poster.addImages')
  const resolvedHint = hint ?? ''
  const busy = disabled || progress?.active

  function handleFiles(event) {
    if (!event.target.files?.length || busy) return
    const accepted = Array.from(event.target.files).filter(
      (file) =>
        !file.type ||
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i.test(file.name),
    )
    if (accepted.length) onAdd(accepted)
    event.target.value = ''
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold">
        {resolvedLabel}{' '}
        <span className="text-[var(--app-text-faint)]">
          ({photos.length}/{max})
        </span>
      </span>
      <div className="flex flex-wrap gap-2.5">
        {photos.map((photo, index) => (
          <div
            key={photo.url}
            className="relative size-24 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]"
          >
            <img src={photo.url} alt={photo.name || ''} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={busy}
              aria-label={t('common.poster.removeImage')}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/55 text-white transition hover:bg-black/75 disabled:opacity-40"
            >
              <FiX className="text-xs" />
            </button>
            {index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                {t('common.poster.primary')}
              </span>
            ) : null}
          </div>
        ))}
        {photos.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label={t('common.poster.addImages')}
            className="grid size-24 place-items-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiImage className="text-xl" />
          </button>
        ) : null}
      </div>
      {progress?.active || progress?.phase === 'done' || progress?.phase === 'error' ? (
        <UploadProgress progress={progress} compact />
      ) : null}
      {resolvedHint ? <p className="text-xs text-[var(--app-text-muted)]">{resolvedHint}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={busy}
        onChange={handleFiles}
      />
    </div>
  )
}
