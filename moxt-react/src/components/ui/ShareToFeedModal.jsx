import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiShare2, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { MAX_POST_IMAGES, normalizePostImages } from '../../features/posts/postMediaUtils'
import { createPost } from '../../features/posts/postsSlice'
import {
  generatePostMessage,
  getSourceImage,
  SOURCE_TYPE_LABELS,
  SOURCE_TYPE_LINKS,
} from '../../features/posts/postTemplates'
import { useSecurityGate } from '../../features/security/useSecurityGate'
import { addToast } from '../../features/ui/uiSlice'
import { initialCatalogStatus } from '@moxt/shared/auth/userSecurity.js'
import { storageService } from '../../services/storageService'
import { phase3Text } from '../../i18n/phase3I18n'
import { createId } from '../../services/createId'
import { PostComposerForm } from './PostComposerForm'

/**
 * Modal de partage vers le fil d'actualité (jusqu'à 4 images).
 */
export function ShareToFeedModal({
  sourceType = 'free',
  sourceId = null,
  sourceData = {},
  onClose,
  onPublished,
}) {
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)
  const { language, t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const { requirePublish } = useSecurityGate()
  const titleId = useId()

  const defaultMessage = generatePostMessage(sourceType, sourceData, user?.firstName)
  const defaultImage = getSourceImage(sourceType, sourceData)
  const directLink = sourceId ? SOURCE_TYPE_LINKS[sourceType]?.(sourceId) : '/news'

  const [message, setMessage] = useState(defaultMessage)
  /** @type {Array<{ preview: string, file: File|null, remoteUrl: string|null }>} */
  const [imageItems, setImageItems] = useState(() =>
    defaultImage ? [{ preview: defaultImage, file: null, remoteUrl: defaultImage }] : [],
  )
  const [submitting, setSubmitting] = useState(false)
  const [dialogEl, setDialogEl] = useState(null)

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

  function handleAddFiles(files) {
    const remaining = MAX_POST_IMAGES - imageItems.length
    if (remaining <= 0) return
    const nextFiles = Array.from(files || []).slice(0, remaining)
    nextFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImageItems((current) => {
          if (current.length >= MAX_POST_IMAGES) return current
          return [...current, { preview: ev.target.result, file, remoteUrl: null }]
        })
      }
      reader.readAsDataURL(file)
    })
  }

  function removeImageAt(index) {
    setImageItems((current) => current.filter((_, i) => i !== index))
  }

  async function handlePublish() {
    if (!message.trim() || submitting) return
    if (!requirePublish()) return
    setSubmitting(true)
    try {
      const postId = createId('POST')
      const filesToUpload = imageItems.map((item) => item.file).filter(Boolean)
      let uploaded = []
      if (filesToUpload.length && user?.id) {
        uploaded = await storageService.uploadPostImages(user.id, postId, filesToUpload)
      }
      let uploadIndex = 0
      const urls = imageItems.map((item) => {
        if (item.file) {
          const url = uploaded[uploadIndex]
          uploadIndex += 1
          return url
        }
        return item.remoteUrl || (String(item.preview || '').startsWith('http') ? item.preview : null)
      }).filter(Boolean)

      const media = normalizePostImages(urls)
      const status = initialCatalogStatus(user, { live: 'published', pending: 'pending_review' })
      dispatch(
        createPost({
          id: postId,
          authorId: user.id,
          authorName: `${user.firstName} ${user.lastName}`,
          authorAvatarUrl: user.avatarUrl || null,
          sourceType,
          sourceId,
          message: message.trim(),
          ...media,
          directLink,
          language,
          status,
        }),
      )
      const live = status === 'published'
      dispatch(
        addToast({
          title: live ? p3('news.composer.publishedTitle') : p3('news.composer.sentTitle'),
          message: live ? p3('news.composer.publishedMessage') : p3('news.composer.pendingMessage'),
          tone: 'success',
        }),
      )
      onPublished?.()
      onClose()
    } catch (err) {
      dispatch(
        addToast({
          title: p3('common.error'),
          message: err?.message || p3('common.retryLater'),
          tone: 'error',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabel = SOURCE_TYPE_LABELS[sourceType] || p3('news.types.post')

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
              <FiShare2 className="text-sm" />
            </span>
            <div>
              <h2 id={titleId} className="text-sm font-black">
                {p3('news.composer.title')}
              </h2>
              <p className="text-xs text-[var(--app-text-muted)]">
                {p3('news.composer.visibility', { type: typeLabel })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={p3('news.composer.close')}
            className="grid size-8 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
          >
            <FiX />
          </button>
        </div>

        <div className="p-5">
          <PostComposerForm
            user={user}
            message={message}
            onMessageChange={setMessage}
            imagePreviews={imageItems.map((item) => item.preview)}
            onAddFiles={handleAddFiles}
            onRemoveImageAt={removeImageAt}
            directLink={directLink}
            submitLabel={p3('news.composer.publish')}
            onSubmit={handlePublish}
            onCancel={onClose}
            submitting={submitting}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
