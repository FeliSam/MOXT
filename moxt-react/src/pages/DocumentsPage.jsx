import { useState } from 'react'
import { FiFileText, FiTrash2, FiUpload } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { BackButton } from '../components/ui/BackButton'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { statusMeta } from '../config/statuses'
import { useLanguage } from '../contexts/useLanguage'
import { addPersonalDocument, removePersonalDocument } from '../features/account/accountSlice'
import { addToast } from '../features/ui/uiSlice'
import { phase3Text } from '../i18n/phase3I18n'
import { storageService } from '../services/storageService'

export function DocumentsPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const documents = useSelector((state) =>
    state.account.documents.filter(
      (item) => item.userId === user.id && !item.deletedAt && !item.deletedByUser,
    ),
  )
  const [category, setCategory] = useState('identity')

  async function addDocument(file) {
    if (!file) return
    try {
      const uploaded = await storageService.uploadDocument(user.id, category, file)
      dispatch(
        addPersonalDocument({
          userId: user.id,
          category,
          name: file.name,
          size: file.size,
          type: file.type,
          url: uploaded?.url || uploaded,
          storagePath: uploaded?.path || null,
        }),
      )
      dispatch(
        addToast({
          title: p3('documents.toast.sentTitle'),
          message: p3('documents.toast.sentMessage'),
          tone: 'success',
        }),
      )
    } catch (err) {
      dispatch(addToast({ title: p3('common.error'), message: err.message, tone: 'error' }))
    }
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('common.account')}
        title={p3('documents.title')}
        description={p3('documents.description')}
        actions={<BackButton appearance="link" />}
      />
      <Card>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Select
            id="document-category"
            label={p3('documents.typeLabel')}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="identity">{p3('documents.types.identity')}</option>
            <option value="address">{p3('documents.types.address')}</option>
            <option value="income">{p3('documents.types.income')}</option>
            <option value="other">{p3('documents.types.other')}</option>
          </Select>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white">
            <FiUpload /> {p3('documents.upload')}
            <input
              className="sr-only"
              type="file"
              accept=".pdf,image/*"
              onChange={(event) => addDocument(event.target.files?.[0])}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-[var(--app-text-muted)]">{p3('documents.hint')}</p>
      </Card>

      {documents.length ? (
        <div className="grid gap-3">
          {documents.map((document) => {
            const meta = statusMeta(document.status)
            return (
              <Card className="flex h-full flex-wrap items-center gap-4">
                <FiFileText className="text-2xl text-brand-600" />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate">{document.name}</strong>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {document.category} · {Math.ceil(document.size / 1024)} {p3('common.kb')}
                  </p>
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <Button
                  variant="danger"
                  icon={FiTrash2}
                  onClick={() =>
                    dispatch(removePersonalDocument({ id: document.id, userId: user.id }))
                  }
                >
                  {p3('documents.remove')}
                </Button>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={FiFileText} title={p3('documents.empty')} />
      )}
    </div>
  )
}
