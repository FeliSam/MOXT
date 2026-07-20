import { useMemo, useState } from 'react'
import { FiCheck, FiCopy, FiEdit2, FiExternalLink, FiPlus, FiStar, FiTrash2 } from 'react-icons/fi'
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
import { createId } from '../services/createId'
import {
  createHelpArticle,
  deleteHelpArticle,
  updateHelpArticle,
} from '../features/help/helpArticlesSlice'
import { addToast } from '../features/ui/uiSlice'
import { formatDate } from '../features/transfers/transferUtils'

const LANGUAGES = ['fr', 'en', 'es', 'pt', 'ru']

function emptyTranslation() {
  return { title: '', summary: '', content: '' }
}

function emptyForm() {
  return {
    translationGroupId: null,
    category: 'documents',
    sourceName: '',
    sourceUrl: '',
    pinned: false,
    status: 'published',
    translations: Object.fromEntries(LANGUAGES.map((lang) => [lang, emptyTranslation()])),
  }
}

function isTranslationFilled(translation) {
  return Boolean(translation?.title?.trim() && translation?.summary?.trim() && translation?.content?.trim())
}

function groupArticles(items) {
  const groups = new Map()
  for (const article of items) {
    const groupId = article.translationGroupId || article.id
    if (!groups.has(groupId)) groups.set(groupId, [])
    groups.get(groupId).push(article)
  }
  return [...groups.entries()].map(([groupId, rows]) => {
    const primary = rows.find((row) => row.language === 'fr') || rows[0]
    return { groupId, rows, primary }
  })
}

export function AdminHelpArticlesPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const articles = useSelector((state) => state.helpArticles.items)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [activeLang, setActiveLang] = useState('fr')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState(null)

  const groups = useMemo(() => groupArticles(articles), [articles])

  function openCreate() {
    setEditingGroupId(null)
    setForm(emptyForm())
    setActiveLang('fr')
    setModalOpen(true)
  }

  function openEdit(group) {
    const translations = Object.fromEntries(LANGUAGES.map((lang) => [lang, emptyTranslation()]))
    for (const row of group.rows) {
      translations[row.language] = {
        title: row.title || '',
        summary: row.summary || '',
        content: row.content || '',
      }
    }
    setEditingGroupId(group.groupId)
    setForm({
      translationGroupId: group.groupId,
      category: group.primary.category,
      sourceName: group.primary.sourceName || '',
      sourceUrl: group.primary.sourceUrl || '',
      pinned: group.primary.pinned === true,
      status: group.primary.status,
      translations,
    })
    setActiveLang('fr')
    setModalOpen(true)
  }

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function setTranslation(lang, field, value) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [lang]: { ...current.translations[lang], [field]: value },
      },
    }))
  }

  function copyFromFrench(lang) {
    setForm((current) => ({
      ...current,
      translations: { ...current.translations, [lang]: { ...current.translations.fr } },
    }))
  }

  function handleSave() {
    if (!isTranslationFilled(form.translations.fr)) {
      dispatch(
        addToast({
          title: t('common.error'),
          message: t('adminHelp.validation.required'),
          tone: 'error',
        }),
      )
      setActiveLang('fr')
      return
    }

    const translationGroupId = form.translationGroupId || createId('HELPGRP')
    const existingByLang = editingGroupId
      ? Object.fromEntries(
          articles
            .filter((item) => (item.translationGroupId || item.id) === editingGroupId)
            .map((item) => [item.language, item]),
        )
      : {}

    for (const lang of LANGUAGES) {
      const translation = form.translations[lang]
      const filled = isTranslationFilled(translation)
      const existing = existingByLang[lang]

      if (!filled) {
        if (existing) dispatch(deleteHelpArticle(existing.id))
        continue
      }

      const shared = {
        translationGroupId,
        language: lang,
        category: form.category,
        title: translation.title,
        summary: translation.summary,
        content: translation.content,
        sourceName: form.sourceName,
        sourceUrl: form.sourceUrl,
        pinned: form.pinned,
        status: form.status,
      }

      if (existing) {
        dispatch(updateHelpArticle({ id: existing.id, changes: { ...shared, verifiedAt: new Date().toISOString() } }))
      } else {
        dispatch(createHelpArticle({ ...shared, authorId: user.id, authorName: `${user.firstName} ${user.lastName}` }))
      }
    }

    dispatch(addToast({ title: t('adminHelp.savedTitle'), tone: 'success' }))
    setModalOpen(false)
  }

  function handleDelete() {
    if (!confirmDeleteGroupId) return
    const group = groups.find((item) => item.groupId === confirmDeleteGroupId)
    for (const row of group?.rows || []) dispatch(deleteHelpArticle(row.id))
    setConfirmDeleteGroupId(null)
  }

  const activeTranslation = form.translations[activeLang]
  const missingLanguages = LANGUAGES.filter((lang) => !isTranslationFilled(form.translations[lang]))

  return (
    <div className="grid min-w-0 gap-4 overflow-x-clip sm:gap-7">
      <PageHeader
        title={t('adminHelp.title')}
        actions={
          <Button icon={FiPlus} onClick={openCreate}>
            {t('adminHelp.newArticle')}
          </Button>
        }
      />

      {groups.length ? (
        <div className="grid gap-3">
          {groups.map((group) => {
            const meta = helpCategoryMeta(group.primary.category)
            const presentLangs = new Set(group.rows.map((row) => row.language))
            return (
              <Card key={group.groupId} className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PillBadge active={false}>{t(meta.labelKey)}</PillBadge>
                    <Badge tone={group.primary.status === 'published' ? 'success' : 'slate'}>
                      {group.primary.status === 'published'
                        ? t('adminHelp.status.published')
                        : t('adminHelp.status.draft')}
                    </Badge>
                    {group.primary.pinned ? <FiStar className="text-amber-500" /> : null}
                    <span className="flex items-center gap-1">
                      {LANGUAGES.map((lang) => (
                        <span
                          key={lang}
                          className={`grid size-5 place-items-center rounded-full text-[9px] font-black uppercase ${
                            presentLangs.has(lang)
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-[var(--app-surface-muted)] text-[var(--app-text-faint)]'
                          }`}
                          title={lang}
                        >
                          {lang}
                        </span>
                      ))}
                    </span>
                  </div>
                  <h3 className="mt-1.5 break-words font-black">{group.primary.title}</h3>
                  {group.primary.verifiedAt ? (
                    <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                      {t('help.article.verifiedOn', { date: formatDate(group.primary.verifiedAt) })}
                    </p>
                  ) : null}
                </div>
                <div className="flex w-full justify-end gap-2 sm:w-auto sm:shrink-0">
                  {group.primary.sourceUrl ? (
                    <a
                      href={group.primary.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-9 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
                      aria-label={group.primary.sourceName || group.primary.sourceUrl}
                    >
                      <FiExternalLink />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openEdit(group)}
                    aria-label={t('common.edit')}
                    className="grid size-9 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteGroupId(group.groupId)}
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
        title={editingGroupId ? t('adminHelp.editArticle') : t('adminHelp.newArticle')}
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
              id="help-status"
              label={t('adminHelp.fields.status')}
              value={form.status}
              onChange={(event) => set('status', event.target.value)}
            >
              <option value="published">{t('adminHelp.status.published')}</option>
              <option value="draft">{t('adminHelp.status.draft')}</option>
            </Select>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-bold">{t('adminHelp.fields.translations')}</p>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => {
                const filled = isTranslationFilled(form.translations[lang])
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black uppercase transition ${
                      activeLang === lang
                        ? 'border-brand-700 bg-brand-700 text-white'
                        : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
                    }`}
                  >
                    {filled ? <FiCheck className="text-emerald-400" /> : null}
                    {lang}
                  </button>
                )
              })}
            </div>
            {missingLanguages.length ? (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                {t('adminHelp.incompleteWarning', { languages: missingLanguages.join(', ').toUpperCase() })}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5">
            {activeLang !== 'fr' ? (
              <button
                type="button"
                onClick={() => copyFromFrench(activeLang)}
                className="flex w-fit items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-[var(--app-accent-soft)] dark:text-brand-300"
              >
                <FiCopy /> {t('adminHelp.copyFromFr')}
              </button>
            ) : null}
            <Input
              id={`help-title-${activeLang}`}
              label={t('adminHelp.fields.title')}
              className="min-w-0 w-full"
              value={activeTranslation.title}
              onChange={(event) => setTranslation(activeLang, 'title', event.target.value)}
            />
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">{t('adminHelp.fields.summary')}</span>
              <textarea
                className="min-h-16 min-w-0 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-sm"
                value={activeTranslation.summary}
                onChange={(event) => setTranslation(activeLang, 'summary', event.target.value)}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">{t('adminHelp.fields.content')}</span>
              <textarea
                className="min-h-40 min-w-0 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-sm"
                value={activeTranslation.content}
                onChange={(event) => setTranslation(activeLang, 'content', event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="help-source-name"
              label={t('adminHelp.fields.sourceName')}
              className="min-w-0 w-full"
              value={form.sourceName}
              onChange={(event) => set('sourceName', event.target.value)}
            />
            <Input
              id="help-source-url"
              label={t('adminHelp.fields.sourceUrl')}
              className="min-w-0 w-full"
              value={form.sourceUrl}
              onChange={(event) => set('sourceUrl', event.target.value)}
            />
          </div>
          <label className="flex w-fit items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(event) => set('pinned', event.target.checked)}
              className="size-5 accent-brand-700"
            />
            {t('adminHelp.fields.pinned')}
          </label>
          <p className="text-xs text-[var(--app-text-muted)]">{t('adminHelp.sourceHint')}</p>
          <Button className="w-full sm:w-auto" onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDeleteGroupId)}
        title={t('adminHelp.deleteConfirmTitle')}
        description={t('adminHelp.deleteConfirmBody')}
        onCancel={() => setConfirmDeleteGroupId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
