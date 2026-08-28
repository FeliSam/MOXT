import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { NEWS_FILTER_KEYS } from './newsConfig'

export function NewsFilterTabs({ activeFilter, onChange }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)

  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-[var(--app-border)] scrollbar-hidden">
      {NEWS_FILTER_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`relative shrink-0 pb-3 text-sm font-bold transition-colors ${
            activeFilter === key
              ? 'text-[var(--app-text)]'
              : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          {p3(`news.filters.${key}`)}
          {activeFilter === key ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
          ) : null}
        </button>
      ))}
    </div>
  )
}
