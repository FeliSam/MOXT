import { FiCornerUpLeft, FiExternalLink } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { RELATED_CONTENT_META } from '../../config/communications'
import { useLanguage } from '../../contexts/useLanguage'
import { messagesText } from '../../features/communications/messagesI18n'

export function RelatedContentPreview({
  preview,
  inline = false,
  onReply,
  contextId,
}) {
  const { t } = useLanguage()
  if (!preview?.path) return null

  const meta = RELATED_CONTENT_META[preview.type] || RELATED_CONTENT_META.general
  const Icon = meta.icon
  const canReply = Boolean(inline && onReply && contextId && preview.type !== 'profile' && preview.type !== 'general')
  const typeLabel = meta.labelKey ? messagesText(t, meta.labelKey) : meta.label
  const shellClass = inline ? 'mx-auto my-3 max-w-md' : 'mb-4'

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] ${shellClass}`}
      data-testid="related-content-preview"
    >
      <Link
        to={preview.path}
        className="group flex gap-3 p-3 text-left transition hover:bg-[var(--app-surface-muted)]/50 sm:gap-4 sm:p-4"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[var(--app-surface-muted)] sm:size-16">
          {preview.imageUrl ? (
            <img
              src={preview.imageUrl}
              alt=""
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span
              className={`grid size-full place-items-center text-lg text-white ${meta.tone}`}
            >
              <Icon />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-[var(--app-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--app-accent)]">
              {typeLabel}
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
        <span
          className="grid size-9 shrink-0 place-items-center self-center rounded-xl border border-[var(--app-border)] text-[var(--app-text-muted)] transition group-hover:border-brand-200 group-hover:bg-[var(--app-accent-soft)] group-hover:text-brand-700"
          aria-hidden="true"
        >
          <FiExternalLink />
        </span>
      </Link>
      {canReply ? (
        <div className="flex border-t border-[var(--app-border)]">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold text-[var(--app-accent)] transition hover:bg-[var(--app-accent-soft)]"
            onClick={() => onReply(contextId)}
          >
            <FiCornerUpLeft className="size-3.5" aria-hidden="true" />
            {t('messages.replyToListing')}
          </button>
        </div>
      ) : null}
    </article>
  )
}
