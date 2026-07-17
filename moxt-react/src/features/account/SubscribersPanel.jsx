import { useMemo } from 'react'
import { FiBell, FiShield, FiUser } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { RevealListItem } from '../../components/ui/RevealListItem'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { selectPublisherBans, selectPublisherSubscribers } from './subscriptionSelectors'
import { SubscriberRow } from './SubscriberRow'
import { unbanPublisherSubscriber } from './accountSlice'
import { usePublicationProfile } from '../publications/usePublicationProfile'
import { AvatarStack, EntityAvatar } from './EntityAvatar'
import { useProfileAvatarMap } from './useProfileAvatarMap'

function BannedSubscriberRow({ ban, onUnban }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const { profile } = usePublicationProfile(ban.subscriberId, user)
  const displayName =
    `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || p3('common.memberMoxt')

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200/60 bg-red-50/40 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
      <div className="flex min-w-0 items-center gap-3">
        <EntityAvatar name={displayName} src={profile?.avatarUrl} size="sm" shape="user" ring={false} />
        <div className="min-w-0">
          <strong className="block truncate text-sm">{displayName}</strong>
          <p className="text-xs text-[var(--app-text-muted)]">
            {p3('subscriptions.subscribers.bannedOn', {
              date: new Date(ban.createdAt).toLocaleDateString('fr-FR'),
            })}
            {ban.reason ? ` — ${ban.reason}` : ''}
          </p>
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={() => onUnban(ban)}>
        {p3('subscriptions.subscribers.unban')}
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
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const subscribers = useSelector((state) =>
    selectPublisherSubscribers(state, publisherType, publisherId),
  )
  const bans = useSelector((state) => selectPublisherBans(state, publisherType, publisherId))

  const subscriberIds = useMemo(
    () => subscribers.map((item) => item.userId || item.subscriberId).filter(Boolean),
    [subscribers],
  )
  const avatarMap = useProfileAvatarMap(subscriberIds)
  const stackItems = useMemo(
    () =>
      subscribers.slice(0, 8).map((item) => {
        const id = item.userId || item.subscriberId
        const entry = avatarMap[id]
        return {
          id,
          name: entry?.name || p3('common.member'),
          src: entry?.avatarUrl || null,
          shape: 'user',
        }
      }),
    [avatarMap, subscribers, t],
  )

  if (!subscribers.length && !bans.length) {
    return (
      <EmptyState
        icon={FiBell}
        tone="warm"
        title={p3('subscriptions.subscribers.empty')}
        description={
          publisherName
            ? p3('subscriptions.subscribers.emptyNamed', { name: publisherName })
            : p3('subscriptions.subscribers.emptySelf')
        }
      />
    )
  }

  return (
    <div className="grid gap-5">
      {subscribers.length ? (
        <section className="overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] bg-gradient-to-r from-brand-50/50 to-transparent px-4 py-3 dark:from-brand-950/30 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[var(--app-text)]">
                {subscribers.length > 1
                  ? p3('subscriptions.subscribers.countPlural', { count: subscribers.length })
                  : p3('subscriptions.subscribers.count', { count: subscribers.length })}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                {p3('subscriptions.subscribers.manageHint')}
              </p>
            </div>
            <AvatarStack items={stackItems} max={5} size="sm" />
          </div>

          <ul className="divide-y divide-[var(--app-border)]">
            {subscribers.map((subscriber, index) => (
              <li key={subscriber.id}>
                <RevealListItem index={index}>
                  <div className="px-4 py-3.5 transition-colors hover:bg-[var(--app-surface-muted)]/60 sm:px-5">
                    <SubscriberRow
                      subscriber={subscriber}
                      publisherType={publisherType}
                      publisherId={publisherId}
                      publisherName={publisherName}
                      publisherPath={publisherPath}
                    />
                  </div>
                </RevealListItem>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bans.length ? (
        <section className="grid gap-3">
          <div className="flex items-center gap-2">
            <FiShield className="text-red-600" />
            <h3 className="text-sm font-semibold">
              {p3('subscriptions.subscribers.bannedHeading', { count: bans.length })}
            </h3>
          </div>
          <p className="text-xs text-[var(--app-text-muted)]">
            {p3('subscriptions.subscribers.bannedHint')}
          </p>
          {bans.map((ban, index) => (
            <RevealListItem key={ban.id} index={index}>
              <BannedSubscriberRow
                ban={ban}
                onUnban={(item) => dispatch(unbanPublisherSubscriber({ id: item.id }))}
              />
            </RevealListItem>
          ))}
        </section>
      ) : null}

      {!subscribers.length && bans.length ? (
        <EmptyState
          icon={FiUser}
          title={p3('subscriptions.subscribers.emptyActive')}
          description={p3('subscriptions.subscribers.emptyActiveDesc')}
        />
      ) : null}
    </div>
  )
}
