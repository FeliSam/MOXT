import { FiBell, FiCheckCircle, FiExternalLink, FiStar, FiVolumeX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DetailSection } from '../../components/ui/DetailBlocks'
import { SubscribeButton } from '../account/SubscribeButton'
import {
  ANNOUNCEMENT_CONTENT_TYPES,
  SUBSCRIPTION_NOTIFY_HINTS,
  SUBSCRIPTION_NOTIFY_LABELS,
} from '@moxt/shared/utils/subscriptionUtils.js'
import { selectPublisherSubscribers } from '../account/subscriptionSelectors'

const CONTENT_LABELS = {
  listing: 'Annonces marketplace',
  parcel: 'Colis disponibles',
  job: 'Offres d\'emploi',
  event: 'Événements',
  post: 'Publications communauté',
}

const BENEFITS = [
  'Priorité dans vos listes marketplace, colis, jobs et événements',
  'Notifications configurables (toutes, importantes ou sourdine)',
  'Accès rapide aux nouvelles publications de cette entreprise',
]

const PREF_ITEMS = [
  { key: 'all', icon: FiBell },
  { key: 'important', icon: FiStar },
  { key: 'muted', icon: FiVolumeX },
]

export function BusinessSubscriptionSection({ business, enabledServices = [], isOwner }) {
  const subscribers = useSelector((state) =>
    selectPublisherSubscribers(state, 'business', business.id),
  )
  const publisherPath = `/businesses/${business.id}`

  const coveredTypes = ANNOUNCEMENT_CONTENT_TYPES.filter((type) => {
    if (type === 'listing') return enabledServices.includes('Marketplace')
    if (type === 'parcel') return enabledServices.includes('Colis')
    if (type === 'job') return enabledServices.includes('Jobs')
    if (type === 'event') return enabledServices.includes('Events')
    if (type === 'post') return true
    return false
  })

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <DetailSection title="Suivre cette entreprise">
          <p className="text-sm leading-7 text-[var(--app-text-muted)]">
            Abonnez-vous pour ne pas manquer les annonces et publications de{' '}
            <strong>{business.name}</strong>. Vous choisissez le niveau de notifications après
            l&apos;abonnement.
          </p>
          <ul className="mt-4 grid gap-2">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--app-text-muted)]">
                <FiCheckCircle className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          {!isOwner ? (
            <div className="mt-5">
              <SubscribeButton
                publisherType="business"
                publisherId={business.id}
                publisherName={business.name}
                publisherPath={publisherPath}
                variant="primary"
              />
            </div>
          ) : null}
        </DetailSection>

        <Card className="grid gap-4">
          <h3 className="font-black">Contenus suivis</h3>
          <div className="flex flex-wrap gap-2">
            {coveredTypes.length ? (
              coveredTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-bold"
                >
                  {CONTENT_LABELS[type]}
                </span>
              ))
            ) : (
              <p className="text-sm text-[var(--app-text-muted)]">
                Les modules activés par l&apos;entreprise déterminent les contenus notifiés.
              </p>
            )}
          </div>
          <div className="border-t border-[var(--app-border)] pt-4">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--app-text-faint)]">
              Options de notification
            </p>
            <div className="mt-3 grid gap-2">
              {PREF_ITEMS.map(({ key, icon: Icon }) => (
                <div key={key} className="flex items-start gap-2 text-sm">
                  <Icon className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
                  <div>
                    <strong className="block">{SUBSCRIPTION_NOTIFY_LABELS[key]}</strong>
                    <span className="text-xs text-[var(--app-text-muted)]">
                      {SUBSCRIPTION_NOTIFY_HINTS[key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {isOwner ? (
        <Card className="flex flex-col gap-4 border border-brand-100 bg-brand-50/50 dark:border-brand-900/40 dark:bg-brand-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-black">Espace professionnel — abonnés</h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {subscribers.length
                ? `${subscribers.length} membre(s) suivent actuellement votre entreprise.`
                : 'Aucun abonné pour le moment — partagez votre fiche pour développer votre audience.'}
            </p>
          </div>
          <Link to="/professional?tab=subscriptions">
            <Button icon={FiExternalLink}>Gérer les abonnés</Button>
          </Link>
        </Card>
      ) : null}
    </div>
  )
}
