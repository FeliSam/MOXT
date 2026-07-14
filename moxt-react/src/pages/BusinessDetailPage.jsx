import {
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiPackage,
  FiShield,
  FiShoppingBag,
  FiStar,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge, VerifiedDisplayName } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogArchiveTabs } from '../components/ui/CatalogArchiveTabs'
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
import { ProfileQrShareButton } from '../features/share/ProfileQrShareButton'
import {
  buildBusinessShareText,
  buildBusinessShareUrl,
  businessCityLabel,
  businessShareVersion,
} from '../features/share/businessShareUtils'
import { selectBusinessContent } from '../features/businesses/businessSelectors'
import { BusinessSubscriptionSection } from '../features/businesses/BusinessSubscriptionSection'
import { BusinessVerificationProgress } from '../features/businesses/BusinessVerificationProgress'
import { isBusinessVisibleToViewer } from '../features/businesses/businessVisibility'
import { moderateBusiness } from '../features/businesses/businessSlice'
import { ContactButton } from '../features/communications/ContactButton'
import { BusinessActivityVisibilitySection } from '../features/businesses/BusinessActivityVisibilitySection'
import { canViewBusinessActivity } from '../features/account/activityVisibility'
import { selectBusinessReviewsBundle } from '../features/reviews/reviewSelectors'
import { ReviewsSection, REVIEW_TARGET_TYPES } from '../features/reviews/ReviewsSection'

const serviceSections = [
  { key: 'listings', label: 'Annonces', icon: FiShoppingBag, service: 'Marketplace' },
  { key: 'jobs', label: 'Jobs', icon: FiBriefcase, service: 'Jobs' },
  { key: 'events', label: 'Événements', icon: FiCalendar, service: 'Events' },
  { key: 'parcels', label: 'Colis', icon: FiPackage, service: 'Colis' },
]

export function BusinessDetailPage() {
  const dispatch = useDispatch()
  const [detailTab, setDetailTab] = useState('informations')
  const { businessId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const conversations = useSelector((state) => state.communications.conversations)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.id === businessId),
  )
  const content = useSelector((state) => selectBusinessContent(state, business))
  const documents = useSelector((state) =>
    state.businesses.documents.filter((item) => item.businessId === businessId),
  )
  const { reviews, rating } = useSelector((state) =>
    selectBusinessReviewsBundle(state, business),
  )

  const isOwner = business?.ownerId === user.id
  const isAdminViewer = ['admin', 'superadmin'].includes(user.role)
  const canView =
    business &&
    canViewBusinessActivity({
      viewerId: user?.id,
      business,
      conversations,
    })
  const canPreview =
    business &&
    canView &&
    isBusinessVisibleToViewer(business, user) &&
    (isOwner || isAdminViewer || ['verified', 'approved', 'active'].includes(business?.status))

  if (!business || !canPreview) {
    return (
      <EmptyState
        title={
          business && !canView
            ? 'Entreprise non accessible'
            : 'Entreprise introuvable ou en attente de validation'
        }
        description={
          business && !canView
            ? 'Cette entreprise a restreint la visibilité de ses publications.'
            : undefined
        }
      />
    )
  }

  const activity = activityByValue(business.primaryActivity)
  const experience = businessExperienceForActivity(business.primaryActivity)
  const hasTransfer = business.services?.includes('Transfert')
  const ratingValue = rating.count ? rating.average : business.rating || 0
  const sections = serviceSections.filter(
    ({ key, service }) => business.services?.includes(service) || content[key]?.length,
  )

  const metricItems = [
    {
      icon: FiStar,
      label: `${rating.count} avis`,
      value: `${ratingValue}/5`,
    },
    { icon: FiShield, label: 'Statut', value: statusMeta(business.status).label },
    { icon: FiMapPin, label: 'Localisation', value: business.city },
    {
      icon: HiOutlineBuildingOffice2,
      label: 'Publications',
      value: `${Object.values(content).reduce((total, items) => total + items.length, 0)}`,
    },
  ]

  if (hasTransfer) {
    metricItems.splice(1, 0, {
      icon: HiOutlineBuildingOffice2,
      label: 'Frais annoncés',
      value: `${business.feePercent}%`,
    })
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Entreprise MOXT"
        title={
          <VerifiedDisplayName
            name={business.name}
            verified={['verified', 'approved', 'active'].includes(business.status)}
            iconSize="md"
          />
        }
        description={`${business.sector} · ${business.city}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReshareButton sourceType="business" sourceId={business.id} sourceData={business} />
            {!isOwner ? (
              <FavoriteButton
                relatedId={business.id}
                relatedType="business"
                title={business.name}
                path={`/businesses/${business.id}`}
                entity={business}
                className="!w-auto !shadow-none"
              />
            ) : null}
            {!isOwner ? (
              <ContactButton
                ownerId={business.ownerId}
                relatedEntity={business}
                relatedId={business.id}
                relatedPath={`/businesses/${business.id}`}
                relatedTitle={business.name}
                relatedType="business"
              />
            ) : null}
            <BackButton fallback="/businesses" label="Annuaire" />
          </div>
        }
      />
      {isOwner ? (
        <BusinessVerificationProgress business={business} documents={documents} />
      ) : null}
      <DetailMetrics items={metricItems} />
      <Card className="grid gap-6">
        <div className="relative">
          {business.bannerUrl ? (
            <img
              src={business.bannerUrl}
              alt={`Bannière ${business.name}`}
              className="h-44 w-full rounded-[1.8rem] object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-44 w-full rounded-[1.8rem] bg-gradient-to-br from-brand-600 to-cyan-600" />
          )}
          <div className="absolute -bottom-8 left-5 z-10">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={`${business.name} logo`}
                className="size-16 rounded-3xl border-4 border-[var(--app-surface)] object-cover shadow-md"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-3xl border-4 border-[var(--app-surface)] bg-[var(--app-accent-soft)] text-xl font-black text-[var(--app-accent)] shadow-md">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute right-4 top-4">
            <ProfileQrShareButton
              type="business"
              activityVisibility={business.activityVisibility}
              refreshKey={businessShareVersion(business)}
              shareUrl={buildBusinessShareUrl(business)}
              shareText={buildBusinessShareText(business)}
              title={business.name}
              subtitle={activity?.label || business.sector}
              verified={['verified', 'approved', 'active'].includes(business.status)}
              city={businessCityLabel(business)}
              sector={activity?.label || business.sector}
              logoUrl={business.logoUrl}
            />
          </div>
        </div>

        <div className="grid gap-4 pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusMeta(business.status).tone}>{statusMeta(business.status).label}</Badge>
          </div>
          <p className="max-w-3xl whitespace-pre-line leading-7 text-[var(--app-text-muted)]">
            {business.description}
          </p>
          <div className="rounded-[1.5rem] bg-[var(--app-surface-muted)] p-4 text-sm leading-6 text-[var(--app-text-muted)]">
            <strong className="block text-[var(--app-text)]">
              {activity?.label || business.sector}
            </strong>
            <span>{experience.promise}</span>
          </div>
          <p className="flex items-center gap-2 text-sm">
            <FiMapPin className="text-brand-600" /> {business.city} · {business.country}
          </p>
          <div className="flex flex-wrap gap-3">
            <ContactButton
              ownerId={business.ownerId}
              relatedEntity={business}
              relatedId={business.id}
              relatedPath={`/businesses/${business.id}`}
              relatedTitle={business.name}
              relatedType="business"
            />
            {!isOwner ? (
              <SubscribeButton
                publisherType="business"
                publisherId={business.id}
                publisherName={business.name}
                publisherPath={`/businesses/${business.id}`}
              />
            ) : null}
          </div>
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
      <CatalogArchiveTabs
        active={detailTab}
        onChange={setDetailTab}
        variant="section"
        className="!grid-cols-3 sm:!inline-flex"
        tabs={[
          { key: 'informations', label: 'Informations' },
          { key: 'abonnements', label: 'Abonnements' },
          { key: 'avis', label: 'Avis', count: rating.count },
        ]}
      />
      {detailTab === 'informations' ? (
        <>
          {isOwner ? <BusinessActivityVisibilitySection business={business} /> : null}
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <DetailSection title="Informations professionnelles">
              <DetailFacts
                items={[
                  { label: 'Secteur', value: activity?.label || business.sector },
                  { label: 'Pays', value: business.country },
                  { label: 'Ville', value: business.city },
                  { label: 'Téléphone', value: business.phone },
                  ...(hasTransfer
                    ? [
                        { label: 'Frais annoncés', value: `${business.feePercent}%` },
                        { label: 'Délai moyen', value: business.averageDelay },
                      ]
                    : []),
                  ...(!hasTransfer && business.averageDelay
                    ? [{ label: 'Délai moyen', value: business.averageDelay }]
                    : []),
                ]}
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {(business.services || []).map((service) => (
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
        </>
      ) : detailTab === 'abonnements' ? (
        <BusinessSubscriptionSection
          business={business}
          enabledServices={business.services || []}
          isOwner={isOwner}
        />
      ) : (
        <ReviewsSection
          embedded
          ownerId={business.ownerId}
          ownerName={business.name}
          profileTargetType={REVIEW_TARGET_TYPES.BUSINESS}
          profileTargetId={business.id}
          reviews={reviews}
          currentUser={user}
        />
      )}
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
