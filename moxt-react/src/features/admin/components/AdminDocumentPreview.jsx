import { useEffect, useState } from 'react'
import { FiDownload, FiExternalLink, FiFileText, FiImage } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useLanguage } from '../../../contexts/useLanguage'
import { storageService } from '../../../services/storageService'
import { adminText } from '../adminI18n'

function isImageType(doc) {
  if (doc?.type?.startsWith('image/')) return true
  const name = String(doc?.name || '').toLowerCase()
  return /\.(png|jpe?g|gif|webp|bmp)$/.test(name)
}

function isPdfType(doc) {
  if (doc?.type === 'application/pdf') return true
  return String(doc?.name || '').toLowerCase().endsWith('.pdf')
}

async function resolvePreviewUrl(doc) {
  const source = doc.storagePath || doc.url
  if (!source) return null
  try {
    return await storageService.getDocumentSignedUrl(source)
  } catch {
    return doc.url || null
  }
}

async function downloadDocument(url, filename) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('download failed')
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename || 'document'
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export function AdminDocumentPreview({ documentIds = [], documents: documentsProp }) {
  const { t } = useLanguage()
  const personalDocuments = useSelector((state) => state.account.documents || [])
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    let cancelled = false

    const matched = Array.isArray(documentsProp)
      ? documentsProp.filter(Boolean)
      : (Array.isArray(documentIds) ? documentIds : [])
          .map((id) => personalDocuments.find((doc) => doc.id === id))
          .filter(Boolean)

    async function load() {
      const next = await Promise.all(
        matched.map(async (doc) => ({
          doc,
          url: await resolvePreviewUrl(doc),
        })),
      )
      if (!cancelled) setPreviews(next)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [documentIds, documentsProp, personalDocuments])

  const expectedCount = Array.isArray(documentsProp)
    ? documentsProp.filter(Boolean).length
    : (Array.isArray(documentIds) ? documentIds.length : 0)

  if (!expectedCount) {
    return (
      <p className="break-words text-xs text-[var(--app-text-muted)]">
        {adminText(t, 'admin.documents.none')}
      </p>
    )
  }

  if (!previews.length) {
    return (
      <p className="break-words text-xs text-[var(--app-text-muted)]">
        {adminText(t, 'admin.documents.notFound', { count: expectedCount })}
      </p>
    )
  }

  return (
    <div className="grid min-w-0 gap-3">
      {previews.map(({ doc, url }) => {
        const image = isImageType(doc)
        const pdf = isPdfType(doc)
        return (
          <div
            key={doc.id}
            className="min-w-0 overflow-hidden rounded-xl border border-[color:rgb(148_163_184/0.14)] bg-[var(--app-surface-muted)]"
          >
            <div className="flex min-w-0 items-center gap-2 border-b border-[color:rgb(148_163_184/0.12)] px-3 py-2">
              {image ? (
                <FiImage className="shrink-0 text-brand-700" />
              ) : (
                <FiFileText className="shrink-0 text-brand-700" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{doc.name || doc.id}</p>
                <p className="truncate text-[10px] uppercase tracking-wider text-[var(--app-text-muted)]">
                  {doc.category}
                  {doc.deletedAt || doc.deletedByUser ? ` · ${t('verification.admin.softDeleted')}` : ''}
                </p>
              </div>
              {url ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => downloadDocument(url, doc.name || doc.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                  >
                    {adminText(t, 'admin.documents.download')} <FiDownload />
                  </button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                  >
                    {t('verification.admin.openDocument')} <FiExternalLink />
                  </a>
                </div>
              ) : null}
            </div>
            {url && image ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="block max-w-full overflow-hidden">
                <img
                  src={url}
                  alt={doc.name || 'Document'}
                  className="mx-auto block max-h-64 max-w-full object-contain bg-[var(--app-surface)]"
                />
              </a>
            ) : null}
            {url && pdf ? (
              <iframe
                title={doc.name || 'PDF'}
                src={url}
                className="block h-72 max-w-full w-full bg-[var(--app-surface)]"
              />
            ) : null}
            {url && !image && !pdf ? (
              <p className="break-words px-3 py-4 text-xs text-[var(--app-text-muted)]">
                {adminText(t, 'admin.documents.previewUnavailable')}
              </p>
            ) : null}
            {!url ? (
              <p className="break-words px-3 py-4 text-xs text-[var(--app-text-muted)]">
                {adminText(t, 'admin.documents.noSignedUrl')}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
