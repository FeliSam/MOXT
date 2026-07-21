import { useState } from 'react'
import { FiExternalLink, FiFileText, FiImage, FiPlus } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ImageLightbox } from '../../components/ui/ImageLightbox'
import { Select } from '../../components/ui/Select'
import { UploadProgress } from '../../components/ui/UploadProgress'
import { FileNameText } from '../../components/ui/FileNameText'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'
import {
  BUSINESS_DOCUMENT_TYPES,
  isBusinessDocumentType,
} from '../../features/businesses/businessDocumentTypes'
import { addBusinessDocument } from '../../features/businesses/businessSlice'
import { professionalText } from '../../features/businesses/professionalI18n'
import { addToast } from '../../features/ui/uiSlice'
import { useUploadProgress } from '../../hooks/useUploadProgress'
import { storageService } from '../../services/storageService'

function isImageDoc(document) {
  if (document?.type?.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(String(document?.name || ''))
}

async function resolveDocumentUrl(document) {
  const source = document.storagePath || document.url
  if (!source) return null
  try {
    return await storageService.getDocumentSignedUrl(source)
  } catch {
    return document.url || null
  }
}

export function DocumentsPanel({ business, dispatch, documents, initialCategory = 'registration' }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const [category, setCategory] = useState(
    isBusinessDocumentType(initialCategory) ? initialCategory : 'registration',
  )
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [openingId, setOpeningId] = useState(null)
  const { progress, track } = useUploadProgress()

  const documentTypeLabel = (value) => {
    const item = BUSINESS_DOCUMENT_TYPES.find((entry) => entry.value === value)
    if (!item) return value || pt('professional.documents.types.fallback')
    return pt(`professional.documents.types.${item.value}`)
  }

  async function add(file) {
    if (!file || uploading || progress.active) return
    setUploading(true)
    try {
      const uploaded = await track((onProgress) =>
        storageService.uploadBusinessDocument(business.ownerId, business.id, category, file, {
          onProgress,
        }),
      )
      dispatch(
        addBusinessDocument({
          businessId: business.id,
          ownerId: business.ownerId,
          category,
          name: file.name,
          size: file.size,
          type: file.type,
          url: uploaded?.url || null,
          storagePath: uploaded?.path || null,
        }),
      )
      dispatch(
        addToast({
          title: pt('professional.documents.toast.addedTitle'),
          message: pt('professional.documents.toast.addedBody', {
            type: documentTypeLabel(category),
          }),
          tone: 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: pt('professional.documents.toast.errorTitle'),
          message: err?.message || pt('professional.documents.toast.errorBody'),
          tone: 'error',
        }),
      )
    } finally {
      setUploading(false)
    }
  }

  async function openDocument(document) {
    setOpeningId(document.id)
    try {
      const url = await resolveDocumentUrl(document)
      if (!url) throw new Error('missing url')
      if (isImageDoc(document)) {
        setLightbox({ images: [url], index: 0, alt: document.name || '' })
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      dispatch(
        addToast({
          title: pt('professional.documents.toast.errorTitle'),
          message: pt('professional.documents.toast.errorBody'),
          tone: 'error',
        }),
      )
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="grid gap-4">
        <div>
          <h2 className="font-black">{pt('professional.documents.title')}</h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            {pt('professional.documents.description')}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Select
            id="business-document-category"
            label={pt('professional.documents.typeLabel')}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={uploading}
          >
            {BUSINESS_DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {pt(`professional.documents.types.${type.value}`)}
              </option>
            ))}
          </Select>
          <label
            className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white ${
              uploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <FiPlus />{' '}
            {uploading ? pt('professional.documents.uploading') : pt('professional.documents.add')}
            <input
              className="sr-only"
              type="file"
              accept=".pdf,image/*"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                add(file)
              }}
            />
          </label>
        </div>
        <p className="text-xs text-[var(--app-text-muted)]">
          {pt('professional.documents.formatsHint')}
        </p>
        {progress.active || progress.phase === 'done' || progress.phase === 'error' ? (
          <UploadProgress progress={progress} />
        ) : null}
      </Card>
      {documents.length ? (
        documents.map((document) => {
          const image = isImageDoc(document)
          return (
            <Card
              key={document.id}
              className="flex min-w-0 max-w-full flex-wrap items-center gap-4 overflow-hidden"
            >
              {image && document.url ? (
                <button
                  type="button"
                  className="size-14 shrink-0 overflow-hidden rounded-xl bg-[var(--app-surface-muted)]"
                  aria-label={pt('professional.documents.viewFile')}
                  onClick={() => openDocument(document)}
                >
                  <img
                    src={document.url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                </button>
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-brand-600">
                  {image ? <FiImage className="text-xl" /> : <FiFileText className="text-xl" />}
                </span>
              )}
              <div className="min-w-0 flex-1 overflow-hidden">
                <FileNameText as="strong" name={document.name} className="block font-bold" maxLength={40} />
                <span className="text-xs text-[var(--app-text-muted)]">
                  {documentTypeLabel(document.category)} ·{' '}
                  {pt('professional.documents.sizeKb', { size: Math.ceil(document.size / 1024) })}
                </span>
                {document.reviewNote && document.status === 'rejected' ? (
                  <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                    {pt('professional.documents.rejectNote', { note: document.reviewNote })}
                  </p>
                ) : null}
              </div>
              <Badge tone={statusMeta(document.status, t).tone}>
                {statusMeta(document.status, t).label}
              </Badge>
              <Button
                variant="secondary"
                icon={FiExternalLink}
                loading={openingId === document.id}
                onClick={() => openDocument(document)}
              >
                {image
                  ? pt('professional.documents.viewFile')
                  : pt('professional.documents.openFile')}
              </Button>
            </Card>
          )
        })
      ) : (
        <EmptyState title={pt('professional.documents.empty')} />
      )}
      <ImageLightbox
        open={Boolean(lightbox)}
        images={lightbox?.images || []}
        index={lightbox?.index || 0}
        alt={lightbox?.alt || ''}
        onClose={() => setLightbox(null)}
        onIndexChange={(updater) =>
          setLightbox((current) =>
            current
              ? {
                  ...current,
                  index: typeof updater === 'function' ? updater(current.index) : updater,
                }
              : current,
          )
        }
      />
    </div>
  )
}
