import { FiAlertTriangle, FiEdit3, FiLayers, FiZap } from 'react-icons/fi'
import { CARD } from '../../admin/adminConfig'
import { TrendChip } from '../../admin/components/AdminShared'
import { moderationQueuesUrgent } from '../moderationConfig'
import { moderationText } from '../moderationI18n'
import { useLanguage } from '../../../contexts/useLanguage'

export function ModeratorHeroKpiRow({ metrics, queues, onSelect }) {
  const { t } = useLanguage()
  const urgent = moderationQueuesUrgent(queues)
  const tiles = [
    {
      key: 'content',
      label: moderationText(t, 'moderation.kpi.content.label'),
      value: metrics.content.total,
      sub: moderationText(t, 'moderation.kpi.content.sub', { count: metrics.content.pending }),
      icon: FiLayers,
      trend: metrics.content.pending > 5 ? 'up' : 'stable',
      gradient: 'from-violet-600 to-purple-500',
    },
    {
      key: 'publications',
      label: moderationText(t, 'moderation.kpi.publications.label'),
      value: metrics.posts.total,
      sub: moderationText(t, 'moderation.kpi.publications.sub', { count: metrics.posts.pending }),
      icon: FiEdit3,
      trend: metrics.posts.pending > 0 ? 'up' : 'stable',
      gradient: 'from-sky-600 to-cyan-500',
    },
    {
      key: 'queues',
      label: moderationText(t, 'moderation.kpi.queues.label'),
      value: urgent,
      sub: moderationText(t, 'moderation.kpi.queues.sub', {
        count: (queues.reports?.length || 0) + (queues.contestedReviews?.length || 0),
      }),
      icon: FiZap,
      trend: urgent > 0 ? 'up' : 'stable',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      key: 'queues',
      id: 'reports',
      label: moderationText(t, 'moderation.kpi.reports.label'),
      value: queues.reports?.length || 0,
      sub: moderationText(t, 'moderation.kpi.reports.sub'),
      icon: FiAlertTriangle,
      trend: (queues.reports?.length || 0) > 0 ? 'up' : 'stable',
      gradient: 'from-rose-500 to-red-500',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <button
          key={tile.id || tile.key}
          type="button"
          onClick={() => onSelect(tile.key)}
          className="text-left"
        >
          <div
            className={`${CARD} group h-full p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(15_23_42/0.1)]`}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${tile.gradient} text-white`}
              >
                <tile.icon className="text-sm" />
              </span>
              <TrendChip trend={tile.trend} value={tile.sub} />
            </div>
            <strong className="mt-3 block text-2xl font-black">{tile.value}</strong>
            <p className="mt-0.5 text-xs font-bold text-[var(--app-text-muted)]">{tile.label}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
