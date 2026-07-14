import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronLeft, FiChevronRight, FiPaperclip, FiX } from 'react-icons/fi'
import {
  attachmentImageSrcs,
  isImageAttachment,
  MESSAGE_IMAGE_STACK_OFFSET,
  MESSAGE_IMAGE_STACK_ROTATIONS,
} from '../../features/communications/attachmentUtils'

function MessageImageLightbox({ images, initialIndex = 0, onClose }) {
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
      aria-label="Aperçu de l’image"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
        onClick={onClose}
        aria-label="Fermer l’aperçu"
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
            aria-label="Image précédente"
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
            aria-label="Image suivante"
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

function MessageImageStack({ images, name, onOpen }) {
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
        aria-label={`Voir l’image ${name || ''}`.trim()}
      >
        <img src={images[0]} alt={name || 'Image envoyée'} loading="lazy" decoding="async" />
      </button>
    )
  }

  // Shrink cards so leftward (-15% × layer) offsets stay inside the stack width.
  const cardPct = 100 / (1 + MESSAGE_IMAGE_STACK_OFFSET * (count - 1))
  const offsetPct = MESSAGE_IMAGE_STACK_OFFSET * 100

  return (
    <div
      className="message-attachment-stack"
      role="group"
      aria-label={`${count} images`}
      style={{
        '--message-stack-card-pct': `${cardPct}%`,
      }}
    >
      {images.map((src, index) => {
        const depth = count - 1 - index
        const rotation = MESSAGE_IMAGE_STACK_ROTATIONS[index] ?? 0
        return (
          <button
            key={`${src}-${index}`}
            type="button"
            className="message-attachment-stack-layer"
            style={{
              zIndex: depth + 1,
              transform: `translateX(calc(${index} * -${offsetPct}%)) translateY(${index * 0.12}rem) rotate(${rotation}deg)`,
            }}
            onClick={(event) => {
              event.stopPropagation()
              onOpen(index)
            }}
            aria-label={`Voir l’image ${index + 1} sur ${count}`}
          >
            <img src={src} alt="" loading="lazy" decoding="async" />
          </button>
        )
      })}
    </div>
  )
}

export function MessageAttachment({ attachment, mine }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const images = attachmentImageSrcs(attachment)

  if (isImageAttachment(attachment) && images.length) {
    const lightboxOpen = lightboxIndex != null
    return (
      <>
        <MessageImageStack
          images={images}
          name={attachment.name}
          onOpen={setLightboxIndex}
        />
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
