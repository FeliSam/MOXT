import { FiBell, FiUser } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PillBadge } from '../../components/ui/Badge'
import {
  SUBSCRIPTION_NOTIFY_LABELS,
} from '@moxt/shared/utils/subscriptionUtils.js'
import { selectPublisherSubscribers } from '../subscriptionSelectors'

export function SubscribersPanel({ publisherType, publisherId, publisherName }) {
  const subscribers = useSelector((state) =>
    selectPublisherSubscribers(state, publisherType, publisherId),
  )

  if (!subscribers.length) {
    return (
      <EmptyState
        icon={FiBell}
        title="Aucun abonné"
        description={
          publisherName
            ? `Les membres qui s'abonnent à ${publisherName} apparaîtront ici.`
            : 'Les membres qui vous suivent apparaîtront ici.'
        }
      />
    )
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-[var(--app-text-muted)]">
        {subscribers.length} abonné(s) — ils voient vos annonces en priorité selon leurs
        préférences.
      </p>
      {subscribers.map((subscriber) => (
        <Card key={subscriber.id} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiUser />
            </span>
            <div className="min-w-0">
              <strong className="block truncate">Abonné MOXT</strong>
              <span className="text-xs text-[var(--app-text-faint)]">
                Depuis {new Date(subscriber.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          <PillBadge tone={subscriber.notifyPref === 'muted' ? 'neutral' : 'success'}>
            {SUBSCRIPTION_NOTIFY_LABELS[subscriber.notifyPref] || subscriber.notifyPref}
          </PillBadge>
        </Card>
      ))}
    </div>
  )
}
