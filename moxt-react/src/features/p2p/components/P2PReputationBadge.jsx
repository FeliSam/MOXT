import { FiStar } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { computeP2PReputation } from '../p2pUtils'

export function P2PReputationBadge({ userId, orders, reviews, className = '' }) {
  const { t } = useLanguage()
  const stats = computeP2PReputation(userId, { orders, reviews })
  if (!userId) return null

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--app-text-muted)] ${className}`}
    >
      {stats.avgRating != null ? (
        <span className="inline-flex items-center gap-1 font-bold text-[var(--app-text)]">
          <FiStar className="text-amber-500" aria-hidden />
          {stats.avgRating}
          <span className="font-medium text-[var(--app-text-faint)]">({stats.ratingCount})</span>
        </span>
      ) : (
        <span>{t('p2p.reputation.noRating')}</span>
      )}
      <span>
        {t('p2p.reputation.completed', { count: stats.completed })}
      </span>
      {stats.successRate != null ? (
        <span>{t('p2p.reputation.successRate', { rate: stats.successRate })}</span>
      ) : null}
    </div>
  )
}
