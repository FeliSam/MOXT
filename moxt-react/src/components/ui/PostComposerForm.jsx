import { useId, useRef } from 'react'
import { FiImage, FiPlus, FiSend, FiTrash2 } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { MAX_POST_IMAGES } from '../../features/posts/postMediaUtils'
import { isProfileVerified } from '../../features/profile/userProfileUtils'
import { phase3Text } from '../../i18n/phase3I18n'
import { EntityVerifiedName } from './EntityVerifiedName'
import { UploadProgress } from './UploadProgress'

/**
 * Shared create/edit composer for feed posts (message + up to 4 images).
 *
 * imagePreviews: string[] of object URLs / remote URLs / data URLs
 */
export function PostComposerForm({
  user,
  message,
  onMessageChange,
  title,
  onTitleChange,
  showTitle = false,
  imagePreviews = [],
  onAddFiles,
  onRemoveImageAt,
  /** @deprecated use imagePreviews + onAddFiles */
  imagePreview,
  /** @deprecated */
  onSelectFile,
  /** @deprecated */
  onRemoveImage,
  directLink = null,
  maxLength = 500,
  maxImages = MAX_POST_IMAGES,
  submitLabel,
  submitIcon: SubmitIcon = FiSend,
  onSubmit,
  onCancel,
  cancelLabel,
  submitting = false,
  footerExtra = null,
  progress = null,
}) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const messageFieldId = useId()
  const titleFieldId = useId()
  const fileInputRef = useRef(null)

  const previews =
    Array.isArray(imagePreviews) && imagePreviews.length
      ? imagePreviews
      : imagePreview
        ? [imagePreview]
        : []
  const canAddMore = previews.length < maxImages

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/'))
    if (!files.length) return
    if (onAddFiles) onAddFiles(files)
    else if (onSelectFile) onSelectFile(files[0])
    e.target.value = ''
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleRemove(index) {
    if (onRemoveImageAt) onRemoveImageAt(index)
    else if (index === 0) onRemoveImage?.()
  }

  return (
    <div className="grid gap-4">
      {user ? (
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
          ) : (
            <span className="grid size-9 place-items-center whitespace-nowrap rounded-full bg-brand-600 text-sm font-black text-white">
              {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
            </span>
          )}
          <div>
            <EntityVerifiedName
              as="p"
              name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
              userId={user.id}
              verified={isProfileVerified(user)}
              className="text-sm font-bold"
            />
            <p className="text-xs text-[var(--app-text-muted)]">{p3('news.composer.feedName')}</p>
          </div>
        </div>
      ) : null}

      {showTitle ? (
        <label htmlFor={titleFieldId} className="grid gap-1.5">
          <span className="text-sm font-bold">{p3('news.edit.titleLabel')}</span>
          <input
            id={titleFieldId}
            type="text"
            className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3.5 py-3 text-sm outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]"
            placeholder={p3('news.edit.titlePlaceholder')}
            value={title || ''}
            onChange={(e) => onTitleChange?.(e.target.value)}
            maxLength={120}
          />
        </label>
      ) : null}

      <label htmlFor={messageFieldId} className="grid gap-1.5">
        <span className={showTitle ? 'text-sm font-bold' : 'sr-only'}>
          {showTitle ? p3('news.edit.content') : p3('news.composer.messageLabel')}
        </span>
        <textarea
          id={messageFieldId}
          className="min-h-28 w-full resize-none rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm leading-relaxed outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]"
          placeholder={p3('news.composer.messagePlaceholder')}
          value={message}
          onChange={(e) => onMessageChange?.(e.target.value)}
          maxLength={maxLength}
          required
        />
      </label>
      <p className="text-right text-xs text-[var(--app-text-faint)]">
        {message.length}/{maxLength}
      </p>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--app-text-muted)]">
            {p3('news.composer.imagesHint', { count: previews.length, max: maxImages })}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {previews.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {previews.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--app-surface-muted)]"
              >
                <img
                  src={src}
                  alt={p3('news.composer.previewAltIndexed', { index: index + 1 })}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  aria-label={p3('news.composer.removeImageIndexed', { index: index + 1 })}
                >
                  <FiTrash2 className="text-xs" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {index + 1}/{previews.length}
                </span>
              </div>
            ))}
            {canAddMore ? (
              <button
                type="button"
                onClick={openFilePicker}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[var(--app-border)] text-sm font-medium text-[var(--app-text-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
              >
                <FiPlus className="text-lg" />
                <span className="text-xs">{p3('news.composer.addAnother')}</span>
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--app-border)] px-4 py-5 text-sm font-medium text-[var(--app-text-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
          >
            <FiImage className="text-base" /> {p3('news.composer.addImages')}
          </button>
        )}
      </div>

      {directLink ? (
        <p className="truncate text-xs text-[var(--app-text-faint)]">
          {p3('news.composer.link', { link: directLink })}
        </p>
      ) : null}

      {progress?.active || progress?.phase === 'done' || progress?.phase === 'error' ? (
        <UploadProgress progress={progress} compact />
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-[var(--app-border)] pt-4">
        {footerExtra}
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-bold text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
          >
            {cancelLabel || p3('common.cancel')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!message.trim() || submitting}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          <SubmitIcon className="text-xs" /> {submitLabel}
        </button>
      </div>
    </div>
  )
}
