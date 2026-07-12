import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiPaperclip, FiX } from 'react-icons/fi'
import {
  attachmentImageSrc,
  isImageAttachment,
} from '../../features/communications/attachmentUtils'

function MessageImageLightbox({ alt, onClose, src }) {
  useEffect(() => {
    if (!src) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, src])

  if (!src) return null

  return (
    <div
      className="message-image-lightbox fixed inset-0 z-[var(--z-lightbox)] grid place-items-center bg-slate-950/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu de l’image"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
        onClick={onClose}
        aria-label="Fermer l’aperçu"
      >
        <FiX className="text-lg" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[min(90dvh,56rem)] max-w-[min(92vw,56rem)] rounded-2xl object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}

export function MessageAttachment({ attachment, mine }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const src = attachmentImageSrc(attachment)

  if (isImageAttachment(attachment) && src) {
    return (
      <>
        <button
          type="button"
          className="message-attachment-image"
          onClick={(event) => {
            event.stopPropagation()
            setLightboxOpen(true)
          }}
          aria-label={`Voir l’image ${attachment.name || ''}`.trim()}
        >
          <img src={src} alt={attachment.name || 'Image envoyée'} loading="lazy" decoding="async" />
        </button>
        {lightboxOpen
          ? createPortal(
              <MessageImageLightbox
                src={src}
                alt={attachment.name || 'Image envoyée'}
                onClose={() => setLightboxOpen(false)}
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
        <FiPaperclip aria-hidden="true" />
        {attachment.name}
      </a>
    )
  }

  return (
    <span
      className={`message-attachment ${mine ? 'message-attachment--sent' : 'message-attachment--received'}`}
    >
      <FiPaperclip aria-hidden="true" />
      {attachment.name}
    </span>
  )
}
