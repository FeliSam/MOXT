import { useState } from 'react'
import { FiEdit2, FiExternalLink, FiPlus, FiStar, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Badge, PillBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { HELP_CATEGORIES, helpCategoryMeta } from '../config/helpCategories'
import { useLanguage } from '../contexts/useLanguage'
import {
  createHelpArticle,
  deleteHelpArticle,
  updateHelpArticle,
} from '../features/help/helpArticlesSlice'
import { addToast } from '../features/ui/uiSlice'
import { formatDate } from '../features/transfers/transferUtils'

const LANGUAGES = ['fr', 'en', 'es', 'pt', 'ru']

function emptyForm() {
  return {
    category: 'documents',
    language: 'fr',
    title: '',
    summary: '',
    content: '',
    sourceName: '',
    sourceUrl: '',
    pinned: false,
    status: 'published',
  }
}

export function AdminHelpArticlesPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const articles = useSelector((state) => state.helpArticles.items)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(article) {
    setEditing(article)
    setForm({
      category: article.category,
      language: article.language,
      title: article.title,
      summary: article.summary,
      content: article.content,
      sourceName: article.sourceName || '',
      sourceUrl: article.sourceUrl || '',
      pinned: article.pinned === true,
      status: article.status,
    })
    setModalOpen(true)
  }

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSave() {
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      dispatch(
        addToast({
          title: t('common.error'),
          message: t('adminHelp.validation.required'),
          tone: 'error',
        }),
      )
      return
    }
    if (editing) {
      dispatch(
        updateHelpArticle({
          id: editing.id,
          changes: { ...form, verifiedAt: new Date().toISOString() },
        }),
      )
    } else {
      dispatch(
        createHelpArticle({
          ...form,
          authorId: user.id,
          authorName: `${user.firstName} ${user.lastName}`,
        }),
      )
    }
    dispatch(addToast({ title: t('adminHelp.savedTitle'), tone: 'success' }))
    setModalOpen(false)
  }

  function handleDelete() {
    if (!confirmDeleteId) return
    dispatch(deleteHelpArticle(confirmDeleteId))
    setConfirmDeleteId(null)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={t('adminHelp.eyebrow')}
        title={t('adminHelp.title')}
        description={t('adminHelp.description')}
        actions={
          <Button icon={FiPlus} onClick={openCreate}>
            {t('adminHelp.newArticle')}
          </Button>
        }
      />

      {articles.length ? (
        <div className="grid gap-3">
          {articles.map((article) => {
            const meta = helpCategoryMeta(article.category)
            return (
              <Card key={article.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PillBadge active={false}>{t(meta.labelKey)}</PillBadge>
                    <Badge tone={article.status === 'published' ? 'success' : 'slate'}>
                      {article.status === 'published'
                        ? t('adminHelp.status.published')
                        : t('adminHelp.status.draft')}
                    </Badge>
                    {article.pinned ? <FiStar className="text-amber-500" /> : null}
                    <span className="text-xs uppercase text-[var(--app-text-faint)]">
                      {article.language}
                    </span>
                  </div>
                  <h3 className="mt-1.5 truncate font-black">{article.title}</h3>
                  {article.verifiedAt ? (
                    <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                      {t('help.article.verifiedOn', { date: formatDate(article.verifiedAt) })}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {article.sourceUrl ? (
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-9 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
                      aria-label={article.sourceName || article.sourceUrl}
                    >
                      <FiExternalLink />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openEdit(article)}
                    aria-label={t('common.edit')}
                    className="grid size-9 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(article.id)}
                    aria-label={t('common.delete')}
                    className="grid size-9 place-items-center rounded-xl text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center text-sm text-[var(--app-text-muted)]">
          {t('adminHelp.empty')}
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('adminHelp.editArticle') : t('adminHelp.newArticle')}
        size="wide"
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="help-category"
              label={t('adminHelp.fields.category')}
              value={form.category}
              onChange={(event) => set('category', event.target.value)}
            >
              {HELP_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
            <Select
              id="help-language"
              label={t('adminHelp.fields.language')}
              value={form.language}
              onChange={(event) => set('language', event.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>
          <Input
            id="help-title"
            label={t('adminHelp.fields.title')}
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
          />
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">{t('adminHelp.fields.summary')}</span>
            <textarea
              className="min-h-16 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              value={form.summary}
              onChange={(event) => set('summary', event.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">{t('adminHelp.fields.content')}</span>
            <textarea
              className="min-h-40 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              value={form.content}
              onChange={(event) => set('content', event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="help-source-name"
              label={t('adminHelp.fields.sourceName')}
              value={form.sourceName}
              onChange={(event) => set('sourceName', event.target.value)}
            />
            <Input
              id="help-source-url"
              label={t('adminHelp.fields.sourceUrl')}
              value={form.sourceUrl}
              onChange={(event) => set('sourceUrl', event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(event) => set('pinned', event.target.checked)}
                className="size-5 accent-brand-700"
              />
              {t('adminHelp.fields.pinned')}
            </label>
            <Select
              id="help-status"
              label={t('adminHelp.fields.status')}
              value={form.status}
              onChange={(event) => set('status', event.target.value)}
              className="min-w-[10rem]"
            >
              <option value="published">{t('adminHelp.status.published')}</option>
              <option value="draft">{t('adminHelp.status.draft')}</option>
            </Select>
          </div>
          <p className="text-xs text-[var(--app-text-muted)]">{t('adminHelp.sourceHint')}</p>
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title={t('adminHelp.deleteConfirmTitle')}
        description={t('adminHelp.deleteConfirmBody')}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
