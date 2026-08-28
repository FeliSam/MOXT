import { useMemo } from 'react'
import { FiBell, FiExternalLink, FiStar, FiUser, FiUsers, FiVolumeX } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { PillBadge, VerifiedDisplayName } from '../../components/ui/Badge'
import { RevealListItem } from '../../components/ui/RevealListItem'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { AvatarStack, EntityAvatar } from './EntityAvatar'
import { SubscriptionNotifyMenu } from './SubscriptionNotifyMenu'
import { useProfileAvatarMap } from './useProfileAvatarMap'
import { usePublicationProfile } from '../publications/usePublicationProfile'
import { selectBusinessById } from '../businesses/businessSelectors'

const NOTIFY_LABEL_KEYS = {
  all: 'subscriptions.notify.all',
  important: 'subscriptions.notify.important',
  muted: 'subscriptions.notify.muted',
}

function notifyPrefLabel(p3, pref) {
  const key = NOTIFY_LABEL_KEYS[pref]
  return key ? p3(key) : pref
}

export function SubscriptionsFollowingPanel({ subscriptions, onPrefChange, onUnsubscribe }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const businesses = useSelector((state) => state.businesses.items || [])

  const grouped = useMemo(() => {
    const users = subscriptions.filter((item) => item.publisherType === 'user')
    const businessItems = subscriptions.filter((item) => item.publisherType === 'business')
    return { users, businesses: businessItems }
  }, [subscriptions])

  const followingUserIds = useMemo(
    () => grouped.users.map((item) => item.publisherId).filter(Boolean),
    [grouped.users],
  )
  const followingAvatarMap = useProfileAvatarMap(followingUserIds)

  const stackItems = useMemo(() => {
    const items = []
    for (const item of grouped.users) {
      const entry = followingAvatarMap[item.publisherId]
      items.push({
        id: item.id,
        name: entry?.name || item.publisherName || p3('common.member'),
        src: entry?.avatarUrl || null,
        shape: 'user',
      })
    }
    for (const item of grouped.businesses) {
      const business = businesses.find((row) => row.id === item.publisherId)
      items.push({
        id: item.id,
        name: item.publisherName || business?.name || p3('common.business'),
        src: business?.logoUrl || null,
        shape: 'business',
      })
    }
    return items
  }, [businesses, followingAvatarMap, grouped.businesses, grouped.users, p3])

  if (!subscriptions.length) {
    return (
      <EmptyState
        icon={FiUsers}
        tone="warm"
        title={p3('subscriptions.empty.title')}
        description={p3('subscriptions.empty.description')}
        action={
          <Link to="/businesses">
            <Button variant="secondary">{p3('subscriptions.empty.cta')}</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-5">
      {stackItems.length ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]/80 px-4 py-3 sm:hidden">
          <AvatarStack items={stackItems} max={5} size="sm" />
          <p className="min-w-0 text-xs text-[var(--app-text-muted)]">
            {p3('subscriptions.circleLabel')}
          </p>
        </div>
      ) : null}

      <SubscriptionGroup
        title={p3('subscriptions.group.members')}
        icon={FiUser}
        items={grouped.users}
        kind="user"
        onPrefChange={onPrefChange}
        onUnsubscribe={onUnsubscribe}
      />

      <SubscriptionGroup
        title={p3('subscriptions.group.businesses')}
        icon={HiOutlineBuildingOffice2}
        items={grouped.businesses}
        kind="business"
        onPrefChange={onPrefChange}
        onUnsubscribe={onUnsubscribe}
      />
    </div>
  )
}

function SubscriptionGroup({ title, icon: Icon, items, kind, onPrefChange, onUnsubscribe }) {
  if (!items.length) return null

  return (
    <section className="overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--app-border)] bg-gradient-to-r from-brand-50/40 to-transparent px-4 py-3 dark:from-brand-950/25 sm:px-5">
        <Icon className="text-brand-700 dark:text-brand-300" aria-hidden />
        <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
          {title}
        </h2>
        <span className="ml-auto rounded-full bg-[var(--app-surface-muted)] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[var(--app-text)]">
          {items.length}
        </span>
      </div>

      <ul className="divide-y divide-[var(--app-border)]">
        {items.map((item, index) => (
          <li key={item.id}>
            <RevealListItem index={index}>
              <FollowingRow
                item={item}
                kind={kind}
                onPrefChange={onPrefChange}
                onUnsubscribe={onUnsubscribe}
              />
            </RevealListItem>
          </li>
        ))}
      </ul>
    </section>
  )
}

function FollowingRow({ item, kind, onPrefChange, onUnsubscribe }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    kind === 'business' ? selectBusinessById(state, item.publisherId) : null,
  )
  const { profile } = usePublicationProfile(kind === 'user' ? item.publisherId : null, user)

  const displayName =
    kind === 'user'
      ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
        item.publisherName ||
        p3('common.memberMoxt')
      : item.publisherName || business?.name || p3('common.business')

  const avatarSrc = kind === 'user' ? profile?.avatarUrl : business?.logoUrl
  const profilePath =
    item.publisherPath ||
    (kind === 'user' ? `/users/${item.publisherId}/publications` : `/businesses/${item.publisherId}`)
  const prefLabel = notifyPrefLabel(p3, item.notifyPref)

  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--app-surface-muted)]/55 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to={profilePath}
          className="shrink-0 transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          aria-label={p3('subscriptions.viewAria', { name: displayName })}
        >
          <EntityAvatar
            name={displayName}
            src={avatarSrc}
            size="md"
            shape={kind === 'business' ? 'business' : 'user'}
          />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {kind === 'user' ? (
              <VerifiedDisplayName
                as="strong"
                name={displayName}
                verified={Boolean(profile?.verified)}
                iconSize="sm"
                className="truncate text-[15px] leading-5"
              />
            ) : (
              <strong className="truncate text-[15px] leading-5">{displayName}</strong>
            )}
            <PillBadge tone="info">{prefLabel || item.notifyPref}</PillBadge>
          </div>
          <p className="mt-0.5 text-xs leading-4 text-[var(--app-text-muted)] sm:text-sm sm:leading-5">
            {kind === 'business'
              ? p3('subscriptions.row.businessBlurb')
              : p3('subscriptions.row.userBlurb')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-14 sm:pl-0">
        <Link to={profilePath}>
          <Button size="sm" variant="secondary" icon={FiExternalLink}>
            {p3('common.view')}
          </Button>
        </Link>
        <SubscriptionNotifyMenu
          activePref={item.notifyPref}
          isSubscribed
          onSelect={(pref) => onPrefChange(item, pref)}
          onUnsubscribe={() => onUnsubscribe(item)}
          trigger={
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={
                item.notifyPref === 'muted'
                  ? FiVolumeX
                  : item.notifyPref === 'important'
                    ? FiStar
                    : FiBell
              }
              aria-label={p3('subscriptions.notifyAria', { pref: prefLabel || item.notifyPref })}
              title={prefLabel || p3('common.notifications')}
              className="border border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)]"
            />
          }
        />
      </div>
    </div>
  )
}
