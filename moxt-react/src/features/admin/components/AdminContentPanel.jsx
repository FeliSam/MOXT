import { FiEye, FiLayers } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { contentActions } from '../adminActions'
import { CARD, CONTENT_SECTIONS, ITEM } from '../adminConfig'
import { contentSubtitle, detailLinkFor } from '../adminData'
import { statusDotColor } from '../adminUtils'
import { Empty, SectionTitle } from './AdminShared'

function ContentRow({ contentView, dispatch, item, setSelected }) {
  const status = item.status || 'active'
  const isPending = ['pending', 'pending_review', 'draft'].includes(status)
  return (
    <div className={`${ITEM} grid gap-3 ${isPending ? 'border-amber-200 dark:border-amber-800/40' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`size-2 shrink-0 rounded-full ${statusDotColor(status)}`} />
        <button
          type="button"
          onClick={() => setSelected({ kind: contentView, item })}
          className="text-left hover:text-brand-700"
        >
          <strong className="block text-sm">
            {item.name || item.title || `${item.origin || ''} ${item.destination || ''}`.trim() || item.id}
          </strong>
          <p className="text-xs text-[var(--app-text-muted)]">{contentSubtitle(contentView, item)}</p>
        </button>
        {isPending && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            En attente
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {contentActions(contentView, dispatch, item)}
        {detailLinkFor(contentView, item) && (
          <Link to={detailLinkFor(contentView, item)}>
            <Button variant="secondary" icon={FiEye}>Voir</Button>
          </Link>
        )}
      </div>
    </div>
  )
}

export function AdminContentPanel({ contentView, dispatch, items, setContentView, setSelected }) {
  return (
    <div className="grid gap-5">
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
            {section.label}
          </button>
        ))}
      </div>

      <div className={`${CARD} p-5 grid gap-4`}>
        <SectionTitle
          icon={CONTENT_SECTIONS.find((s) => s.id === contentView)?.icon || FiLayers}
          label={CONTENT_SECTIONS.find((s) => s.id === contentView)?.label || 'Contenus'}
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
            />
          ))
        ) : (
          <Empty label="Aucun element." icon={FiLayers} />
        )}
      </div>
    </div>
  )
}
