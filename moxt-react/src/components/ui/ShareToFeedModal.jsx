import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiImage, FiSend, FiShare2, FiTrash2, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { createPost } from '../../features/posts/postsSlice'
import { generatePostMessage, getSourceImage, SOURCE_TYPE_LABELS, SOURCE_TYPE_LINKS } from '../../features/posts/postTemplates'
import { addToast } from '../../features/ui/uiSlice'

/**
 * Modal de partage vers le fil d'actualité.
 *
 * Props :
 *   sourceType  — 'listing' | 'parcel' | 'business' | 'event' | 'job' | 'free'
 *   sourceId    — id de l'objet source (nullable pour post libre)
 *   sourceData  — objet complet depuis Redux (pour pré-remplir le message)
 *   onClose     — callback de fermeture
 *
 * Usage : <ShareToFeedModal sourceType="job" sourceId={job.id} sourceData={job} onClose={() => setOpen(false)} />
 */
export function ShareToFeedModal({ sourceType = 'free', sourceId = null, sourceData = {}, onClose }) {
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)
  const textareaRef = useRef(null)
  const dialogRef = useRef(null)
  const titleId = useId()
  const messageFieldId = useId()

  const defaultMessage = generatePostMessage(sourceType, sourceData, user?.firstName)
  const defaultImage = getSourceImage(sourceType, sourceData)
  const directLink = sourceId ? SOURCE_TYPE_LINKS[sourceType]?.(sourceId) : '/news'

  const [message, setMessage] = useState(defaultMessage)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(defaultImage || '')
  const fileInputRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
    dialogRef.current?.focus()
  }, [])

  // Fermeture sur Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handlePublish() {
    if (!message.trim()) return
    dispatch(
      createPost({
        authorId: user.id,
        authorName: `${user.firstName} ${user.lastName}`,
        authorAvatarUrl: user.avatarUrl || null,
        sourceType,
        sourceId,
        message: message.trim(),
        imageUrl: imagePreview || null,
        imageFile: imageFile || null,
        directLink,
      }),
    )
    dispatch(addToast({ title: 'Post publié !', message: 'Votre partage est visible dans le fil d\'actualité.', tone: 'success' }))
    onClose()
  }

  const typeLabel = SOURCE_TYPE_LABELS[sourceType] || 'Post'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-3xl bg-[var(--app-surface)] shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiShare2 className="text-sm" />
            </span>
            <div>
              <h2 id={titleId} className="text-sm font-black">Partager sur le fil</h2>
              <p className="text-xs text-[var(--app-text-muted)]">{typeLabel} · visible par toute la communauté</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-8 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
          >
            <FiX />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          {/* Auteur */}
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
            ) : (
              <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
            <div>
              <p className="text-sm font-bold">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-[var(--app-text-muted)]">Fil d'actualité MOXT</p>
            </div>
          </div>

          {/* Message */}
          <label htmlFor={messageFieldId} className="sr-only">
            Message du post
          </label>
          <textarea
            id={messageFieldId}
            ref={textareaRef}
            className="min-h-28 w-full resize-none rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm leading-relaxed outline-none focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]"
            placeholder="Rédigez votre message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
          <p className="text-right text-xs text-[var(--app-text-faint)]">{message.length}/500</p>

          {/* Image upload */}
          <div className="grid gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="h-36 w-full rounded-2xl object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  aria-label="Supprimer l'image"
                >
                  <FiTrash2 className="text-xs" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--app-border)] px-4 py-5 text-sm font-medium text-[var(--app-text-muted)] transition hover:border-[var(--app-accent)] hover:text-[var(--app-accent)]"
              >
                <FiImage className="text-base" /> Ajouter une image
              </button>
            )}
          </div>

          {/* Lien direct */}
          {directLink && (
            <p className="truncate text-xs text-[var(--app-text-faint)]">
              🔗 Lien : {directLink}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--app-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-bold text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!message.trim()}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            <FiSend className="text-xs" /> Publier
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
