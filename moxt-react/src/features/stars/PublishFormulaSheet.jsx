import { FiStar, FiTrendingUp, FiZap } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { DEFAULT_QUOTA_CONFIG } from './starsConfig'
import { PUBLISH_FORMULAS, resolveStarsActionCost } from './starsPricing'

const FORMULA_UI = {
  standard: { icon: FiStar, accent: 'border-[var(--app-border)]' },
  featured_24h: { icon: FiTrendingUp, accent: 'border-brand-400/50 ring-1 ring-brand-400/20' },
  featured_7d: { icon: FiZap, accent: 'border-amber-400/50 ring-1 ring-amber-400/20' },
}

export function PublishFormulaSheet({
  category,
  value = 'standard',
  onChange,
  enforced: _enforced = false,
  config = DEFAULT_QUOTA_CONFIG,
}) {
  const { t } = useLanguage()
  if (category === 'status') return null

  return (
    <div className="grid gap-2">
      <p className="text-xs font-bold text-[var(--app-text-muted)]">{t('stars.formulas.title')}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {PUBLISH_FORMULAS.map((formulaKey) => {
          const meta = FORMULA_UI[formulaKey] || FORMULA_UI.standard
          const Icon = meta.icon
          const cost = resolveStarsActionCost({ category, formulaKey, config })
          const selected = value === formulaKey
          return (
            <button
              key={formulaKey}
              type="button"
              onClick={() => onChange?.(formulaKey)}
              className={`rounded-2xl border bg-[var(--app-surface)] p-3 text-left transition ${
                selected
                  ? `${meta.accent} shadow-[var(--shadow-card)]`
                  : 'border-[var(--app-border)]/70 hover:border-[var(--app-border)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`grid size-8 place-items-center rounded-xl ${
                    selected ? 'bg-brand-500/15 text-brand-700' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                  }`}
                >
                  <Icon aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-black">{t(`stars.formulas.${formulaKey}`)}</span>
                  <span className="mt-0.5 block text-[11px] font-bold tabular-nums text-brand-700">
                    {t('stars.formulas.costStars', { n: cost })}
                  </span>
                </span>
              </span>
              <p className="mt-2 text-[10px] leading-snug text-[var(--app-text-faint)]">
                {t(`stars.formulas.${formulaKey}Desc`)}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
