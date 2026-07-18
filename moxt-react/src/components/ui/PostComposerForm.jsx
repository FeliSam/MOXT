import { useId, useRef } from 'react'
import { FiImage, FiRefreshCw, FiSend, FiTrash2 } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'

/**
 * Shared create/edit composer for feed posts (message + optional title + image).
 */
export function PostComposerForm({
  user,
  message,
  onMessageChange,
  title,
  onTitleChange,
  showTitle = false,
  imagePreview,
  onSelectFile,
  onRemoveImage,
  onReplaceImage,
  directLink = null,
  maxLength = 500,
  submitLabel,
  submitIcon: SubmitIcon = FiSend,
  onSubmit,
  onCancel,
  cancelLabel,
  submitting = false,
  footerExtra = null,
}) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const messageFieldId = useId()
  const titleFieldId = useId()
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    onSelectFile?.(file)
    e.target.value = ''
  }

  function openFilePicker() {
    fileInputRef.current?.click()
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
            <p className="text-sm font-bold">
              {user.firstName} {user.lastName}
            </p>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt={p3('news.composer.previewAlt')}
              className="h-36 w-full rounded-2xl object-cover"
            />
            <div className="absolute right-2 top-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => (onReplaceImage ? onReplaceImage() : openFilePicker())}
                className="grid size-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                aria-label={p3('news.composer.replaceImage')}
              >
                <FiRefreshCw className="text-xs" />
              </button>
              <button
                type="button"
                onClick={onRemoveImage}
                className="grid size-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                aria-label={p3('news.composer.removeImage')}
              >
                <FiTrash2 className="text-xs" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--app-border)] px-4 py-5 text-sm font-medium text-[var(--app-text-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
          >
            <FiImage className="text-base" /> {p3('news.composer.addImage')}
          </button>
        )}
      </div>

      {directLink ? (
        <p className="truncate text-xs text-[var(--app-text-faint)]">
          {p3('news.composer.link', { link: directLink })}
        </p>
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
