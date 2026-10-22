import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiBriefcase,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiMaximize2,
  FiPercent,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTrash2,
  FiUser,
  FiUserPlus,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { EntityVerifiedName } from '../components/ui/EntityVerifiedName'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { ExpandableLinkifiedText } from '../components/ui/ExpandableLinkifiedText'
import { LinkifiedText } from '../components/ui/LinkifiedText'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DetailFacts, DetailTimeline } from '../components/ui/DetailBlocks'
import { ImageGalleryViewer } from '../components/ui/ImageGalleryViewer'
import { useSwipeDownToClose } from '../hooks/useSwipeDownToClose'
import { PageHeader } from '../components/ui/PageHeader'
import { FavoriteButton as AccountFavoriteButton } from '../features/account/FavoriteButton'
import { RevealListItem } from '../components/ui/RevealListItem'
import { DetailFloatingActions } from '../components/ui/DetailFloatingActions'
import { Tabs } from '../components/ui/Tabs'
import {
  categoriesForType,
  LISTING_TYPES_META,
  listingRulesFor,
  listingSpecificDetails,
} from '../config/listingConfig'
import { DELIVERY_OPTIONS, LISTING_CONDITIONS, optionLabel } from '../config/options'
import { ContactButton } from '../features/communications/ContactButton'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { MarketplaceListingCard } from '../features/marketplace/MarketplaceListingCard'
import { MarketplaceVideoCard } from '../features/marketplace/MarketplaceVideoRail'
import {
  MARKETPLACE_DISCOVER_GRID_COLUMNS,
  MARKETPLACE_DISCOVER_GRID_GAP,
  MARKETPLACE_DISCOVERY_CARD_HEIGHT,
} from '../features/marketplace/marketplaceDiscoveryLayout'
import {
  addListingQuestion,
  answerListingQuestion,
  updateListingQuestion,
  deleteListingQuestion,
  deleteListing,
  duplicateListing,
  incrementListingContact,
  incrementListingShare,
  incrementListingView,
  reportListing,
  updateListingStatus,
} from '../features/marketplace/marketplaceSlice'
import { markListingViewed } from '../features/account/accountSlice'
import { addToast } from '../features/ui/uiSlice'
import { formatMoney } from '../features/transfers/transferUtils'
import { formatDateTime, formatShortDate } from '../utils/formatters'
import { PublisherPublicationsStrip } from '../features/publications/PublisherPublicationsStrip'
import { usePublisherDetailProfile } from '../features/publications/usePublisherDetailProfile'
import { usePublicationProfile } from '../features/publications/usePublicationProfile'
import { SubscribeButton } from '../features/account/SubscribeButton'
import { avatarDisplayUrl } from '../features/account/avatarDisplayUrl'
import { pickShuffledWindow } from '../features/feed/feedDiscoveryUtils'
import { ReportDialog } from '../components/ui/ReportDialog'
import { useLanguage } from '../contexts/useLanguage'
import { phase3Text } from '../i18n/phase3I18n'
import {
  listingOptionLabel,
  marketplaceText,
} from '../features/marketplace/marketplaceI18n'
import { useGuestAction } from '../features/guest/useGuestAction'
import {
  useGuestListingDetail,
  useGuestMarketplaceListings,
} from '../features/guest/useGuestPreview'

const TAB_DEFS = [
  { value: 'description', labelKey: 'marketplace.detail.tabs.description' },
  { value: 'details', labelKey: 'marketplace.detail.tabs.details' },
  { value: 'delivery', labelKey: 'marketplace.detail.tabs.delivery' },
  { value: 'questions', labelKey: 'marketplace.detail.tabs.questions' },
  { value: 'history', labelKey: 'marketplace.detail.tabs.history' },
]

function CompactPublisherCard({
  publisherProfile,
  listing,
  ownerProfile,
  currentUser,
  requireAccount,
  className = '',
}) {
  const { t } = useLanguage()
  const business = publisherProfile?.business || publisherProfile?.ownerBusiness
  const isBusiness = Boolean(business || listing?.businessId)
  const publisherName = publisherProfile?.publisherName || t('publications.publisher.memberMoxt')
  const verified = publisherProfile?.verified

  const directoryPath =
    publisherProfile?.businessProfilePath ||
    (publisherProfile?.businessId ? `/businesses/${publisherProfile.businessId}` : null) ||
    (business?.id ? `/businesses/${business.id}` : null)
  const profilePath =
    directoryPath ||
    publisherProfile?.publicationsPath ||
    (publisherProfile?.ownerId ? `/users/${publisherProfile.ownerId}/publications` : null) ||
    '/marketplace'

  const rawAvatarUrl =
    business?.logoUrl ||
    business?.avatarUrl ||
    ownerProfile?.avatarUrl ||
    listing?.sellerAvatar ||
    null
  const displayAvatarUrl = rawAvatarUrl
    ? avatarDisplayUrl(rawAvatarUrl, { width: 110, height: 110 })
    : null

  const rating = publisherProfile?.rating
  const ratingAverage = Number(rating?.average || 0)
  const ratingCount = Number(rating?.count || 0)
  const isSelf = Boolean(
    currentUser?.id &&
      (currentUser.id === publisherProfile?.ownerId || currentUser.id === listing?.ownerId),
  )

  const publisherId = isBusiness
    ? publisherProfile?.businessId || business?.id || publisherProfile?.ownerId
    : publisherProfile?.ownerId || listing?.ownerId

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/70 px-4 py-3.5 sm:py-4 min-h-[66px] sm:min-h-[72px] backdrop-blur-sm transition-colors hover:border-[var(--app-border-hover)] ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5 overflow-hidden">
        <Link
          to={profilePath}
          title={publisherName}
          className="group relative size-[48px] sm:size-[52px] shrink-0 overflow-hidden rounded-xl bg-slate-200 ring-1 ring-black/5 transition hover:scale-105 dark:bg-slate-800 dark:ring-white/10"
        >
          {displayAvatarUrl ? (
            <img
              src={displayAvatarUrl}
              alt={publisherName}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex size-full items-center justify-center bg-gradient-to-br from-brand-600 to-indigo-700 text-sm font-black text-white">
              {publisherName?.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1 overflow-hidden">
          <Link
            to={profilePath}
            className="group flex min-w-0 max-w-full items-center gap-1.5 transition"
            title={publisherName}
          >
            <span className="truncate block min-w-0 max-w-[125px] xs:max-w-[175px] sm:max-w-[240px] md:max-w-[320px] xl:max-w-[155px] 2xl:max-w-[200px] text-sm sm:text-[15px] font-black text-[var(--app-text)] group-hover:text-brand-600">
              {publisherName}
            </span>
            {verified ? (
              <FiCheckCircle className="size-3.5 shrink-0 text-emerald-500" aria-label="Vérifié" />
            ) : null}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {isBusiness ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                <FiBriefcase className="size-2.5" />
                Entreprise
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <FiUser className="size-2.5" />
                Particulier
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <FiStar className="size-3.5 fill-amber-400 text-amber-400" />
              <span>
                {ratingCount > 0
                  ? `${ratingAverage.toFixed(1)} (${ratingCount})`
                  : (ratingAverage > 0 ? ratingAverage.toFixed(1) : '0')}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center">
        {currentUser?.id ? (
          !isSelf && publisherId ? (
            <SubscribeButton
              publisherType={isBusiness ? 'business' : 'user'}
              publisherId={publisherId}
              publisherName={publisherName}
              publisherPath={profilePath}
              size="sm"
              variant="secondary"
              iconOnly
              className="rounded-xl shrink-0"
            />
          ) : null
        ) : (
          <Button
            size="sm"
            variant="secondary"
            iconOnly
            icon={FiUserPlus}
            onClick={() => requireAccount("s'abonner")}
            className="size-9 rounded-xl shrink-0"
            title="Suivre"
            aria-label="Suivre"
          />
        )}
      </div>
    </div>
  )
}

export function ListingDetailPage() {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const tabs = TAB_DEFS.map((tab) => ({ ...tab, label: mt(tab.labelKey) }))
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { listingId } = useParams()
  const { guestMode = false } = useOutletContext() || {}
  const { requireAccount } = useGuestAction()
  const user = useSelector((state) => state.auth.user)
  const guestDetail = useGuestListingDetail(listingId, guestMode)
  const guestCatalog = useGuestMarketplaceListings(guestMode)
  const reduxListing = useSelector((state) =>
    state.marketplace.items.find((item) => item.id === listingId),
  )
  const reduxAllListings = useSelector((state) => state.marketplace.items)
  const listing = guestMode ? guestDetail.listing : reduxListing
  const allListings = guestMode ? guestCatalog.listings : reduxAllListings
  const videos = useSelector((state) => state.videos?.items || [])
  const { profile: ownerProfile } = usePublicationProfile(listing?.ownerId, user)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageOpen, setImageOpen] = useState(false)
  const [soldOpen, setSoldOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [quantity, setQuantity] = useState(1)
  const [question, setQuestion] = useState('')
  const isAdminViewer = Boolean(user?.role && ['admin', 'superadmin'].includes(user.role))
  const publisherProfile = usePublisherDetailProfile(listing, 'listing')

  function handleDuplicate() {
    if (!user?.id || !listing) return
    dispatch(duplicateListing({ listing, ownerId: user.id }))
    dispatch(
      addToast({
        id: `dup-${Date.now()}`,
        tone: 'success',
        message: 'Annonce dupliquée avec succès',
      }),
    )
  }

  function handleDelete() {
    if (!user?.id || !listing) return
    dispatch(deleteListing({ id: listing.id, ownerId: user.id }))
    setDeleteConfirmOpen(false)
    dispatch(
      addToast({
        id: `del-${Date.now()}`,
        tone: 'success',
        message: 'Annonce supprimée',
      }),
    )
    navigate('/marketplace')
  }

  function handleArchive() {
    if (!user?.id || !listing) return
    dispatch(updateListingStatus({ id: listing.id, status: 'archived', actorId: user.id }))
    setArchiveOpen(false)
    dispatch(
      addToast({
        id: `arch-${Date.now()}`,
        tone: 'neutral',
        message: 'Annonce archivée',
      }),
    )
  }

  function handleReactivate() {
    if (!user?.id || !listing) return
    dispatch(updateListingStatus({ id: listing.id, status: 'active', actorId: user.id }))
    dispatch(
      addToast({
        id: `react-${Date.now()}`,
        tone: 'success',
        message: 'Annonce réactivée et publiée',
      }),
    )
  }

  useEffect(() => {
    if (!listingId) return
    dispatch(incrementListingView(listingId))
    if (user?.id) {
      dispatch(markListingViewed({ userId: user.id, listingId }))
    }
  }, [dispatch, listingId, user?.id])

  const activeListings = useMemo(
    () => (allListings || []).filter((item) => item.id !== listingId && item.status === 'active'),
    [allListings, listingId],
  )

  const orderedSimilarListings = useMemo(() => {
    if (!activeListings.length) return []
    const exact = []
    const sameCat = []
    const sameCity = []
    const others = []

    for (const item of activeListings) {
      const matchCat = Boolean(listing?.category && item.category === listing.category)
      const matchCity = Boolean(listing?.city && item.city === listing.city)
      if (matchCat && matchCity) {
        exact.push(item)
      } else if (matchCat) {
        sameCat.push(item)
      } else if (matchCity) {
        sameCity.push(item)
      } else {
        others.push(item)
      }
    }

    return [...exact, ...sameCat, ...sameCity, ...others]
  }, [activeListings, listing])

  const [similarDisplayCount, setSimilarDisplayCount] = useState(12)
  const similarSentinelRef = useRef(null)
  const similarLoadingMoreRef = useRef(false)

  const renderedSimilarItems = useMemo(() => {
    if (!orderedSimilarListings.length) return []
    const stream = []
    const videoPool = videos || []
    let videoIndex = 0
    let cycle = 0
    let nextVideoInterval = 6
    let listingsSinceVideo = 0

    while (stream.length < similarDisplayCount) {
      const cycleListings =
        cycle === 0
          ? orderedSimilarListings
          : pickShuffledWindow(
              orderedSimilarListings,
              `${listingId}:sim-cycle:${cycle}`,
              0,
              orderedSimilarListings.length,
            )

      for (let i = 0; i < cycleListings.length && stream.length < similarDisplayCount; i++) {
        const item = cycleListings[i]
        stream.push({
          kind: 'listing',
          data: item,
          id: cycle === 0 ? `sim-${item.id}` : `sim-${item.id}-c${cycle}-${i}`,
        })
        listingsSinceVideo++

        if (
          videoPool.length > 0 &&
          listingsSinceVideo >= nextVideoInterval &&
          stream.length < similarDisplayCount
        ) {
          const video = videoPool[videoIndex % videoPool.length]
          stream.push({
            kind: 'video',
            data: video,
            id: `sim-vid-${video.id}-c${cycle}-${videoIndex}`,
          })
          videoIndex++
          listingsSinceVideo = 0
          nextVideoInterval = 5 + (((i + cycle * 7) * 3) % 3)
        }
      }

      cycle++
      if (cycle > 500) break
    }

    return stream
  }, [orderedSimilarListings, videos, similarDisplayCount, listingId])

  useEffect(() => {
    const el = similarSentinelRef.current
    if (!el || !orderedSimilarListings.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !similarLoadingMoreRef.current) {
          similarLoadingMoreRef.current = true
          setSimilarDisplayCount((prev) => prev + 8)
          setTimeout(() => {
            similarLoadingMoreRef.current = false
          }, 250)
        }
      },
      { rootMargin: '800px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [orderedSimilarListings.length])

  useEffect(() => {
    if (!orderedSimilarListings.length) return undefined
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollPosition = window.innerHeight + window.scrollY
        const threshold = document.documentElement.scrollHeight - 900
        if (scrollPosition >= threshold && !similarLoadingMoreRef.current) {
          similarLoadingMoreRef.current = true
          setSimilarDisplayCount((prev) => prev + 8)
          setTimeout(() => {
            similarLoadingMoreRef.current = false
          }, 250)
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [orderedSimilarListings.length])

  if (guestMode && guestDetail.loading) {
    return <Card>{mt('marketplace.page.searchPlaceholder')}</Card>
  }

  if (!listing) return <Card>{mt('marketplace.detail.notFound')}</Card>

  const images = listing.images || []
  const rules = listingRulesFor(listing.type)
  const typeOption = LISTING_TYPES_META.find(({ value }) => value === listing.type)
  const categoryOption = categoriesForType(listing.type).find(
    ({ value }) => value === listing.category,
  )
  const listingTypeLabel = typeOption ? listingOptionLabel(t, typeOption) : listing.type
  const listingCategoryLabel = categoryOption
    ? listingOptionLabel(t, categoryOption)
    : listing.category
  const stock = rules.showStock ? Number(listing.stock ?? 1) : null
  const specificDetails = listingSpecificDetails(listing, t)
  const conditionOption = LISTING_CONDITIONS.find(({ value }) => value === listing.condition)
  const characteristicItems = [
    { label: mt('marketplace.common.category'), value: listingCategoryLabel },
    { label: mt('marketplace.common.type'), value: listingTypeLabel },
    { label: mt('marketplace.common.brand'), value: listing.brand },
    { label: mt('marketplace.common.model'), value: listing.model },
    { label: mt('marketplace.common.color'), value: listing.color },
    rules.showCondition
      ? {
          label: mt('marketplace.common.condition'),
          value: conditionOption
            ? listingOptionLabel(t, conditionOption)
            : optionLabel(LISTING_CONDITIONS, listing.condition),
        }
      : null,
    rules.showStock
      ? { label: mt('marketplace.detail.stockAvailable'), value: `${stock}` }
      : null,
    { label: mt('marketplace.common.district'), value: listing.district },
    ...specificDetails,
  ].filter(Boolean)
  const activeImage = selectedImage || images[0]
  const activeImageIndex = Math.max(
    0,
    images.findIndex((image) => image === activeImage),
  )
  const total = Number(listing.price || 0) * quantity
  const isListingOwner = Boolean(user?.id && listing.ownerId === user.id)
  const mobilePagePadding = isListingOwner
    ? 'max-md:pb-[calc(1.95rem+env(safe-area-inset-bottom))]'
    : 'max-md:pb-[calc(6.5rem+env(safe-area-inset-bottom))]'

  function selectImageAt(nextIndex) {
    if (!images.length) return
    const bounded = (nextIndex + images.length) % images.length
    setSelectedImage(images[bounded])
  }

  function submitQuestion(event) {
    event.preventDefault()
    if (requireAccount('poser une question')) return
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
    <div className={`grid min-w-0 gap-5 overflow-hidden ${mobilePagePadding} sm:gap-7 md:pb-28 xl:overflow-visible xl:pb-0`}>
      <nav aria-label={mt('marketplace.detail.breadcrumb')} className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-[var(--app-text-muted)]">
        <Link to="/marketplace">{mt('marketplace.common.name')}</Link>
        <span>/</span>
        <span>{listingCategoryLabel}</span>
        <span>/</span>
        <strong className="truncate text-[var(--app-text)]">{listing.title}</strong>
      </nav>

      <PageHeader
        title={listing.title}
        actions={<BackButton fallback="/marketplace" />}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="grid min-w-0 gap-6">
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
                  {stock
                    ? mt('marketplace.common.availableCount', { count: stock })
                    : mt('marketplace.common.outOfStock')}
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

          <Card className="min-w-0 overflow-hidden p-4 sm:p-6">
            <Tabs active={activeTab} items={tabs} onChange={setActiveTab} label={mt('marketplace.detail.tabsLabel')} />
            <div className="mt-6">
              {activeTab === 'description' ? (
                <div>
                  <h2 className="text-xl font-black">{mt('marketplace.detail.about')}</h2>
                  <ExpandableLinkifiedText
                    as="p"
                    text={listing.description}
                    maxLines={4}
                    preserveWhitespace="pre-line"
                    className="mt-4 leading-8 text-[var(--app-text-muted)]"
                    buttonClassName="mt-2 font-bold text-brand-600 dark:text-brand-400"
                  />
                </div>
              ) : null}
              {activeTab === 'details' ? <DetailFacts items={characteristicItems} /> : null}
              {activeTab === 'delivery' ? (
                <DetailFacts
                  items={[
                    {
                      label: mt('marketplace.detail.deliveryModes'),
                      value: (listing.deliveryOptions || ['pickup'])
                        .map((value) => {
                          const option = DELIVERY_OPTIONS.find((item) => item.value === value)
                          return option
                            ? listingOptionLabel(t, option)
                            : optionLabel(DELIVERY_OPTIONS, value)
                        })
                        .join(', '),
                    },
                    ...(Array.isArray(listing.shippingCarriers) && listing.shippingCarriers.length
                      ? [
                          {
                            label: mt('marketplace.detail.shippingCarriers'),
                            value: listing.shippingCarriers
                              .map((carrier) => {
                                const id = typeof carrier === 'string' ? carrier : carrier.id
                                const eta =
                                  typeof carrier === 'object' && carrier?.etaHint
                                    ? carrier.etaHint
                                    : ''
                                const label = mt(`marketplace.shipping.carriers.${id}`)
                                const name =
                                  label && label !== `marketplace.shipping.carriers.${id}`
                                    ? label
                                    : id
                                return eta ? `${name} (${eta})` : name
                              })
                              .join(' · '),
                          },
                        ]
                      : []),
                    {
                      label: mt('marketplace.detail.deliveryFee'),
                      value: listing.deliveryFee
                        ? formatMoney(listing.deliveryFee, listing.currency)
                        : mt('marketplace.common.freeOrNegotiable'),
                    },
                    { label: mt('marketplace.detail.delay'), value: listing.deliveryDelay },
                    { label: mt('marketplace.common.warranty'), value: listing.warranty },
                    {
                      label: mt('marketplace.common.returnPolicy'),
                      value: listing.returnPolicy,
                    },
                    {
                      label: mt('marketplace.detail.paymentsAccepted'),
                      value: (listing.paymentMethods || [mt('marketplace.common.negotiable')]).join(
                        ', ',
                      ),
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

          {publisherProfile ? (
            <div className="grid gap-3 xl:hidden">
              <CompactPublisherCard
                publisherProfile={publisherProfile}
                listing={listing}
                ownerProfile={ownerProfile}
                currentUser={user}
                requireAccount={requireAccount}
              />
              <PublisherPublicationsStrip
                currentId={listing.id}
                ownerId={publisherProfile.ownerId}
                publications={publisherProfile.publications}
                allPath={publisherProfile.publicationsPath}
                limit={5}
              />
            </div>
          ) : null}
        </div>

        <aside className="grid min-w-0 content-start gap-5 xl:sticky xl:top-28">
          <Card className="hidden min-w-0 overflow-hidden xl:block">
            <div className="flex flex-wrap gap-2">
              <Badge tone="violet">{listingTypeLabel}</Badge>
              <Badge tone="success">{listing.status}</Badge>
              {rules.showStock ? (
                <Badge tone={stock ? 'info' : 'danger'}>
                  {stock
                    ? mt('marketplace.common.availableCount', { count: stock })
                    : mt('marketplace.common.outOfStock')}
                </Badge>
              ) : null}
            </div>
            <div className="mt-5">
              <PriceBlock listing={listing} />
            </div>
            <ListingActionPanel
              dispatch={dispatch}
              listing={listing}
              quantity={quantity}
              setQuantity={setQuantity}
              stock={stock}
              total={total}
            />
            <p className="mt-5 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              {mt('marketplace.detail.paymentWarning')}
            </p>
          </Card>

          {publisherProfile ? (
            <CompactPublisherCard
              publisherProfile={publisherProfile}
              listing={listing}
              ownerProfile={ownerProfile}
              currentUser={user}
              requireAccount={requireAccount}
              className="hidden xl:flex"
            />
          ) : null}

          {isListingOwner ? (
            <Card>
              <div className="grid gap-2">
                <Link to={`/marketplace/${listing.id}/edit`}>
                  <Button className="w-full" variant="secondary" icon={FiEdit2}>
                    {mt('marketplace.detail.editListing')}
                  </Button>
                </Link>
                {listing.status === 'active' ? (
                  <Button variant="danger" onClick={() => setSoldOpen(true)}>
                    {mt('marketplace.common.markSold')}
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : null}
          {isAdminViewer ? (
            <Card className="border border-brand-100 bg-brand-50/60 dark:border-brand-900/40 dark:bg-brand-950/20">
              <div className="flex items-center gap-2">
                <FiShield className="text-xl text-brand-700" />
                <h2 className="font-black">{mt('marketplace.detail.adminActions')}</h2>
              </div>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                {mt('marketplace.detail.adminDescription')}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => dispatch(updateListingStatus({ id: listing.id, status: 'active' }))}>
                  {mt('marketplace.common.publish')}
                </Button>
                <Button variant="secondary" onClick={() => dispatch(updateListingStatus({ id: listing.id, status: 'sold' }))}>
                  {mt('marketplace.common.markSold')}
                </Button>
                <Button variant="danger" onClick={() => dispatch(updateListingStatus({ id: listing.id, status: 'archived' }))}>
                  {mt('marketplace.common.archive')}
                </Button>
              </div>
            </Card>
          ) : null}
        </aside>
      </div>

      {publisherProfile ? (
        <div className="hidden min-w-0 xl:block">
          <PublisherPublicationsStrip
            currentId={listing.id}
            ownerId={publisherProfile.ownerId}
            publications={publisherProfile.publications}
            allPath={publisherProfile.publicationsPath}
            limit={8}
          />
        </div>
      ) : null}

      {renderedSimilarItems.length ? (
        <section className="grid gap-4 mt-6">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight">
                {mt('marketplace.detail.similarTitle') || 'Annonces similaires & Recommandations'}
              </h2>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                Produits similaires puis exploration continue du catalogue
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 shrink-0">
              Flux continu
            </span>
          </div>
          <CatalogGrid
            lazy={false}
            columns={MARKETPLACE_DISCOVER_GRID_COLUMNS}
            gap={MARKETPLACE_DISCOVER_GRID_GAP}
            className="min-w-0 w-full"
          >
            {renderedSimilarItems.map((item, index) => (
              <RevealListItem
                key={item.id}
                index={index}
                className={`${MARKETPLACE_DISCOVERY_CARD_HEIGHT} min-w-0 overflow-hidden`}
              >
                {item.kind === 'video' ? (
                  <MarketplaceVideoCard
                    video={item.data}
                    badgeLabel={mt('marketplace.page.feed.badgeVideo')}
                  />
                ) : (
                  <MarketplaceListingCard
                    listing={item.data}
                    guestMode={guestMode}
                    onGuestInteract={() => requireAccount('aimer cette annonce')}
                    layout="rail"
                  />
                )}
              </RevealListItem>
            ))}
          </CatalogGrid>

          <div
            ref={similarSentinelRef}
            className="h-10 w-full flex items-center justify-center my-4"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--app-text-muted)] animate-pulse">
              <span className="inline-block size-2 rounded-full bg-brand-500 animate-ping shrink-0" />
              <span>Recharge progressive des annonces...</span>
            </div>
          </div>
        </section>
      ) : null}

      <DetailFloatingActions
        isOwner={isListingOwner}
        ownerId={listing.ownerId}
        entity={listing}
        relatedId={listing.id}
        relatedPath={`/marketplace/${listing.id}`}
        relatedType="listing"
        title={listing.title}
        autoHintMs={5000}
        onContact={() => dispatch(incrementListingContact(listing.id))}
        onShared={() => dispatch(incrementListingShare(listing.id))}
        sourceType="listing"
        sourceId={listing.id}
        editTo={isListingOwner ? `/marketplace/${listing.id}/edit` : undefined}
        onArchive={isListingOwner ? () => setArchiveOpen(true) : undefined}
        onReactivate={isListingOwner ? handleReactivate : undefined}
        onDuplicate={isListingOwner ? handleDuplicate : undefined}
        onMarkSold={isListingOwner && listing.status === 'active' ? () => setSoldOpen(true) : undefined}
        onDelete={isListingOwner ? () => setDeleteConfirmOpen(true) : undefined}
        onReport={
          !isListingOwner
            ? () => {
                if (requireAccount('signaler une annonce')) return
                setReportOpen(true)
              }
            : undefined
        }
        reportLabel={mt('marketplace.detail.report')}
      />

      <ImageGalleryViewer
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        title={mt('marketplace.detail.gallery')}
        images={images}
        activeIndex={activeImageIndex}
        onSelectIndex={selectImageAt}
        alt={listing.title}
        countLabel={
          images.length > 1
            ? mt('marketplace.detail.imageCount', {
                current: activeImageIndex + 1,
                total: images.length,
              })
            : null
        }
      />

      <ConfirmDialog
        open={soldOpen}
        title={mt('marketplace.detail.soldConfirmTitle')}
        description={mt('marketplace.detail.soldConfirmDescription')}
        onCancel={() => setSoldOpen(false)}
        onConfirm={() => {
          dispatch(updateListingStatus({ id: listing.id, status: 'sold', actorId: user.id }))
          setSoldOpen(false)
        }}
      />

      <ConfirmDialog
        open={archiveOpen}
        title={phase3Text(t, 'publications.confirm.archive.title') || "Archiver l'annonce"}
        description={
          phase3Text(t, 'publications.confirm.archive.description') ||
          "Êtes-vous sûr de vouloir archiver cette annonce ? Elle ne sera plus visible sur le marketplace."
        }
        confirmLabel={mt('marketplace.common.archive') || "Archiver"}
        onCancel={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        tone="danger"
        title={phase3Text(t, 'publications.confirm.delete.title') || "Supprimer l'annonce"}
        description={
          phase3Text(t, 'publications.confirm.delete.description') ||
          "Êtes-vous sûr de vouloir supprimer définitivement cette annonce ? Cette action est irréversible."
        }
        confirmLabel={mt('marketplace.common.delete') || "Supprimer"}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />

      {user?.id ? (
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          title={mt('marketplace.detail.reportTitle')}
          userId={user.id}
          onSubmit={async ({ reason, evidenceUrl }) => {
            dispatch(
              reportListing({
                listingId: listing.id,
                reporterId: user.id,
                reason,
                evidenceUrl,
              }),
            )
            dispatch(
              addToast({
                title: mt('marketplace.detail.reportToastTitle'),
                message: mt('marketplace.detail.reportToastBody'),
                tone: 'success',
              }),
            )
          }}
        />
      ) : null}
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
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const hasMultiple = images.length > 1
  const { imageRef, imageSwipeHandlers } = useSwipeDownToClose(null, hasMultiple, activeImage, {
    onPrevious: () => onSelectIndex(activeImageIndex - 1),
    onNext: () => onSelectIndex(activeImageIndex + 1),
    lockBody: false,
  })

  return (
    <Card className="overflow-hidden p-4 sm:p-4">
      <div
        ref={imageRef}
        className="group relative overflow-hidden rounded-[1.5rem] bg-slate-900 text-white"
        {...imageSwipeHandlers}
      >
        <div className="relative flex h-[280px] sm:h-[380px] md:h-[480px] lg:h-[583px] w-full items-center justify-center">
          {activeImage ? (
            <img
              src={activeImage}
              alt={listing.title}
              className="max-h-full max-w-full object-contain"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <Placeholder listing={listing} />
          )}
          <button
            type="button"
            className="absolute inset-x-1/3 inset-y-0 z-10"
            onClick={onOpen}
            aria-label={mt('marketplace.detail.openGallery')}
          />
          <button
            type="button"
            className="absolute right-4 top-4 z-20 grid size-11 place-items-center rounded-full bg-white text-slate-950 shadow-xl"
            onClick={onOpen}
            aria-label={mt('marketplace.detail.openGallery')}
          >
            <FiMaximize2 />
          </button>
        </div>
        {hasMultiple ? (
          <>
            <button
              type="button"
              className="pointer-events-none absolute left-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:scale-110"
              onClick={() => onSelectIndex(activeImageIndex - 1)}
              aria-label={mt('marketplace.detail.previousImage')}
            >
              <span className="pointer-events-auto grid size-full place-items-center">
                <FiChevronLeft />
              </span>
            </button>
            <button
              type="button"
              className="pointer-events-none absolute right-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:scale-110"
              onClick={() => onSelectIndex(activeImageIndex + 1)}
              aria-label={mt('marketplace.detail.nextImage')}
            >
              <span className="pointer-events-auto grid size-full place-items-center">
                <FiChevronRight />
              </span>
            </button>
          </>
        ) : null}
      </div>
      {images.length ? (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hidden touch-pan-x sm:grid sm:grid-cols-8 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => onSelect(image)}
              aria-label={mt('marketplace.detail.showPhoto', {
                index: index + 1,
                title: listing.title,
              })}
              aria-pressed={image === activeImage}
              className={`h-[64px] sm:h-[72px] w-[64px] sm:w-full shrink-0 sm:shrink overflow-hidden rounded-2xl transition ${
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
          {mt('marketplace.detail.noPhotoYet')}
        </p>
      )}
    </Card>
  )
}

function Placeholder({ listing }) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  return (
    <div className="text-center">
      <FiShoppingBag className="mx-auto text-6xl" />
      <strong className="mt-4 block text-xl">{listing.title}</strong>
      <span className="mt-2 block text-sm text-white/70">{mt('marketplace.detail.brandMarketplace')}</span>
    </div>
  )
}

function ListingPurchaseOptions({ listing, quantity, setQuantity, stock, total }) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  return (
    <>
      {listing.type === 'product' && stock > 0 ? (
        <label className="grid gap-2 text-sm font-bold">
          {mt('marketplace.common.quantity')}
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
          {mt('marketplace.detail.estimatedTotal')}{' '}
          <strong>{formatMoney(total, listing.currency)}</strong>
        </p>
      ) : null}
    </>
  )
}

function ListingActionButtons({ dispatch, listing }) {
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
    <div className="grid min-w-0 gap-1">
      <ContactButton className="w-full" {...contactProps} />
      <AccountFavoriteButton
        relatedId={listing.id}
        relatedType="listing"
        title={listing.title}
        path={`/marketplace/${listing.id}`}
        entity={listing}
        variant="solid"
        className="w-full !shadow-none"
      />
    </div>
  )
}

function ListingActionPanel({
  dispatch,
  listing,
  quantity,
  setQuantity,
  stock,
  total,
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
      <div className="mt-2">
        <ListingActionButtons dispatch={dispatch} listing={listing} />
      </div>
    </>
  )
}

function PriceBlock({ listing }) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const hasDiscount = listing.originalPrice && listing.discountPercent
  if (!listing.price)
    return <strong className="text-3xl text-brand-700">{mt('marketplace.common.onQuote')}</strong>
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
          {mt('marketplace.detail.saveAmount', {
            amount: formatMoney(listing.originalPrice - listing.price, listing.currency),
          })}
        </span>
      </div>
    )
  }
  return <strong className="text-3xl text-brand-700">{formatMoney(listing.price, listing.currency)}</strong>
}

function Questions({ dispatch, listing, question, setQuestion, submitQuestion, user }) {
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const [answers, setAnswers] = useState({})
  const [replyingId, setReplyingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [questionToDelete, setQuestionToDelete] = useState(null)
  const isOwner = Boolean(user?.id && listing.ownerId === user.id)

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

  function submitEditQuestion(event, questionId) {
    event.preventDefault()
    const text = editText.trim()
    if (text.length < 5) return
    dispatch(
      updateListingQuestion({
        listingId: listing.id,
        questionId,
        authorId: user?.id,
        text,
      }),
    )
    dispatch(addToast({ type: 'success', message: 'Question modifiée avec succès.' }))
    setEditingId(null)
    setEditText('')
  }

  return (
    <div>
      <ConfirmDialog
        open={Boolean(questionToDelete)}
        title="Supprimer la question"
        description="Êtes-vous sûr de vouloir supprimer définitivement cette question ?"
        confirmLabel="Supprimer"
        tone="danger"
        onCancel={() => setQuestionToDelete(null)}
        onConfirm={() => {
          if (!questionToDelete) return
          dispatch(
            deleteListingQuestion({
              listingId: listing.id,
              questionId: questionToDelete,
              authorId: user?.id,
            }),
          )
          dispatch(addToast({ type: 'info', message: 'Question supprimée.' }))
          setQuestionToDelete(null)
        }}
      />

      {!isOwner ? (
        <form className="grid gap-3" onSubmit={submitQuestion}>
          <label className="grid gap-2 text-sm font-bold">
            {mt('marketplace.detail.askQuestion')}
            <textarea
              className="min-h-24 rounded-2xl bg-[var(--app-surface-muted)] p-4"
              placeholder={mt('marketplace.detail.askPlaceholder')}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </label>
          <Button type="submit" disabled={question.trim().length < 5}>
            {mt('marketplace.detail.publishQuestion')}
          </Button>
        </form>
      ) : (
        <p className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm text-[var(--app-text-muted)]">
          {mt('marketplace.detail.ownerQuestionsHint')}
        </p>
      )}
      <div className="mt-6 grid gap-3">
        {(listing.questions || []).length ? (
          listing.questions.map((item) => {
            const isAuthor = Boolean(user?.id && (item.authorId === user.id || item.author_id === user.id))
            const canManage = isAuthor || user?.role === 'admin' || user?.role === 'superadmin'

            return (
              <div key={item.id} className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <EntityVerifiedName
                    as="strong"
                    name={item.authorName}
                    userId={item.authorId}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--app-text-muted)]">
                      {formatShortDate(item.createdAt)}
                    </span>
                    {canManage && editingId !== item.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Modifier ma question"
                          aria-label="Modifier ma question"
                          onClick={() => {
                            setEditingId(item.id)
                            setEditText(item.text)
                          }}
                          className="rounded-lg p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-brand-600 transition cursor-pointer"
                        >
                          <FiEdit2 className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          title="Supprimer ma question"
                          aria-label="Supprimer ma question"
                          onClick={() => setQuestionToDelete(item.id)}
                          className="rounded-lg p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-rose-600 transition cursor-pointer"
                        >
                          <FiTrash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {editingId === item.id ? (
                  <form className="mt-3 grid gap-2.5" onSubmit={(event) => submitEditQuestion(event, item.id)}>
                    <textarea
                      className="min-h-20 w-full rounded-xl bg-[var(--app-surface)] p-3 text-sm border border-[var(--app-border)] focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={editText}
                      onChange={(event) => setEditText(event.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" size="sm" disabled={editText.trim().length < 5}>
                        {mt('marketplace.common.save') || 'Enregistrer'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingId(null)
                          setEditText('')
                        }}
                      >
                        {mt('marketplace.common.cancel') || 'Annuler'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-2 text-sm">
                    <LinkifiedText text={item.text} preserveWhitespace="pre-line" />
                  </p>
                )}

                {item.answer ? (
                  <div className="mt-3 rounded-xl bg-[var(--app-surface)] p-3 text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-accent)]">
                      {mt('marketplace.detail.sellerAnswer')}
                    </p>
                    <p className="mt-1">
                      <LinkifiedText text={item.answer} preserveWhitespace="pre-line" />
                    </p>
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
                        {mt('marketplace.detail.yourPublicAnswer')}
                        <textarea
                          className="min-h-24 rounded-2xl bg-[var(--app-surface)] p-4"
                          placeholder={mt('marketplace.detail.answerPlaceholder')}
                          value={answers[item.id] || ''}
                          onChange={(event) =>
                            setAnswers((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={(answers[item.id] || '').trim().length < 2}>
                          {mt('marketplace.detail.publishAnswer')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setReplyingId(null)}>
                          {mt('marketplace.common.cancel')}
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
                      {mt('marketplace.detail.reply')}
                    </Button>
                  )
                ) : (
                  <p className="mt-3 text-xs text-[var(--app-text-faint)]">
                    {mt('marketplace.detail.waitingSellerAnswer')}
                  </p>
                )}
              </div>
            )
          })
        ) : (
          <p className="text-sm text-[var(--app-text-muted)]">{mt('marketplace.detail.noPublicQuestions')}</p>
        )}
      </div>
    </div>
  )
}
