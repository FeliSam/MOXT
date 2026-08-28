import { FiTrendingUp } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'

export function FeedBoostBadge({ boost, className = '' }) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  if (!boost) return null
  const formula = String(boost.formula_key || boost.formulaKey || '')
  const label =
    formula === 'featured_7d'
      ? p3('feed.featured7d')
      : formula === 'featured_3d'
        ? p3('feed.featured3d')
        : formula === 'featured_24h'
          ? p3('feed.featured24h')
          : p3('feed.featured')

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950 shadow-sm ${className}`}
    >
      <FiTrendingUp aria-hidden />
      {label}
    </span>
  )
}
