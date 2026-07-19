import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronLeft, FiChevronRight, FiPaperclip, FiX } from 'react-icons/fi'
import {
  attachmentImageSrcs,
  isImageAttachment,
  messageImageStackRotation,
} from '../../features/communications/attachmentUtils'
import { useLanguage } from '../../contexts/useLanguage'
import { messagesText } from '../../features/communications/messagesI18n'

function MessageImageLightbox({ images, initialIndex = 0, onClose }) {
  const { t } = useLanguage()
  const safeImages = images.filter(Boolean)
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, safeImages.length - 1)),
  )
  const src = safeImages[index]
  const count = safeImages.length
  const canNavigate = count > 1

  useEffect(() => {
    setIndex((current) => Math.min(Math.max(0, current), Math.max(0, count - 1)))
  }, [count, initialIndex])

  useEffect(() => {
    if (!src) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (!canNavigate) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setIndex((current) => (current - 1 + count) % count)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setIndex((current) => (current + 1) % count)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [canNavigate, count, onClose, src])

  if (!src) return null

  return (
    <div
      className="message-image-lightbox fixed inset-0 z-[var(--z-lightbox)] grid place-items-center bg-slate-950/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("messages.imagePreview")}
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 grid size-11 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
        style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))' }}
        onClick={onClose}
        aria-label={t("messages.closePreview")}
      >
        <FiX className="text-lg" />
      </button>
      {canNavigate ? (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition hover:bg-black/65 sm:left-5"
            onClick={(event) => {
              event.stopPropagation()
              setIndex((current) => (current - 1 + count) % count)
            }}
            aria-label={t("messages.prevImage")}
          >
            <FiChevronLeft className="text-2xl" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition hover:bg-black/65 sm:right-5"
            onClick={(event) => {
              event.stopPropagation()
              setIndex((current) => (current + 1) % count)
            }}
            aria-label={t("messages.nextImage")}
          >
            <FiChevronRight className="text-2xl" />
          </button>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold tabular-nums text-white">
            {index + 1} / {count}
          </span>
        </>
      ) : null}
      <img
        src={src}
        alt={`Image ${index + 1}`}
        className="max-h-[min(90dvh,56rem)] max-w-[min(92vw,56rem)] rounded-2xl object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}

function MessageImageStack({ images, name, mine, onOpen }) {
  const { t } = useLanguage()
  const count = images.length
  if (count === 1) {
    return (
      <button
        type="button"
        className="message-attachment-image"
        onClick={(event) => {
          event.stopPropagation()
          onOpen(0)
        }}
        aria-label={t("messages.viewImage", { name: name || "" }).trim()}
      >
        <img src={images[0]} alt={name || t("messages.imageAlt")} loading="lazy" decoding="async" />
      </button>
    )
  }

  return (
    <div
      className={`message-attachment-stack ${mine ? 'message-attachment-stack--sent' : 'message-attachment-stack--received'}`}
      role="group"
      aria-label={t("messages.imagesCount", { count })}
    >
      {images.map((src, index) => {
        const depth = count - 1 - index
        const rotation = messageImageStackRotation(index, { sent: mine })
        const scale = 1 - index * 0.02
        return (
          <button
            key={`${src}-${index}`}
            type="button"
            className="message-attachment-stack-layer"
            style={{
              zIndex: depth + 1,
              '--stack-rot': `${rotation}deg`,
              '--stack-scale': scale,
            }}
            onClick={(event) => {
              event.stopPropagation()
              onOpen(index)
            }}
            aria-label={t("messages.viewImageN", { index: index + 1, count })}
          >
            <img src={src} alt="" loading="lazy" decoding="async" />
          </button>
        )
      })}
    </div>
  )
}

export function MessageAttachment({ attachment, mine }) {
  const { t } = useLanguage()
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const images = attachmentImageSrcs(attachment)
  const fromStatus = Boolean(attachment.fromStatus)
  const reactionEmoji = attachment.reactionEmoji

  if (isImageAttachment(attachment) && images.length) {
    const lightboxOpen = lightboxIndex != null
    return (
      <>
        <div className="message-status-media">
          <MessageImageStack
            images={images}
            name={attachment.name}
            mine={mine}
            onOpen={setLightboxIndex}
          />
          {fromStatus ? (
            <span className="message-status-badge">{messagesText(t, 'messages.statusBadge')}</span>
          ) : null}
          {reactionEmoji ? (
            <span className="message-status-reaction-emoji" aria-hidden="true">
              {reactionEmoji}
            </span>
          ) : null}
        </div>
        {lightboxOpen
          ? createPortal(
              <MessageImageLightbox
                images={images}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />,
              document.body,
            )
          : null}
      </>
    )
  }

  if (attachment.url) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className={`message-attachment ${mine ? 'message-attachment--sent' : 'message-attachment--received'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <FiPaperclip className="shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate">{attachment.name}</span>
      </a>
    )
  }

  return (
    <span
      className={`message-attachment ${mine ? 'message-attachment--sent' : 'message-attachment--received'}`}
    >
      <FiPaperclip className="shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{attachment.name}</span>
    </span>
  )
}
