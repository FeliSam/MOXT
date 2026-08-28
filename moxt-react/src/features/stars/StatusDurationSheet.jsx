import { useLanguage } from '../../contexts/useLanguage'
import { DEFAULT_QUOTA_CONFIG } from './starsConfig'
import { resolveStarsActionCost } from './starsPricing'
import { useStarsModuleEnabled } from './useStarsModuleEnabled'

const KEYS = [
  { id: '24h', labelKey: 'stars.duration24h' },
  { id: '3d', labelKey: 'stars.duration3d' },
  { id: '7d', labelKey: 'stars.duration7d' },
]

export function StatusDurationSheet({
  value,
  onChange,
  config = DEFAULT_QUOTA_CONFIG,
  enforced = false,
}) {
  const { t } = useLanguage()
  const starsEnabled = useStarsModuleEnabled()

  if (!starsEnabled) return null

  return (
    <div className="grid gap-2">
      <p className="text-xs font-bold text-[var(--app-text-muted)]">{t('stars.statusDuration')}</p>
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-[var(--app-surface-muted)] p-1">
        {KEYS.map((item) => {
          const cost = resolveStarsActionCost({
            category: 'status',
            durationKey: item.id,
            config,
          })
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`rounded-xl px-2 py-2 text-center text-[11px] font-bold transition ${
                value === item.id
                  ? 'bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm'
                  : 'text-[var(--app-text-muted)]'
              }`}
            >
              <span className="block">{t(item.labelKey)}</span>
              <span className="mt-0.5 block text-[10px] font-semibold tabular-nums text-brand-700">
                {t('stars.formulas.costStars', { n: cost })}
              </span>
            </button>
          )
        })}
      </div>
      {!enforced ? (
        <p className="text-[10px] text-[var(--app-text-faint)]">{t('stars.comingSoon')}</p>
      ) : null}
    </div>
  )
}
