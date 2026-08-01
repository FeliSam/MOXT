import { FiEye, FiLayers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { contentActions } from '../adminActions'
import { CARD, CONTENT_SECTIONS, ITEM } from '../adminConfig'
import { contentSubtitle, detailLinkFor } from '../adminData'
import { adminOptionLabel, adminText } from '../adminI18n'
import { statusDotColor } from '../adminUtils'
import { Empty, SectionTitle } from './AdminShared'

function contentDisplayTitle(contentView, item) {
  if (contentView === 'posts') {
    const text = (item.message || item.title || item.body || item.content || '')
      .trim()
      .replace(/\s+/g, ' ')
    if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text
  }
  return (
    item.name ||
    item.title ||
    `${item.origin || ''} ${item.destination || ''}`.trim() ||
    item.id
  )
}

function listingThumb(item) {
  const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : []
  return images[0] || null
}

function ContentRow({ contentView, dispatch, item, setSelected, t }) {
  const status = item.effectiveStatus || item.status || 'active'
  const isPending = ['pending', 'pending_review', 'draft', 'new'].includes(status)
  const isArchived = ['archived', 'rejected', 'expired', 'completed', 'suspended', 'dismissed'].includes(status)
  const proofStatus =
    contentView === 'parcels'
      ? item.proofStatus || (item.travelProofUrl ? 'pending_review' : 'missing')
      : null
  const thumb = contentView === 'listings' ? listingThumb(item) : null
  return (
    <div className={`${ITEM} grid gap-3 ${isPending ? 'border-amber-200 dark:border-amber-800/40' : ''} ${isArchived ? 'opacity-80' : ''}`}>
      <div className="flex min-w-0 items-center gap-3">
        {thumb ? (
          <button
            type="button"
            onClick={() => setSelected({ kind: contentView, item })}
            className="size-12 shrink-0 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]"
          >
            <img src={thumb} alt="" className="size-full object-cover" />
          </button>
        ) : (
          <span className={`size-2 shrink-0 rounded-full ${statusDotColor(status)}`} />
        )}
        <button
          type="button"
          onClick={() => setSelected({ kind: contentView, item })}
          className="min-w-0 flex-1 overflow-hidden text-left hover:text-brand-700"
        >
          <strong className="block truncate text-sm" title={contentDisplayTitle(contentView, item)}>
            {contentDisplayTitle(contentView, item)}
          </strong>
          <p className="truncate text-xs text-[var(--app-text-muted)]">
            {contentSubtitle(contentView, item, t)}
          </p>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              isPending
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                : isArchived
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
            }`}
          >
            {status}
          </span>
          {proofStatus ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                proofStatus === 'verified'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : proofStatus === 'rejected'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                    : proofStatus === 'pending_review'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {proofStatus === 'missing'
                ? adminText(t, 'admin.facts.proofMissing')
                : `${adminText(t, 'admin.facts.proofStatus')}: ${proofStatus}`}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {contentActions(contentView, dispatch, item, t)}
        {detailLinkFor(contentView, item) && (
          <Link to={detailLinkFor(contentView, item)}>
            <Button variant="secondary" icon={FiEye}>{adminText(t, 'admin.actions.view')}</Button>
          </Link>
        )}
      </div>
    </div>
  )
}

export function AdminContentPanel({ contentView, dispatch, items, lockedSection, setContentView, setSelected }) {
  const { t } = useLanguage()
  const activeSection = CONTENT_SECTIONS.find((s) => s.id === contentView)

  return (
    <div className="grid gap-5">
      {!lockedSection ? (
        <div className={`${CARD} flex flex-wrap gap-2 p-3`}>
          {CONTENT_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setContentView(section.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                contentView === section.id
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface)]'
              }`}
            >
              <section.icon className="text-sm" />
              {adminOptionLabel(t, section)}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`${CARD} p-5 grid gap-4`}>
        <SectionTitle
          icon={activeSection?.icon || FiLayers}
          label={adminOptionLabel(t, activeSection) || adminText(t, 'admin.nav.content')}
          count={items.length}
        />
        {items.length ? (
          items.map((item) => (
            <ContentRow
              key={`${contentView}-${item.id}`}
              contentView={contentView}
              dispatch={dispatch}
              item={item}
              setSelected={setSelected}
              t={t}
            />
          ))
        ) : (
          <Empty label={adminText(t, 'admin.empty.noElement')} icon={FiLayers} />
        )}
      </div>
    </div>
  )
}
