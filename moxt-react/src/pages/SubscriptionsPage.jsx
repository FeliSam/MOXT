import { useMemo } from 'react'
import { FiBell, FiBriefcase, FiExternalLink, FiStar, FiUser, FiVolumeX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PillBadge } from '../components/ui/Badge'
import {
  SUBSCRIPTION_NOTIFY_LABELS,
} from '@moxt/shared/utils/subscriptionUtils.js'
import {
  removePublisherSubscription,
  updatePublisherSubscriptionPref,
} from '../features/account/accountSlice'
import { SubscriptionNotifyMenu } from '../features/account/SubscriptionNotifyMenu'
import { selectUserSubscriptions } from '../features/account/subscriptionSelectors'

export function SubscriptionsPage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const subscriptions = useSelector((state) => selectUserSubscriptions(state, user.id))
  const grouped = useMemo(() => {
    const users = subscriptions.filter((item) => item.publisherType === 'user')
    const businesses = subscriptions.filter((item) => item.publisherType === 'business')
    return { users, businesses }
  }, [subscriptions])

  if (!subscriptions.length) {
    return (
      <div className="grid gap-7">
        <PageHeader
          eyebrow="Communauté"
          title="Mes abonnements"
          description="Suivez des membres ou des entreprises pour voir leurs annonces en priorité."
        />
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
      </div>
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Communauté"
        title="Mes abonnements"
        description={`${subscriptions.length} abonnement(s) actif(s). Configurez les notifications pour chaque éditeur.`}
      />

      <SubscriptionGroup
        title="Membres"
        icon={FiUser}
        items={grouped.users}
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

      <SubscriptionGroup
        title="Entreprises"
        icon={FiBriefcase}
        items={grouped.businesses}
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
    </div>
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
