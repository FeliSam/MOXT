import { FiSearch, FiSliders, FiX } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { Button } from './Button'

export function CatalogSearch({
  advancedOpen,
  children,
  label,
  onClear,
  onQueryChange,
  onToggleAdvanced,
  placeholder,
  query,
  activeFilterCount = 0,
}) {
  const { t } = useLanguage()
  const searchLabel = label ?? t('catalog.search.label')
  const searchPlaceholder = placeholder ?? t('catalog.search.placeholder')

  return (
    <section className="rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-row items-center gap-2 sm:gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{searchLabel}</span>
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-text-faint)]" />
          <input
            aria-label={searchLabel}
            className="min-h-13 w-full rounded-[var(--radius-input)] bg-[var(--app-surface-muted)] pl-11 pr-12 text-sm outline-none transition duration-[var(--transition-fast)] focus:bg-[var(--app-surface)] focus:shadow-[0_0_0_3px_rgba(18,191,163,0.14)]"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface)]"
              aria-label={t('catalog.search.clearSearch')}
              onClick={onClear}
            >
              <FiX />
            </button>
          ) : null}
        </label>
        <Button
          variant={advancedOpen ? 'primary' : 'secondary'}
          icon={FiSliders}
          size="lg"
          onClick={onToggleAdvanced}
          aria-expanded={advancedOpen}
          aria-label={t('catalog.search.filters')}
          className={`relative shrink-0 !px-3.5 sm:!px-7 ${activeFilterCount === 0 ? 'max-sm:!gap-0' : ''}`}
        >
          <span className="hidden sm:inline">{t('catalog.search.filters')}</span>
          {activeFilterCount > 0 ? (
            <span
              className={`grid size-5 place-items-center rounded-full text-[10px] font-black ${
                advancedOpen ? 'bg-white/25 text-white' : 'bg-brand-700 text-white'
              }`}
            >
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </div>

      {advancedOpen ? (
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 motion-safe:animate-[fadeIn_180ms_ease-out] sm:mt-5 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                {t('catalog.search.advancedTitle')}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--app-text-faint)]">
                {t('catalog.search.advancedDescription')}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full bg-[var(--app-surface)] px-3 py-1.5 text-xs font-black text-brand-700 shadow-sm transition hover:text-brand-800 dark:text-brand-300"
              onClick={onClear}
            >
              {t('catalog.search.clearAll')}
            </button>
          </div>
          <div className="catalog-advanced-fields [&_input]:!border-[var(--app-border)] [&_input]:!bg-[var(--app-surface)] [&_input:focus]:!bg-[var(--app-surface)] [&_select]:!border-[var(--app-border)] [&_select]:!bg-[var(--app-surface)] [&_select:disabled]:!bg-[var(--app-surface)] [&_select:focus]:!bg-[var(--app-surface)]">
            {children}
          </div>
        </div>
      ) : null}
    </section>
  )
}
