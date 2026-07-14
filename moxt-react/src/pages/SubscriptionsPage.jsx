import { useMemo } from 'react'
import { FiBell, FiExternalLink, FiStar, FiUser, FiVolumeX } from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PillBadge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import { SUBSCRIPTION_NOTIFY_LABELS } from '@moxt/shared/utils/subscriptionUtils.js'
import {
  removePublisherSubscription,
  updatePublisherSubscriptionPref,
} from '../features/account/accountSlice'
import { SubscriptionNotifyMenu } from '../features/account/SubscriptionNotifyMenu'
import { SubscribersPanel } from '../features/account/SubscribersPanel'
import { selectPublisherSubscribers, selectUserSubscriptions } from '../features/account/subscriptionSelectors'

const TAB_ITEMS = [
  { value: 'following', label: 'Mes abonnements' },
  { value: 'subscribers', label: 'Mes abonnés' },
]

export function SubscriptionsPage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'subscribers' ? 'subscribers' : 'following'

  const subscriptions = useSelector((state) => selectUserSubscriptions(state, user.id))
  const subscribers = useSelector((state) => selectPublisherSubscribers(state, 'user', user.id))

  const grouped = useMemo(() => {
    const users = subscriptions.filter((item) => item.publisherType === 'user')
    const businesses = subscriptions.filter((item) => item.publisherType === 'business')
    return { users, businesses }
  }, [subscriptions])

  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Mon profil'
  const publisherPath = `/users/${user.id}/publications`

  function setActiveTab(tab) {
    if (tab === 'following') {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ tab }, { replace: true })
    }
  }

  const description =
    activeTab === 'subscribers'
      ? subscribers.length
        ? `${subscribers.length} membre(s) suivent vos annonces et publications.`
        : 'Les membres qui s’abonnent à votre profil apparaîtront ici.'
      : subscriptions.length
        ? `${subscriptions.length} abonnement(s) actif(s). Configurez les notifications pour chaque éditeur.`
        : 'Suivez des membres ou des entreprises pour voir leurs annonces en priorité.'

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Communauté"
        title="Abonnements"
        description={description}
        stats={
          activeTab === 'following'
            ? [
                { label: 'Membres', value: grouped.users.length },
                { label: 'Entreprises', value: grouped.businesses.length },
              ]
            : [{ label: 'Abonnés', value: subscribers.length }]
        }
      />

      <Tabs
        items={TAB_ITEMS}
        active={activeTab}
        onChange={setActiveTab}
        label="Type d’abonnement"
      />

      {activeTab === 'following' ? (
        <FollowingPanel
          grouped={grouped}
          subscriptions={subscriptions}
          userId={user.id}
          onPrefChange={(item, notifyPref) =>
            dispatch(
              updatePublisherSubscriptionPref({
                userId: user.id,
                publisherType: item.publisherType,
                publisherId: item.publisherId,
                notifyPref,
              }),
            )
          }
          onUnsubscribe={(item) =>
            dispatch(
              removePublisherSubscription({
                userId: user.id,
                publisherType: item.publisherType,
                publisherId: item.publisherId,
              }),
            )
          }
        />
      ) : (
        <SubscribersPanel
          publisherType="user"
          publisherId={user.id}
          publisherName={displayName}
          publisherPath={publisherPath}
        />
      )}
    </div>
  )
}

function FollowingPanel({ grouped, subscriptions, onPrefChange, onUnsubscribe }) {
  if (!subscriptions.length) {
    return (
      <EmptyState
        icon={FiBell}
        title="Aucun abonnement"
        description="Abonnez-vous depuis la page publications d'un membre ou la fiche d'une entreprise."
        action={
          <Link to="/businesses">
            <Button variant="secondary">Explorer l'annuaire</Button>
          </Link>
        }
      />
    )
  }

  return (
    <>
      <SubscriptionGroup
        title="Membres"
        icon={FiUser}
        items={grouped.users}
        onPrefChange={onPrefChange}
        onUnsubscribe={onUnsubscribe}
      />

      <SubscriptionGroup
        title="Entreprises"
        icon={HiOutlineBuildingOffice2}
        items={grouped.businesses}
        onPrefChange={onPrefChange}
        onUnsubscribe={onUnsubscribe}
      />
    </>
  )
}

function SubscriptionGroup({ title, icon: Icon, items, onPrefChange, onUnsubscribe }) {
  if (!items.length) return null

  return (
    <section className="grid gap-3">
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
        <Icon />
        {title}
      </h2>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="truncate text-base">{item.publisherName || 'Éditeur'}</strong>
                <PillBadge tone="info">
                  {SUBSCRIPTION_NOTIFY_LABELS[item.notifyPref] || item.notifyPref}
                </PillBadge>
              </div>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                Annonces marketplace, colis, jobs, événements et publications en priorité dans vos
                listes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.publisherPath ? (
                <Link to={item.publisherPath}>
                  <Button size="sm" variant="secondary" icon={FiExternalLink}>
                    Voir
                  </Button>
                </Link>
              ) : null}
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
                    aria-label={`Notifications : ${SUBSCRIPTION_NOTIFY_LABELS[item.notifyPref] || item.notifyPref}`}
                    title={SUBSCRIPTION_NOTIFY_LABELS[item.notifyPref] || 'Notifications'}
                    className="border border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)]"
                  />
                }
              />
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
