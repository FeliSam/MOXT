import { FiExternalLink } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { RELATED_CONTENT_META } from '../../config/communications'

export function RelatedContentPreview({ preview }) {
  if (!preview?.path) return null

  const meta = RELATED_CONTENT_META[preview.type] || RELATED_CONTENT_META.general
  const Icon = meta.icon

  return (
    <Link
      to={preview.path}
      className="group mb-4 block overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm transition hover:border-brand-200 hover:shadow-md dark:hover:border-brand-800"
      data-testid="related-content-preview"
    >
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[var(--app-surface-muted)] sm:size-20">
          {preview.imageUrl ? (
            <img
              src={preview.imageUrl}
              alt=""
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span
              className={`grid size-full place-items-center text-xl text-white ${meta.tone}`}
            >
              <Icon />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[var(--app-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--app-accent)]">
              {meta.label}
            </span>
            {preview.badge ? (
              <span className="text-[10px] font-semibold text-[var(--app-text-muted)]">
                {preview.badge}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 truncate text-sm font-black text-[var(--app-text)] sm:text-base">
            {preview.title}
          </h3>
          {preview.subtitle ? (
            <p className="mt-0.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
              {preview.subtitle}
            </p>
          ) : null}
          {preview.details?.length ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--app-text-muted)]">
              {preview.details.join(' · ')}
            </p>
          ) : null}
        </div>
        <span className="grid size-9 shrink-0 place-items-center self-center rounded-xl border border-[var(--app-border)] text-[var(--app-text-muted)] transition group-hover:border-brand-200 group-hover:bg-[var(--app-accent-soft)] group-hover:text-brand-700">
          <FiExternalLink />
        </span>
      </div>
      <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 px-3 py-2 text-center text-[11px] font-semibold text-[var(--app-text-muted)] sm:px-4">
        Sujet de cette conversation — ouvrir la fiche
      </div>
    </Link>
  )
}
