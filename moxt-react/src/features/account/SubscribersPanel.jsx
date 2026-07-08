import { FiBell, FiShield, FiUser } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { selectPublisherBans, selectPublisherSubscribers } from './subscriptionSelectors'
import { SubscriberRow } from './SubscriberRow'
import { unbanPublisherSubscriber } from './accountSlice'
import { usePublicationProfile } from '../publications/usePublicationProfile'

function BannedSubscriberRow({ ban, publisherType, publisherId, onUnban }) {
  const user = useSelector((state) => state.auth.user)
  const { profile } = usePublicationProfile(ban.subscriberId, user)
  const displayName =
    `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Membre MOXT'

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200/60 bg-red-50/40 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
      <div className="min-w-0">
        <strong className="block truncate text-sm">{displayName}</strong>
        <p className="text-xs text-[var(--app-text-muted)]">
          Banni le {new Date(ban.createdAt).toLocaleDateString('fr-FR')}
          {ban.reason ? ` — ${ban.reason}` : ''}
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={() => onUnban(ban)}>
        Lever le ban
      </Button>
    </div>
  )
}

export function SubscribersPanel({
  publisherType,
  publisherId,
  publisherName,
  publisherPath,
}) {
  const dispatch = useDispatch()
  const subscribers = useSelector((state) =>
    selectPublisherSubscribers(state, publisherType, publisherId),
  )
  const bans = useSelector((state) => selectPublisherBans(state, publisherType, publisherId))

  if (!subscribers.length && !bans.length) {
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
    <div className="grid gap-5">
      {subscribers.length ? (
        <div className="grid gap-3">
          <p className="text-sm text-[var(--app-text-muted)]">
            {subscribers.length} abonné(s) — gérez les notifications, retraits, bannissements et
            signalements.
          </p>
          {subscribers.map((subscriber) => (
            <Card key={subscriber.id}>
              <SubscriberRow
                subscriber={subscriber}
                publisherType={publisherType}
                publisherId={publisherId}
                publisherName={publisherName}
                publisherPath={publisherPath}
              />
            </Card>
          ))}
        </div>
      ) : null}

      {bans.length ? (
        <section className="grid gap-3">
          <div className="flex items-center gap-2">
            <FiShield className="text-red-600" />
            <h3 className="text-sm font-semibold">Membres bannis ({bans.length})</h3>
          </div>
          <p className="text-xs text-[var(--app-text-muted)]">
            Ces membres ne peuvent plus s'abonner à vos publications.
          </p>
          {bans.map((ban) => (
            <BannedSubscriberRow
              key={ban.id}
              ban={ban}
              publisherType={publisherType}
              publisherId={publisherId}
              onUnban={(item) => dispatch(unbanPublisherSubscriber({ id: item.id }))}
            />
          ))}
        </section>
      ) : null}

      {!subscribers.length && bans.length ? (
        <EmptyState
          icon={FiUser}
          title="Aucun abonné actif"
          description="Tous vos abonnés actuels sont bannis ou ont été retirés."
        />
      ) : null}
    </div>
  )
}
