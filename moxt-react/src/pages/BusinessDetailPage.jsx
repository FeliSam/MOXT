import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiStar,
} from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  DetailFacts,
  DetailMetrics,
  DetailSection,
  TrustPanel,
} from '../components/ui/DetailBlocks'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { ReshareButton } from '../components/ui/ReshareButton'
import { activityByValue, businessExperienceForActivity } from '../config/businessActivities'
import { statusMeta } from '../config/statuses'
import { FavoriteButton } from '../features/account/FavoriteButton'
import { SubscribeButton } from '../features/account/SubscribeButton'
import {
  calculateBusinessRating,
  selectBusinessContent,
} from '../features/businesses/businessSelectors'
import { moderateBusiness } from '../features/businesses/businessSlice'
import { ContactButton } from '../features/communications/ContactButton'
import { createReview } from '../features/reviews/reviewSlice'

const serviceSections = [
  { key: 'listings', label: 'Annonces', icon: FiShoppingBag, service: 'Marketplace' },
  { key: 'jobs', label: 'Jobs', icon: FiBriefcase, service: 'Jobs' },
  { key: 'events', label: 'Événements', icon: FiCalendar, service: 'Events' },
  { key: 'parcels', label: 'Colis', icon: FiPackage, service: 'Colis' },
]

export function BusinessDetailPage() {
  const dispatch = useDispatch()
  const { businessId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.id === businessId),
  )
  const content = useSelector((state) => selectBusinessContent(state, business))
  const reviews = useSelector((state) =>
    state.reviews.items.filter(
      (item) =>
        item.targetType === 'business' &&
        item.targetId === businessId &&
        item.status === 'published',
    ),
  )
  const [review, setReview] = useState({ rating: 5, comment: '' })

  const canPreview =
    business?.ownerId === user.id ||
    ['admin', 'superadmin'].includes(user.role) ||
    ['verified', 'approved', 'active'].includes(business?.status)
  if (!business || !canPreview) {
    return <EmptyState title="Entreprise introuvable ou en attente de validation" />
  }

  const rating = calculateBusinessRating(reviews)
  const activity = activityByValue(business.primaryActivity)
  const experience = businessExperienceForActivity(business.primaryActivity)
  const isAdminViewer = ['admin', 'superadmin'].includes(user.role)
  const sections = serviceSections.filter(
    ({ key, service }) => business.services?.includes(service) || content[key]?.length,
  )

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Entreprise MOXT"
        title={business.name}
        description={`${business.sector} · ${business.city}`}
        actions={
          <div className="flex items-center gap-2">
            <ReshareButton sourceType="business" sourceId={business.id} sourceData={business} />
            <Link to="/businesses">
              <Button variant="secondary" icon={FiArrowLeft}>Annuaire</Button>
            </Link>
          </div>
        }
      />
      <DetailMetrics
        items={[
          {
            icon: FiStar,
            label: 'Évaluation',
            value: `${rating.count ? rating.average : business.rating || 0}/5`,
          },
          { icon: FiShield, label: 'Statut', value: statusMeta(business.status).label },
          { icon: FiMapPin, label: 'Localisation', value: business.city },
          {
            icon: FiBriefcase,
            label: 'Publications',
            value: `${Object.values(content).reduce((total, items) => total + items.length, 0)}`,
          },
        ]}
      />
      <Card className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          {business.bannerUrl ? (
            <img
              src={business.bannerUrl}
              alt={`Bannière ${business.name}`}
              className="mb-5 h-44 w-full rounded-[1.8rem] object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={`${business.name} logo`}
              className="mb-4 size-16 rounded-3xl object-cover shadow-md"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusMeta(business.status).tone}>{statusMeta(business.status).label}</Badge>
            {['verified', 'approved', 'active'].includes(business.status) ? <VerifiedBadge /> : null}
          </div>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--app-text-muted)]">
            {business.description}
          </p>
          <div className="mt-4 rounded-[1.5rem] bg-[var(--app-surface-muted)] p-4 text-sm leading-6 text-[var(--app-text-muted)]">
            <strong className="block text-[var(--app-text)]">
              {activity?.label || business.sector}
            </strong>
            <span>{experience.promise}</span>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm">
            <FiMapPin className="text-brand-600" /> {business.city} · {business.country}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ContactButton
              ownerId={business.ownerId}
              relatedEntity={business}
              relatedId={business.id}
              relatedPath={`/businesses/${business.id}`}
              relatedTitle={business.name}
              relatedType="business"
            />
            {business.ownerId !== user.id ? (
              <SubscribeButton
                publisherType="business"
                publisherId={business.id}
                publisherName={business.name}
                publisherPath={`/businesses/${business.id}`}
              />
            ) : null}
            <FavoriteButton
              relatedId={business.id}
              relatedType="business"
              title={business.name}
              path={`/businesses/${business.id}`}
              entity={business}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            value={`${rating.count ? rating.average : business.rating || 0}/5`}
            label={`${rating.count} avis`}
          />
          <Stat value={`${business.feePercent}%`} label="Frais" />
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sections.map(({ icon: Icon, key, label }) => (
          <Card key={key}>
            <Icon className="text-2xl text-brand-600" />
            <strong className="mt-4 block text-2xl">{content[key].length}</strong>
            <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
            <Link
              className="mt-4 block text-sm font-bold text-brand-700 dark:text-brand-300"
              to={`/businesses/${business.id}/publications/${key}`}
            >
              Consulter
            </Link>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <DetailSection title="Informations professionnelles">
          <DetailFacts
            items={[
              { label: 'Secteur', value: activity?.label || business.sector },
              { label: 'Pays', value: business.country },
              { label: 'Ville', value: business.city },
              { label: 'Téléphone', value: business.phone },
              { label: 'Frais annoncés', value: `${business.feePercent}%` },
              { label: 'Délai moyen', value: business.averageDelay },
            ]}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {business.services.map((service) => (
              <Badge key={service}>{service}</Badge>
            ))}
          </div>
        </DetailSection>
        <TrustPanel
          items={[
            `Profil ${statusMeta(business.status).label.toLowerCase()}.`,
            `${rating.count} avis publié(s) par la communauté.`,
            'Les coordonnées sensibles sont partagées dans les opérations confirmées.',
          ]}
        />
      </div>
      {isAdminViewer ? (
        <Card className="border border-brand-100 bg-brand-50/60 dark:border-brand-900/40 dark:bg-brand-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-black">
                <FiShield className="text-brand-700" />
                Actions administrateur
              </h2>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                Validation et contrôle direct de l’entreprise depuis sa fiche publique.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => dispatch(moderateBusiness({ id: business.id, status: 'verified' }))}>
                Valider
              </Button>
              <Button variant="secondary" onClick={() => dispatch(moderateBusiness({ id: business.id, status: 'active' }))}>
                Activer
              </Button>
              <Button variant="danger" onClick={() => dispatch(moderateBusiness({ id: business.id, status: 'rejected' }))}>
                Rejeter
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <DetailSection title="Points mis en avant">
          <div className="grid gap-3 sm:grid-cols-2">
            {experience.spotlight.map((item) => (
              <div key={item} className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm">
                <strong className="block">{item}</strong>
                <span className="mt-1 block text-[var(--app-text-muted)]">
                  {resolveBusinessSpotlightValue(business, item)}
                </span>
              </div>
            ))}
          </div>
        </DetailSection>
        <DetailSection title="À propos de cette activité">
          <p className="text-sm leading-7 text-[var(--app-text-muted)]">{experience.audience}</p>
          <div className="mt-4 grid gap-3">
            {experience.onboarding.map((item) => (
              <div key={item} className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm">
                {item}
              </div>
            ))}
          </div>
        </DetailSection>
      </div>
      {sections.length ? (
        <div className="grid gap-4">
          <div>
            <h2 className="text-2xl font-black">Publications liées</h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              Accédez aux contenus réellement publiés par cette entreprise selon son activité.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sections.map(({ icon: Icon, key, label }) => (
              <Link key={key} to={`/businesses/${business.id}/publications/${key}`}>
                <Card className="h-full">
                  <Icon className="text-2xl text-brand-600" />
                  <strong className="mt-4 block text-xl">{label}</strong>
                  <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                    {content[key].length} élément(s) publiés
                  </p>
                  <div className="mt-4">
                    {content[key][0]?.images?.[0] ? (
                      <img
                        src={content[key][0].images[0]}
                        alt={content[key][0].title || label}
                        className="h-36 w-full rounded-[1.25rem] object-cover"
                      />
                    ) : (
                      <div className="grid h-36 place-items-center rounded-[1.25rem] bg-[var(--app-surface-muted)] text-sm text-[var(--app-text-muted)]">
                        Voir la liste publiée
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        {business.ownerId !== user.id ? (
          <Card>
            <h2 className="font-black">Laisser un avis</h2>
            <form
              className="mt-5 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (review.comment.trim().length < 5) return
                dispatch(
                  createReview({
                    targetType: 'business',
                    targetId: business.id,
                    authorId: user.id,
                    authorName: `${user.firstName} ${user.lastName}`,
                    rating: review.rating,
                    comment: review.comment,
                  }),
                )
                setReview({ rating: 5, comment: '' })
              }}
            >
              <label className="grid gap-1.5 text-sm font-semibold">
                Note
                <select
                  className="min-h-11 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3"
                  value={review.rating}
                  onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value}/5
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Commentaire
                <textarea
                  className="min-h-28 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3"
                  value={review.comment}
                  onChange={(event) => setReview({ ...review, comment: event.target.value })}
                />
              </label>
              <Button type="submit">Publier l’avis</Button>
            </form>
          </Card>
        ) : null}
        <Card>
          <h2 className="font-black">Avis de la communauté</h2>
          <div className="mt-5 grid gap-3">
            {reviews.length ? (
              reviews.map((item) => (
                <div key={item.id} className="rounded-xl bg-[var(--app-surface-muted)] p-4">
                  <div className="flex justify-between gap-3">
                    <strong>{item.authorName}</strong>
                    <Badge tone="warning">{item.rating}/5</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--app-text-muted)]">{item.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--app-text-muted)]">Aucun avis publié.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-center">
      <strong className="block text-xl">{value}</strong>
      <span className="text-xs text-[var(--app-text-muted)]">{label}</span>
    </div>
  )
}

function resolveBusinessSpotlightValue(business, item) {
  switch (item) {
    case 'Frais annonces':
      return business.feePercent ? `${business.feePercent}%` : 'À confirmer'
    case 'Delai moyen':
    case 'Delai de prise en charge':
      return business.averageDelay || 'À confirmer'
    case 'Reseaux actifs':
      return business.exchangeMethods?.join(', ') || 'Selon l opération'
    case 'Zone de service':
    case 'Zones':
    case 'Zone':
    case 'Livraison':
      return business.serviceZones || business.city || 'Russie'
    case 'Capacite':
      return 'Visible dans les annonces de colis'
    case 'Catalogue':
    case 'Biens actifs':
    case 'Programmes':
    case 'Ateliers':
    case 'Services':
    case 'Offres actives':
    case 'Evenements a venir':
      return 'Visible dans les publications liées'
    case 'Disponibilite':
    case 'Horaires':
      return business.scheduleSummary || 'Selon contact direct'
    case 'Contact':
    case 'Contact RH':
      return business.phone || business.email || 'À compléter'
    default:
      return business.city || 'MOXT'
  }
}
