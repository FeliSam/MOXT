import { useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiHeart,
  FiMapPin,
  FiMaximize2,
  FiMoreHorizontal,
  FiPackage,
  FiPercent,
  FiShare2,
  FiShield,
  FiShoppingBag,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DetailFacts, DetailMetrics, DetailTimeline } from '../components/ui/DetailBlocks'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { FavoriteButton } from '../components/ui/FavoriteButton'
import { RevealListItem } from '../components/ui/RevealListItem'
import { ReshareButton } from '../components/ui/ReshareButton'
import { Tabs } from '../components/ui/Tabs'
import {
  categoriesForType,
  LISTING_TYPES_META,
  listingRulesFor,
  listingSpecificDetails,
} from '../config/listingConfig'
import { DELIVERY_OPTIONS, LISTING_CONDITIONS, optionLabel } from '../config/options'
import { ContactButton } from '../features/communications/ContactButton'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import {
  addListingQuestion,
  answerListingQuestion,
  incrementListingContact,
  incrementListingShare,
  incrementListingView,
  reportListing,
  updateListingStatus,
} from '../features/marketplace/marketplaceSlice'
import { toggleAccountFavorite } from '../features/account/accountSlice'
import { buildListingFavoriteSnapshot } from '../features/account/favoriteUtils'
import { addToast } from '../features/ui/uiSlice'
import { formatMoney } from '../features/transfers/transferUtils'
import { formatDateTime, formatShortDate } from '../utils/formatters'
import { PublisherDetailCard } from '../features/publications/PublisherDetailCard'
import { usePublisherDetailProfile } from '../features/publications/usePublisherDetailProfile'

const tabs = [
  { value: 'description', label: 'Description' },
  { value: 'details', label: 'Caractéristiques' },
  { value: 'delivery', label: 'Livraison et garantie' },
  { value: 'questions', label: 'Questions' },
  { value: 'history', label: 'Historique' },
]

export function ListingDetailPage() {
  const dispatch = useDispatch()
  const { listingId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const listing = useSelector((state) =>
    state.marketplace.items.find((item) => item.id === listingId),
  )
  const allListings = useSelector((state) => state.marketplace.items)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageOpen, setImageOpen] = useState(false)
  const [soldOpen, setSoldOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [quantity, setQuantity] = useState(1)
  const [question, setQuestion] = useState('')
  const [floatingActionsOpen, setFloatingActionsOpen] = useState(false)
  const isAdminViewer = ['admin', 'superadmin'].includes(user.role)
  const favorite = useSelector((state) =>
    state.account.favorites.some(
      (item) =>
        item.userId === user?.id &&
        item.relatedType === 'listing' &&
        item.relatedId === listingId,
    ),
  )
  const publisherProfile = usePublisherDetailProfile(listing, 'listing')

  useEffect(() => {
    if (listingId) dispatch(incrementListingView(listingId))
  }, [dispatch, listingId])

  const similar = useMemo(
    () =>
      allListings
        .filter(
          (item) =>
            item.id !== listingId &&
            item.status === 'active' &&
            (item.category === listing?.category || item.city === listing?.city),
        )
        .slice(0, 3),
    [allListings, listing?.category, listing?.city, listingId],
  )

  if (!listing) return <Card>Annonce introuvable.</Card>

  const images = listing.images || []
  const rules = listingRulesFor(listing.type)
  const listingTypeLabel =
    LISTING_TYPES_META.find(({ value }) => value === listing.type)?.label || listing.type
  const listingCategoryLabel =
    categoriesForType(listing.type).find(({ value }) => value === listing.category)?.label ||
    listing.category
  const stock = rules.showStock ? Number(listing.stock ?? 1) : null
  const specificDetails = listingSpecificDetails(listing)
  const activeImage = selectedImage || images[0]
  const activeImageIndex = Math.max(
    0,
    images.findIndex((image) => image === activeImage),
  )
  const total = Number(listing.price || 0) * quantity

  function selectImageAt(nextIndex) {
    if (!images.length) return
    const bounded = (nextIndex + images.length) % images.length
    setSelectedImage(images[bounded])
  }

  async function shareListing() {
    const shareData = { title: listing.title, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else await navigator.clipboard?.writeText(window.location.href)
      dispatch(incrementListingShare(listing.id))
      dispatch(
        addToast({
          title: 'Annonce partagée',
          message: 'Le lien a été partagé ou copié.',
          tone: 'success',
        }),
      )
    } catch {
      dispatch(
        addToast({
          title: 'Partage annulé',
          message: "L'annonce n'a pas été partagée.",
          tone: 'info',
        }),
      )
    }
  }

  function submitQuestion(event) {
    event.preventDefault()
    if (question.trim().length < 5) return
    dispatch(
      addListingQuestion({
        listingId: listing.id,
        authorId: user.id,
        authorName: `${user.firstName} ${user.lastName}`,
        text: question,
      }),
    )
    setQuestion('')
  }

  return (
    <div className="grid min-w-0 gap-5 overflow-hidden max-md:pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:gap-7 md:pb-28 xl:overflow-visible xl:pb-0">
      <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-[var(--app-text-muted)]">
        <Link to="/marketplace">Marketplace</Link>
        <span>/</span>
        <span>{listingCategoryLabel}</span>
        <span>/</span>
        <strong className="truncate text-[var(--app-text)]">{listing.title}</strong>
      </nav>

      <PageHeader
        eyebrow={listingCategoryLabel}
        title={listing.title}
        description={`${listing.city} · Publiée le ${formatShortDate(listing.createdAt)} · Réf. ${listing.id}`}
        actions={
          <>
            <ReshareButton sourceType="listing" sourceId={listing.id} sourceData={listing} />
            <Button variant="secondary" icon={FiShare2} onClick={shareListing}>
              Partager
            </Button>
            <Link to="/marketplace">
              <Button variant="secondary" icon={FiArrowLeft}>
                Retour
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="grid gap-6">
          <Gallery
            activeImage={activeImage}
            activeImageIndex={activeImageIndex}
            images={images}
            listing={listing}
            onOpen={() => setImageOpen(true)}
            onSelect={setSelectedImage}
            onSelectIndex={selectImageAt}
          />

          <Card className="grid min-w-0 gap-4 overflow-hidden xl:hidden">
            <PriceBlock listing={listing} />
            <div className="flex flex-wrap gap-2">
              <Badge tone="violet">{listingTypeLabel}</Badge>
              {rules.showStock ? (
                <Badge tone={stock ? 'success' : 'danger'}>
                  {stock ? `${stock} disponible(s)` : 'Rupture'}
                </Badge>
              ) : null}
            </div>
            <ListingPurchaseOptions
              listing={listing}
              quantity={quantity}
              setQuantity={setQuantity}
              stock={stock}
              total={total}
            />
          </Card>

          {publisherProfile ? (
            <PublisherDetailCard {...publisherProfile} className="xl:hidden" />
          ) : null}

          <Card className="min-w-0 overflow-hidden p-4 sm:p-6">
            <Tabs active={activeTab} items={tabs} onChange={setActiveTab} label="Détail annonce" />
            <div className="mt-6">
              {activeTab === 'description' ? (
                <div>
                  <h2 className="text-xl font-black">À propos de cette annonce</h2>
                  <p className="mt-4 whitespace-pre-line leading-8 text-[var(--app-text-muted)]">
                    {listing.description}
                  </p>
                </div>
              ) : null}
              {activeTab === 'details' ? (
                <DetailFacts
                  items={[
                    { label: 'Catégorie', value: listing.category },
                    { label: 'Type', value: listingTypeLabel },
                    { label: 'Marque', value: listing.brand },
                    { label: 'Modèle', value: listing.model },
                    { label: 'Couleur', value: listing.color },
                    rules.showCondition
                      ? {
                          label: 'État',
                          value: optionLabel(LISTING_CONDITIONS, listing.condition),
                        }
                      : null,
                    rules.showStock ? { label: 'Stock disponible', value: `${stock}` } : null,
                    { label: 'Quartier', value: listing.district },
                    ...specificDetails,
                  ].filter(Boolean)}
                />
              ) : null}
              {activeTab === 'delivery' ? (
                <DetailFacts
                  items={[
                    {
                      label: 'Modes de remise',
                      value: (listing.deliveryOptions || ['pickup'])
                        .map((value) => optionLabel(DELIVERY_OPTIONS, value))
                        .join(', '),
                    },
                    {
                      label: 'Frais de livraison',
                      value: listing.deliveryFee
                        ? formatMoney(listing.deliveryFee, listing.currency)
                        : 'Gratuit ou à convenir',
                    },
                    { label: 'Délai', value: listing.deliveryDelay },
                    { label: 'Garantie', value: listing.warranty },
                    { label: 'Politique de retour', value: listing.returnPolicy },
                    {
                      label: 'Paiements acceptés',
                      value: (listing.paymentMethods || ['À convenir']).join(', '),
                    },
                  ]}
                />
              ) : null}
              {activeTab === 'questions' ? (
                <Questions
                  dispatch={dispatch}
                  listing={listing}
                  question={question}
                  setQuestion={setQuestion}
                  submitQuestion={submitQuestion}
                  user={user}
                />
              ) : null}
              {activeTab === 'history' ? (
                <DetailTimeline
                  items={(listing.history || []).map((entry) => ({
                    label: entry.status,
                    date: formatDateTime(entry.at),
                  }))}
                />
              ) : null}
            </div>
          </Card>
          <DetailMetrics
            items={[
              rules.showCondition
                ? {
                    icon: FiPackage,
                    label: 'État',
                    value: optionLabel(LISTING_CONDITIONS, listing.condition),
                  }
                : {
                    icon: FiPackage,
                    label: 'Type',
                    value: listingTypeLabel,
                  },
              { icon: FiMapPin, label: 'Localisation', value: listing.city },
              { icon: FiEye, label: 'Consultations', value: `${listing.views || 0} vues` },
              {
                icon: FiHeart,
                label: 'Intérêt',
                value: `${listing.favorites?.length || 0} favoris`,
              },
            ]}
          />
        </div>

        <aside className="grid content-start gap-5 xl:sticky xl:top-28">
          <Card className="hidden min-w-0 overflow-hidden xl:block">
            <div className="flex flex-wrap gap-2">
              <Badge tone="violet">{listingTypeLabel}</Badge>
              <Badge tone="success">{listing.status}</Badge>
              {rules.showStock ? (
                <Badge tone={stock ? 'info' : 'danger'}>
                  {stock ? `${stock} disponible(s)` : 'Rupture'}
                </Badge>
              ) : null}
            </div>
            <div className="mt-5">
              <PriceBlock listing={listing} />
            </div>
            <ListingActionPanel
              dispatch={dispatch}
              favorite={favorite}
              listing={listing}
              quantity={quantity}
              setQuantity={setQuantity}
              stock={stock}
              total={total}
              user={user}
            />
            <p className="mt-5 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              Paiement via MOXT. Vérifiez le produit avant toute transaction.
            </p>
          </Card>

          <Card className="bg-amber-50 text-sm leading-6 text-amber-900 xl:hidden dark:bg-amber-950/30 dark:text-amber-100">
            <div className="flex gap-3">
              <FiAlertTriangle className="mt-1 shrink-0 text-xl" />
              <p>
                Vérifiez le produit, son état, l’identité du vendeur et les conditions de remise
                avant toute transaction réelle.
              </p>
            </div>
          </Card>

          {publisherProfile ? (
            <PublisherDetailCard {...publisherProfile} className="hidden xl:block" />
          ) : null}

          <Card>
            <FiShield className="text-2xl text-brand-600" />
            <h2 className="mt-3 font-black">Acheter avec prudence</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[var(--app-text-muted)]">
              <li>• Échangez uniquement dans la messagerie MOXT.</li>
              <li>• Contrôlez l’état, le prix et l’identité du vendeur.</li>
              <li>• Refusez toute demande de paiement anticipé douteuse.</li>
            </ul>
            {listing.ownerId === user.id ? (
              <div className="mt-5 grid gap-2">
                <Link to={`/marketplace/${listing.id}/edit`}>
                  <Button className="w-full" variant="secondary" icon={FiEdit2}>
                    Modifier l’annonce
                  </Button>
                </Link>
                {listing.status === 'active' ? (
                  <Button variant="danger" onClick={() => setSoldOpen(true)}>
                    Marquer vendu
                  </Button>
                ) : null}
              </div>
            ) : (
              <Button
                className="mt-5"
                variant="danger"
                icon={FiAlertTriangle}
                onClick={() =>
                  dispatch(
                    reportListing({
                      listingId: listing.id,
                      reporterId: user.id,
                      reason: 'Contenu suspect ou informations à vérifier',
                    }),
                  )
                }
              >
                Signaler
              </Button>
            )}
          </Card>
          {isAdminViewer ? (
            <Card className="border border-brand-100 bg-brand-50/60 dark:border-brand-900/40 dark:bg-brand-950/20">
              <div className="flex items-center gap-2">
                <FiShield className="text-xl text-brand-700" />
                <h2 className="font-black">Actions administrateur</h2>
              </div>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                Modération directe de l’annonce depuis sa fiche détaillée.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => dispatch(updateListingStatus({ id: listing.id, status: 'active' }))}>
                  Publier
                </Button>
                <Button variant="secondary" onClick={() => dispatch(updateListingStatus({ id: listing.id, status: 'sold' }))}>
                  Marquer vendu
                </Button>
                <Button variant="danger" onClick={() => dispatch(updateListingStatus({ id: listing.id, status: 'archived' }))}>
                  Archiver
                </Button>
              </div>
            </Card>
          ) : null}
        </aside>
      </div>

      {similar.length ? (
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-black">Annonces similaires</h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              Même catégorie ou même zone géographique.
            </p>
          </div>
          <div className="grid gap-4 overflow-visible sm:grid-cols-2 xl:grid-cols-3">
            {similar.map((item, index) => (
              <RevealListItem key={item.id} index={index} className="h-full overflow-visible">
                <MarketplaceListingCard listing={item} />
              </RevealListItem>
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 md:hidden">
        <ListingActionButtons
          dispatch={dispatch}
          favorite={favorite}
          layout="bar"
          listing={listing}
          user={user}
        />
      </div>

      <ListingFloatingActions
        dispatch={dispatch}
        favorite={favorite}
        listing={listing}
        open={floatingActionsOpen}
        setOpen={setFloatingActionsOpen}
        user={user}
      />

      <Modal open={imageOpen} onClose={() => setImageOpen(false)} title="Galerie" size="wide">
        {activeImage ? (
          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-[var(--app-surface-muted)]">
              <img
                src={activeImage}
                alt={listing.title}
                className="max-h-[75vh] w-full object-contain"
              />
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg"
                    onClick={() => selectImageAt(activeImageIndex - 1)}
                    aria-label="Image precedente"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg"
                    onClick={() => selectImageAt(activeImageIndex + 1)}
                    aria-label="Image suivante"
                  >
                    <FiChevronRight />
                  </button>
                </>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="flex items-center justify-between text-sm text-[var(--app-text-muted)]">
                <span>
                  Image {activeImageIndex + 1} / {images.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => selectImageAt(activeImageIndex - 1)}>
                    Precedente
                  </Button>
                  <Button variant="secondary" onClick={() => selectImageAt(activeImageIndex + 1)}>
                    Suivante
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <Placeholder listing={listing} />
        )}
      </Modal>

      <ConfirmDialog
        open={soldOpen}
        title="Marquer cette annonce comme vendue ?"
        description="L’annonce ne sera plus visible dans les résultats actifs."
        onCancel={() => setSoldOpen(false)}
        onConfirm={() => {
          dispatch(updateListingStatus({ id: listing.id, status: 'sold', actorId: user.id }))
          setSoldOpen(false)
        }}
      />
    </div>
  )
}

function Gallery({
  activeImage,
  activeImageIndex,
  images,
  listing,
  onOpen,
  onSelect,
  onSelectIndex,
}) {
  return (
    <Card className="overflow-hidden p-4 sm:p-4">
      <div className="group relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-cyan-700 to-blue-600 text-white">
        <button
          type="button"
          className="grid h-[360px] w-full place-items-center lg:h-[432px]"
          onClick={onOpen}
          aria-label="Ouvrir la galerie en plein écran"
        >
          {activeImage ? (
            <img
              src={activeImage}
              alt={listing.title}
              className="h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <Placeholder listing={listing} />
          )}
          <span className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white text-slate-950 shadow-xl">
            <FiMaximize2 />
          </span>
        </button>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:scale-110"
              onClick={() => onSelectIndex(activeImageIndex - 1)}
              aria-label="Image precedente"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:scale-110"
              onClick={() => onSelectIndex(activeImageIndex + 1)}
              aria-label="Image suivante"
            >
              <FiChevronRight />
            </button>
          </>
        ) : null}
      </div>
      {images.length ? (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => onSelect(image)}
              aria-label={`Afficher la photo ${index + 1} de ${listing.title}`}
              aria-pressed={image === activeImage}
              className={`h-[72px] w-full overflow-hidden rounded-2xl transition ${
                image === activeImage
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : 'bg-[var(--app-surface-muted)] hover:opacity-80'
              }`}
            >
              <img
                src={image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-[var(--app-text-muted)]">
          Le vendeur n’a pas encore ajouté de photo réelle.
        </p>
      )}
    </Card>
  )
}

function Placeholder({ listing }) {
  return (
    <div className="text-center">
      <FiShoppingBag className="mx-auto text-6xl" />
      <strong className="mt-4 block text-xl">{listing.title}</strong>
      <span className="mt-2 block text-sm text-white/70">MOXT Marketplace</span>
    </div>
  )
}

function ListingPurchaseOptions({ listing, quantity, setQuantity, stock, total }) {
  return (
    <>
      {listing.type === 'product' && stock > 0 ? (
        <label className="grid gap-2 text-sm font-bold">
          Quantité
          <select
            className="min-h-12 w-full rounded-2xl bg-[var(--app-surface-muted)] px-4"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          >
            {Array.from({ length: Math.min(stock, 10) }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {listing.price && quantity > 1 ? (
        <p className="text-sm text-[var(--app-text-muted)]">
          Total estimé : <strong>{formatMoney(total, listing.currency)}</strong>
        </p>
      ) : null}
    </>
  )
}

function toggleListingFavorite(dispatch, listing, user) {
  return () =>
    dispatch(
      toggleAccountFavorite({
        userId: user.id,
        relatedType: 'listing',
        relatedId: listing.id,
        title: listing.title,
        path: `/marketplace/${listing.id}`,
        snapshot: buildListingFavoriteSnapshot(listing),
      }),
    )
}

function ListingActionButtons({
  dispatch,
  favorite,
  listing,
  user,
  layout = 'sidebar',
}) {
  const toggleFavorite = toggleListingFavorite(dispatch, listing, user)
  const contactProps = {
    ownerId: listing.ownerId,
    relatedEntity: listing,
    relatedId: listing.id,
    relatedPath: `/marketplace/${listing.id}`,
    relatedTitle: listing.title,
    relatedType: 'listing',
    onContact: () => dispatch(incrementListingContact(listing.id)),
  }

  if (layout === 'bar') {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]/95 p-2 shadow-[var(--shadow-float)] backdrop-blur-xl">
        <ContactButton className="min-w-0 flex-1" {...contactProps} />
        <FavoriteButton
          active={favorite}
          onToggle={toggleFavorite}
          variant="solid"
          label={favorite ? 'Favori ✓' : 'Favori'}
          className="min-w-0 flex-1 !min-h-9 !rounded-[0.7rem] !px-3.5 !text-xs !shadow-none"
        />
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-3">
      <ContactButton className="w-full" {...contactProps} />
      <FavoriteButton
        active={favorite}
        onToggle={toggleFavorite}
        variant="solid"
        label
        className="w-full !shadow-none"
      />
    </div>
  )
}

function ListingFloatingActions({
  dispatch,
  favorite,
  listing,
  open,
  setOpen,
  user,
}) {
  const toggleFavorite = toggleListingFavorite(dispatch, listing, user)
  const contactProps = {
    ownerId: listing.ownerId,
    relatedEntity: listing,
    relatedId: listing.id,
    relatedPath: `/marketplace/${listing.id}`,
    relatedTitle: listing.title,
    relatedType: 'listing',
    onContact: () => dispatch(incrementListingContact(listing.id)),
  }

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-20 hidden flex-col items-end gap-2 md:flex xl:hidden">
      {open ? (
        <div className="flex flex-col items-end gap-2">
          <ContactButton
            className="shadow-[var(--shadow-float)]"
            variant="secondary"
            {...contactProps}
          />
          <FavoriteButton
            active={favorite}
            onToggle={() => {
              toggleFavorite()
              setOpen(false)
            }}
            variant="solid"
            label={favorite ? 'Favori ✓' : 'Favoris'}
            className="shadow-[var(--shadow-float)]"
          />
        </div>
      ) : null}
      <button
        type="button"
        className="btn-press grid size-14 place-items-center rounded-full bg-brand-700 text-2xl text-white shadow-[0_12px_28px_rgb(8_112_95/0.35)] transition hover:bg-brand-800"
        aria-expanded={open}
        aria-label={open ? 'Fermer le menu actions' : 'Ouvrir le menu actions'}
        onClick={() => setOpen((current) => !current)}
      >
        <FiMoreHorizontal />
      </button>
    </div>
  )
}

function ListingActionPanel({
  dispatch,
  favorite,
  listing,
  quantity,
  setQuantity,
  stock,
  total,
  user,
}) {
  return (
    <>
      <ListingPurchaseOptions
        listing={listing}
        quantity={quantity}
        setQuantity={setQuantity}
        stock={stock}
        total={total}
      />
      <div className="mt-3">
        <ListingActionButtons
          dispatch={dispatch}
          favorite={favorite}
          listing={listing}
          user={user}
        />
      </div>
    </>
  )
}

function PriceBlock({ listing }) {
  const hasDiscount = listing.originalPrice && listing.discountPercent
  if (!listing.price) return <strong className="text-3xl text-brand-700">Sur devis</strong>
  if (hasDiscount) {
    return (
      <div className="grid gap-1.5">
        <div className="flex items-center gap-3">
          <strong className="text-3xl text-brand-700">
            {formatMoney(listing.price, listing.currency)}
          </strong>
          <span className="flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-black text-white">
            <FiPercent size={11} />
            -{listing.discountPercent}%
          </span>
        </div>
        <span className="text-sm text-[var(--app-text-muted)] line-through">
          {formatMoney(listing.originalPrice, listing.currency)}
        </span>
        <span className="text-xs text-rose-600 font-bold">
          Économisez {formatMoney(listing.originalPrice - listing.price, listing.currency)}
        </span>
      </div>
    )
  }
  return <strong className="text-3xl text-brand-700">{formatMoney(listing.price, listing.currency)}</strong>
}

function Questions({ dispatch, listing, question, setQuestion, submitQuestion, user }) {
  const [answers, setAnswers] = useState({})
  const [replyingId, setReplyingId] = useState(null)
  const isOwner = listing.ownerId === user.id

  function submitAnswer(event, questionId) {
    event.preventDefault()
    const text = (answers[questionId] || '').trim()
    if (text.length < 2) return
    dispatch(
      answerListingQuestion({
        listingId: listing.id,
        questionId,
        ownerId: user.id,
        answer: text,
      }),
    )
    setAnswers((current) => ({ ...current, [questionId]: '' }))
    setReplyingId(null)
  }

  return (
    <div>
      {!isOwner ? (
        <form className="grid gap-3" onSubmit={submitQuestion}>
          <label className="grid gap-2 text-sm font-bold">
            Poser une question publique
            <textarea
              className="min-h-24 rounded-2xl bg-[var(--app-surface-muted)] p-4"
              placeholder="Demandez une précision sur l’état, la livraison ou la disponibilité..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </label>
          <Button type="submit" disabled={question.trim().length < 5}>
            Publier la question
          </Button>
        </form>
      ) : (
        <p className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm text-[var(--app-text-muted)]">
          Répondez publiquement aux questions des acheteurs pour rassurer les futurs visiteurs.
        </p>
      )}
      <div className="mt-6 grid gap-3">
        {(listing.questions || []).length ? (
          listing.questions.map((item) => (
            <div key={item.id} className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <div className="flex justify-between gap-3">
                <strong>{item.authorName}</strong>
                <span className="text-xs text-[var(--app-text-muted)]">
                  {formatShortDate(item.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm">{item.text}</p>
              {item.answer ? (
                <div className="mt-3 rounded-xl bg-[var(--app-surface)] p-3 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-accent)]">
                    Réponse du vendeur
                  </p>
                  <p className="mt-1">{item.answer}</p>
                  {item.answeredAt ? (
                    <p className="mt-2 text-[10px] text-[var(--app-text-faint)]">
                      {formatShortDate(item.answeredAt)}
                    </p>
                  ) : null}
                </div>
              ) : isOwner ? (
                replyingId === item.id ? (
                  <form className="mt-3 grid gap-3" onSubmit={(event) => submitAnswer(event, item.id)}>
                    <label className="grid gap-2 text-sm font-bold">
                      Votre réponse publique
                      <textarea
                        className="min-h-24 rounded-2xl bg-[var(--app-surface)] p-4"
                        placeholder="Répondez clairement pour aider les autres acheteurs..."
                        value={answers[item.id] || ''}
                        onChange={(event) =>
                          setAnswers((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={(answers[item.id] || '').trim().length < 2}>
                        Publier la réponse
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setReplyingId(null)}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="secondary"
                    onClick={() => setReplyingId(item.id)}
                  >
                    Répondre
                  </Button>
                )
              ) : (
                <p className="mt-3 text-xs text-[var(--app-text-faint)]">
                  En attente de réponse du vendeur.
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--app-text-muted)]">Aucune question publique.</p>
        )}
      </div>
    </div>
  )
}
