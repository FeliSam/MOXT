import { useMemo } from 'react'
import {
  FiBell,
  FiBriefcase,
  FiExternalLink,
  FiShoppingBag,
  FiStar,
  FiUsers,
  FiVolumeX,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DetailSection } from '../../components/ui/DetailBlocks'
import { useLanguage } from '../../contexts/useLanguage'
import { ANNOUNCEMENT_CONTENT_TYPES } from '@moxt/shared/utils/subscriptionUtils.js'
import { SubscribersPanel } from '../../features/account/SubscribersPanel'
import {
  selectPublisherBans,
  selectPublisherSubscribers,
} from '../../features/account/subscriptionSelectors'
import { professionalText } from '../../features/businesses/professionalI18n'

const CONTENT_LABEL_KEYS = {
  listing: 'professional.subscriptions.content.listing',
  parcel: 'professional.subscriptions.content.parcel',
  job: 'professional.subscriptions.content.job',
  event: 'professional.subscriptions.content.event',
  post: 'professional.subscriptions.content.post',
}

const PREF_META = [
  {
    key: 'all',
    icon: FiBell,
    tone: 'text-brand-700 dark:text-brand-300',
    labelKey: 'professional.subscriptions.notifyLabel.all',
    hintKey: 'professional.subscriptions.notifyHint.all',
  },
  {
    key: 'important',
    icon: FiStar,
    tone: 'text-amber-600 dark:text-amber-300',
    labelKey: 'professional.subscriptions.notifyLabel.important',
    hintKey: 'professional.subscriptions.notifyHint.important',
  },
  {
    key: 'muted',
    icon: FiVolumeX,
    tone: 'text-[var(--app-text-muted)]',
    labelKey: 'professional.subscriptions.notifyLabel.muted',
    hintKey: 'professional.subscriptions.notifyHint.muted',
  },
]

export function SubscriptionsPanel({ business, enabledServices = [] }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const subscribers = useSelector((state) =>
    selectPublisherSubscribers(state, 'business', business.id),
  )
  const bans = useSelector((state) => selectPublisherBans(state, 'business', business.id))
  const publisherPath = `/businesses/${business.id}`

  const stats = useMemo(() => {
    const byPref = { all: 0, important: 0, muted: 0 }
    for (const item of subscribers) {
      const pref = item.notifyPref || 'all'
      if (byPref[pref] !== undefined) byPref[pref] += 1
    }
    return {
      total: subscribers.length,
      banned: bans.length,
      byPref,
    }
  }, [bans.length, subscribers])

  const coveredTypes = useMemo(() => {
    const types = new Set(ANNOUNCEMENT_CONTENT_TYPES)
    if (!enabledServices.includes('Marketplace')) types.delete('listing')
    if (!enabledServices.includes('Colis')) types.delete('parcel')
    if (!enabledServices.includes('Jobs')) types.delete('job')
    if (!enabledServices.includes('Events')) types.delete('event')
    return [...types]
  }, [enabledServices])

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiUsers} label={pt('professional.subscriptions.stat.active')} value={stats.total} />
        <StatCard icon={FiBell} label={pt('professional.subscriptions.stat.fullNotify')} value={stats.byPref.all} />
        <StatCard
          icon={FiStar}
          label={pt('professional.subscriptions.stat.importantOnly')}
          value={stats.byPref.important}
        />
        <StatCard icon={FiVolumeX} label={pt('professional.subscriptions.stat.muted')} value={stats.byPref.muted} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <DetailSection title={pt('professional.subscriptions.howTitle')}>
          <p className="text-sm leading-7 text-[var(--app-text-muted)]">
            {pt('professional.subscriptions.howBody', { name: business.name })}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {coveredTypes.map((type) => (
              <li
                key={type}
                className="flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5 text-sm"
              >
                <FiShoppingBag className="shrink-0 text-brand-600" aria-hidden />
                {CONTENT_LABEL_KEYS[type] ? pt(CONTENT_LABEL_KEYS[type]) : type}
              </li>
            ))}
          </ul>
        </DetailSection>

        <Card className="grid gap-4">
          <h3 className="font-black">{pt('professional.subscriptions.notifyPrefs')}</h3>
          <div className="grid gap-3">
            {PREF_META.map(({ key, icon: Icon, tone, labelKey, hintKey }) => (
              <div
                key={key}
                className="flex items-start gap-3 rounded-xl border border-[var(--app-border)] p-3"
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] ${tone}`}>
                  <Icon aria-hidden />
                </span>
                <div className="min-w-0">
                  <strong className="block text-sm">{pt(labelKey)}</strong>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--app-text-muted)]">
                    {pt(hintKey)}
                  </p>
                  <p className="mt-1 text-xs font-bold tabular-nums text-brand-700 dark:text-brand-300">
                    {pt('professional.subscriptions.subscriberCount', { count: stats.byPref[key] })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-black">
            <FiBriefcase className="text-brand-600" />
            {pt('professional.subscriptions.publicCardTitle')}
          </h3>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {pt('professional.subscriptions.publicCardBody')}
          </p>
        </div>
        <Link to={publisherPath}>
          <Button variant="secondary" icon={FiExternalLink}>
            {pt('professional.subscriptions.viewCard')}
          </Button>
        </Link>
      </Card>

      <DetailSection title={pt('professional.subscriptions.yourSubscribers')}>
        <SubscribersPanel
          publisherType="business"
          publisherId={business.id}
          publisherName={business.name}
          publisherPath={publisherPath}
        />
      </DetailSection>

      {stats.banned ? (
        <p className="text-xs text-[var(--app-text-muted)]">
          {pt('professional.subscriptions.bannedCount', { count: stats.banned })}
        </p>
      ) : null}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
        <Icon aria-hidden />
      </span>
      <div>
        <strong className="block text-2xl tabular-nums">{value}</strong>
        <span className="text-xs text-[var(--app-text-muted)]">{label}</span>
      </div>
    </Card>
  )
}
