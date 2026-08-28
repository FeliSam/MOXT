import { FiTrendingUp } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'

export function FeedTrendBadge({ className = '' }) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-sky-400/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-950 shadow-sm ${className}`}
    >
      <FiTrendingUp aria-hidden />
      {p3('feed.trending')}
    </span>
  )
}

export function FeedPromoBadge({ className = '' }) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-rose-400/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-950 shadow-sm ${className}`}
    >
      {p3('feed.promo')}
    </span>
  )
}
