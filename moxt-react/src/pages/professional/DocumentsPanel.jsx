import { useState } from 'react'
import { FiFileText, FiPlus } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Select } from '../../components/ui/Select'
import { statusMeta } from '../../config/statuses'
import { useLanguage } from '../../contexts/useLanguage'
import {
  BUSINESS_DOCUMENT_TYPES,
  isBusinessDocumentType,
} from '../../features/businesses/businessDocumentTypes'
import { addBusinessDocument } from '../../features/businesses/businessSlice'
import { professionalText } from '../../features/businesses/professionalI18n'
import { addToast } from '../../features/ui/uiSlice'

export function DocumentsPanel({ business, dispatch, documents, initialCategory = 'registration' }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const [category, setCategory] = useState(
    isBusinessDocumentType(initialCategory) ? initialCategory : 'registration',
  )

  const documentTypeLabel = (value) => {
    const item = BUSINESS_DOCUMENT_TYPES.find((entry) => entry.value === value)
    if (!item) return value || pt('professional.documents.types.fallback')
    return pt(`professional.documents.types.${item.value}`)
  }

  function add(file) {
    if (!file) return
    dispatch(
      addBusinessDocument({
        businessId: business.id,
        ownerId: business.ownerId,
        category,
        name: file.name,
        size: file.size,
        type: file.type,
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
          >
            {BUSINESS_DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {pt(`professional.documents.types.${type.value}`)}
              </option>
            ))}
          </Select>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white">
            <FiPlus /> {pt('professional.documents.add')}
            <input
              className="sr-only"
              type="file"
              accept=".pdf,image/*"
              onChange={(event) => add(event.target.files?.[0])}
            />
          </label>
        </div>
        <p className="text-xs text-[var(--app-text-muted)]">
          {pt('professional.documents.formatsHint')}
        </p>
      </Card>
      {documents.length ? (
        documents.map((document) => (
          <Card key={document.id} className="flex items-center gap-4">
            <FiFileText className="text-xl text-brand-600" />
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{document.name}</strong>
              <span className="text-xs text-[var(--app-text-muted)]">
                {documentTypeLabel(document.category)} ·{' '}
                {pt('professional.documents.sizeKb', { size: Math.ceil(document.size / 1024) })}
              </span>
            </div>
            <Badge tone={statusMeta(document.status, t).tone}>
              {statusMeta(document.status, t).label}
            </Badge>
          </Card>
        ))
      ) : (
        <EmptyState title={pt('professional.documents.empty')} />
      )}
    </div>
  )
}
