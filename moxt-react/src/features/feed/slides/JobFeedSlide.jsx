import { FiBriefcase, FiMapPin } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { formatJobLocationLabel, formatJobSalaryLabel, jobContractLabel } from '../../jobs/jobDisplayUtils'
import { phase3Text } from '../../../i18n/phase3I18n'
import { FeedNeutralCard, FeedNeutralPanel, FeedNeutralPill, FeedNeutralRow } from '../FeedNeutralPanel'
import { FeedSlideShell } from '../FeedSlideShell'

export function JobFeedSlide({ item, index, active = true }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const job = item.source || {}
  const salary = formatJobSalaryLabel(job)
  const contract = job.contractType ? jobContractLabel(t, job.contractType) : ''
  const location = formatJobLocationLabel(job, t) || item.stats?.city || job.city || ''
  const cover = item.media?.poster || item.media?.images?.[0] || ''

  return (
    <FeedSlideShell
      index={index}
      item={item}
      publisher={item.publisher}
      title={item.title}
      caption={item.caption}
      captionLines={2}
      active={active}
      ctaLabel={p3('feed.cta.job')}
      ctaTo={item.href}
    >
      <FeedNeutralPanel gradient="from-emerald-700 via-teal-800 to-slate-950" cover={cover} bucket="listings">
        <FeedNeutralCard
          eyebrow={p3('feed.kind.job')}
          badges={
            <>
              {salary ? <FeedNeutralPill tone="light">{salary}</FeedNeutralPill> : null}
              {contract ? <FeedNeutralPill>{contract}</FeedNeutralPill> : null}
            </>
          }
        >
          <div className="mt-3 grid gap-3">
            <FeedNeutralRow
              icon={FiBriefcase}
              iconClass="bg-emerald-400/20 text-emerald-100 ring-emerald-300/30"
              label={p3('feed.job.role')}
              value={item.title}
            />
            <FeedNeutralRow
              icon={FiMapPin}
              iconClass="bg-teal-400/20 text-teal-100 ring-teal-300/30"
              label={p3('feed.job.place')}
              value={location}
            />
          </div>
        </FeedNeutralCard>
      </FeedNeutralPanel>
    </FeedSlideShell>
  )
}
