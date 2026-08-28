import { FiCalendar, FiMapPin } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { phase3Text } from '../../../i18n/phase3I18n'
import { FeedNeutralCard, FeedNeutralPanel, FeedNeutralPill, FeedNeutralRow } from '../FeedNeutralPanel'
import { FeedSlideShell } from '../FeedSlideShell'

function formatEventWhen(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  try {
    return new Intl.DateTimeFormat(language || 'fr', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return String(value)
  }
}

export function EventFeedSlide({ item, index, active = true }) {
  const { t, language } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const event = item.source || {}
  const when = formatEventWhen(item.stats?.startAt || event.startAt, language)
  const place = [event.venue, item.stats?.city || event.city].filter(Boolean).join(' · ')
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
      ctaLabel={p3('feed.cta.event')}
      ctaTo={item.href}
    >
      <FeedNeutralPanel gradient="from-violet-700 via-purple-800 to-slate-950" cover={cover} bucket="listings">
        <FeedNeutralCard
          eyebrow={p3('feed.kind.event')}
          badges={when ? <FeedNeutralPill tone="light">{when}</FeedNeutralPill> : null}
        >
          <div className="mt-3 grid gap-3">
            <FeedNeutralRow
              icon={FiCalendar}
              iconClass="bg-violet-400/20 text-violet-100 ring-violet-300/30"
              label={p3('feed.event.when')}
              value={when || item.title}
            />
            <FeedNeutralRow
              icon={FiMapPin}
              iconClass="bg-fuchsia-400/20 text-fuchsia-100 ring-fuchsia-300/30"
              label={p3('feed.event.place')}
              value={place}
            />
          </div>
        </FeedNeutralCard>
      </FeedNeutralPanel>
    </FeedSlideShell>
  )
}
