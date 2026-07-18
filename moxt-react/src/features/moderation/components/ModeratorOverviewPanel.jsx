import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiEdit3,
  FiLayers,
  FiStar,
} from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { CARD, CONTENT_SECTIONS, ITEM } from '../../admin/adminConfig'
import { adminOptionLabel, adminText } from '../../admin/adminI18n'
import { Empty, SectionTitle } from '../../admin/components/AdminShared'
import { moderationQueuesUrgent } from '../moderationConfig'
import { moderationText } from '../moderationI18n'

export function ModeratorOverviewPanel({
  content,
  metrics,
  onOpenContent,
  onOpenView,
  queues,
  setSelected,
}) {
  const { t } = useLanguage()
  const urgent = moderationQueuesUrgent(queues)

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            key: 'content',
            icon: FiLayers,
            label: moderationText(t, 'moderation.overview.actions.content.label'),
            value: moderationText(t, 'moderation.overview.actions.content.value', {
              count: metrics.content.pending,
            }),
            color: 'from-violet-600 to-purple-500',
          },
          {
            key: 'publications',
            icon: FiEdit3,
            label: moderationText(t, 'moderation.overview.actions.publications.label'),
            value: moderationText(t, 'moderation.overview.actions.publications.value', {
              count: metrics.posts.pending,
            }),
            color: 'from-sky-600 to-cyan-500',
          },
          {
            key: 'queues',
            icon: FiAlertTriangle,
            label: moderationText(t, 'moderation.overview.actions.queues.label'),
            value: moderationText(t, 'moderation.overview.actions.queues.value', {
              count: urgent,
            }),
            color: 'from-amber-500 to-orange-500',
          },
        ].map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => onOpenView(action.key)}
            className="text-left"
          >
            <div
              className={`${CARD} group relative h-full overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(15_23_42/0.1)]`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-[0.06] transition-opacity group-hover:opacity-[0.10]`}
              />
              <div className="relative">
                <span
                  className={`inline-grid size-10 place-items-center rounded-xl bg-gradient-to-br ${action.color} text-white shadow-sm`}
                >
                  <action.icon className="text-sm" />
                </span>
                <strong className="mt-3 block text-xl font-black">{action.value}</strong>
                <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[var(--app-text-muted)]">
                  {action.label}{' '}
                  <FiArrowRight className="text-xs opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className={`${CARD} p-5 grid gap-4`}>
        <SectionTitle
          icon={FiLayers}
          label={moderationText(t, 'moderation.overview.modulesTitle')}
          count={metrics.content.total}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {CONTENT_SECTIONS.map((section) => {
            const count = content[section.id]?.length || 0
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onOpenContent(section.id)}
                className={`${ITEM} text-left`}
              >
                <span className={`inline-grid size-9 place-items-center rounded-xl ${section.color}`}>
                  <section.icon className="text-sm" />
                </span>
                <strong className="mt-2.5 block text-sm">{adminOptionLabel(t, section)}</strong>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                  {adminText(t, 'admin.overview.elementCount', { count })}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${CARD} p-5 grid gap-4`}>
          <SectionTitle
            icon={FiAlertCircle}
            label={moderationText(t, 'moderation.overview.openReports')}
            count={queues.reports.length}
            action={
              <button
                type="button"
                onClick={() => onOpenView('queues')}
                className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
              >
                {moderationText(t, 'moderation.overview.viewQueues')}{' '}
                <FiArrowRight className="text-xs" />
              </button>
            }
          />
          <div className="grid gap-2">
            {queues.reports.length ? (
              queues.reports.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected({ kind: 'report', item })}
                  className={`${ITEM} text-left`}
                >
                  <strong className="block truncate text-sm">
                    {item.reason || item.reportType || item.id}
                  </strong>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">
                    {item.reportType} · {item.relatedId}
                  </p>
                </button>
              ))
            ) : (
              <Empty
                label={moderationText(t, 'moderation.overview.noReports')}
                icon={FiAlertCircle}
              />
            )}
          </div>
        </div>

        <div className={`${CARD} p-5 grid gap-4`}>
          <SectionTitle
            icon={FiStar}
            label={moderationText(t, 'moderation.overview.contestedReviews')}
            count={queues.contestedReviews.length}
          />
          <div className="grid gap-2">
            {queues.contestedReviews.length ? (
              queues.contestedReviews.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected({ kind: 'contestedReview', item })}
                  className={`${ITEM} text-left`}
                >
                  <strong className="block truncate text-sm">
                    {item.comment || item.authorName || item.id}
                  </strong>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">
                    {item.targetType} · {item.authorName || item.authorId}
                  </p>
                </button>
              ))
            ) : (
              <Empty
                label={moderationText(t, 'moderation.overview.noContests')}
                icon={FiStar}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
