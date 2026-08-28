import { FiEdit3, FiPlus } from 'react-icons/fi'
import { headerIslandClass } from '../../components/ui/PageHeader'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'

export function NewsFeedHeader({ user, onAddStatus, onWritePost }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)

  return (
    <header className="flex min-w-0 max-w-full flex-col gap-4 overflow-visible rounded-[var(--radius-card-lg)] border-0 bg-[var(--app-surface)]/80 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:gap-5 sm:p-7">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="font-display min-w-0 break-words text-xl font-extrabold tracking-[-0.02em] text-[var(--app-text)] sm:text-4xl">
          {p3('news.title')}
        </h1>
        {user ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onAddStatus}
              aria-label={t('status.rail.addYours')}
              className="btn-press inline-flex shrink-0 items-center gap-2.5 text-sm font-semibold text-[var(--app-text)]"
            >
              <span className={headerIslandClass}>
                <FiPlus className="text-base" aria-hidden="true" />
              </span>
              <span className="hidden sm:inline">{p3('news.addStatus')}</span>
            </button>
            <button
              type="button"
              onClick={onWritePost}
              aria-label={p3('news.writePost')}
              className="btn-press inline-flex shrink-0 items-center gap-2.5 text-sm font-semibold text-[var(--app-text)]"
            >
              <span className={headerIslandClass}>
                <FiEdit3 className="text-base" aria-hidden="true" />
              </span>
              <span className="hidden sm:inline">{p3('news.writePost')}</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
