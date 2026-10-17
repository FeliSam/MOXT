import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiDownload,
  FiExternalLink,
  FiPackage,
  FiPlay,
  FiPlus,
  FiShare,
  FiShield,
  FiSmartphone,
  FiStar,
  FiTag,
  FiUser,
  FiX,
  FiZap,
} from 'react-icons/fi'
import { LuSparkles } from 'react-icons/lu'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useLanguage } from '../../contexts/useLanguage'
import { isNative } from '../../platform/capacitor'
import { appReleaseService } from '../../services/appReleaseService'
import { supabase } from '../../services/supabaseClient'
import {
  BADGE_PALETTES,
  NotificationBadgeIcon,
} from '../communications/NotificationBottomSheet'
import { AvatarDicebearEditor } from '../account/avatarDicebear/AvatarDicebearEditor'

export function detectDevicePlatform() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'desktop'
  const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase()
  if (/ipad|iphone|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

export function isAppInstalled() {
  if (typeof window === 'undefined') return false
  if (isNative) return true
  if (window.matchMedia?.('(display-mode: standalone)')?.matches) return true
  if (window.navigator?.standalone === true) return true
  return false
}

// Global cached broadcasts to avoid re-fetching on every banner in the feed
let cachedBroadcasts = null
let fetchBroadcastsPromise = null

async function getMarketplaceBroadcasts() {
  if (cachedBroadcasts) return cachedBroadcasts
  if (fetchBroadcastsPromise) return fetchBroadcastsPromise

  fetchBroadcastsPromise = (async () => {
    if (!supabase) return []
    try {
      const { data, error } = await supabase
        .from('admin_broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15)

      if (!error && Array.isArray(data)) {
        cachedBroadcasts = data
        return data
      }
      return []
    } catch {
      return []
    } finally {
      fetchBroadcastsPromise = null
    }
  })()

  return fetchBroadcastsPromise
}

export function MarketplaceFeedBanner({ bannerIndex = 0, onInteract }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth?.user)

  const [broadcasts, setBroadcasts] = useState(() => cachedBroadcasts || [])
  const [iosModalOpen, setIosModalOpen] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [apkDownloadUrl, setApkDownloadUrl] = useState(
    'https://moxtapp.ru/downloads/Moxt.apk',
  )

  const platform = useMemo(() => detectDevicePlatform(), [])
  const installed = useMemo(() => isAppInstalled(), [])

  useEffect(() => {
    let cancelled = false
    void getMarketplaceBroadcasts().then((items) => {
      if (!cancelled && items?.length) {
        setBroadcasts(items)
      }
    })
    void appReleaseService.getActiveRelease('android').then((release) => {
      if (!cancelled && release?.downloadUrl) {
        setApkDownloadUrl(release.downloadUrl)
      }
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Check if there is an admin broadcast assigned to this slot
  const currentBroadcast = useMemo(() => {
    if (!broadcasts.length) return null
    // Filter to broadcasts with an image or marked for marketplace
    const eligible = broadcasts.filter((b) => {
      const filter = b.target_filter || {}
      return filter.showInMarketplace !== false || filter.imageUrl || filter.bannerUrl
    })
    if (!eligible.length) return null
    return eligible[bannerIndex % eligible.length]
  }, [broadcasts, bannerIndex])

  // Built-in rotating Moxt promotional banners when no broadcast is assigned
  const builtInVariant = useMemo(() => {
    const variants = []

    // 1. Mobile app install (if not already installed)
    if (!installed) {
      if (platform === 'android') {
        variants.push('install_android')
      } else if (platform === 'ios') {
        variants.push('install_ios')
      } else {
        variants.push('install_general')
      }
    }

    // 2. Business promotion (for users or professionals)
    variants.push('business_create')

    // 3. Colis & Bagages Express
    variants.push('parcels_promo')

    // 4. Moxt transfers & devises
    variants.push('transfers_promo')

    // 5. Avatar customization
    variants.push('avatar_customize')

    // 6. Moxt Jobs & Emploi
    variants.push('jobs_promo')

    // 7. Événements & Billetterie
    variants.push('events_promo')

    // 8. Vidéos & Démonstrations en direct
    variants.push('videos_promo')

    return variants[bannerIndex % variants.length] || 'business_create'
  }, [installed, platform, bannerIndex])

  function handleActionClick(link, defaultAction, event) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    onInteract?.()
    if (link) {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank', 'noopener,noreferrer')
      } else {
        navigate(link)
      }
      return
    }
    defaultAction?.()
  }

  // --- RENDERING ADMIN BROADCAST BANNER ---
  if (currentBroadcast) {
    const filter = currentBroadcast.target_filter || {}
    const imageUrl = filter.imageUrl || filter.bannerUrl || currentBroadcast.image_url || null
    const paletteKey = currentBroadcast.badge_color || 'brand'
    const palette = BADGE_PALETTES[paletteKey] || BADGE_PALETTES.brand
    const badgeText = currentBroadcast.badge_text || 'ANNONCE'
    const badgeIcon = currentBroadcast.badge_icon || 'tag'
    const actionLabel = currentBroadcast.action_label || 'Découvrir'

    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="group relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-md transition-all hover:shadow-lg">
          <div className={`grid ${imageUrl ? 'md:grid-cols-12' : 'grid-cols-1'} items-center`}>
            {imageUrl ? (
              <div className="relative h-44 sm:h-52 md:h-full md:min-h-[170px] md:col-span-5 overflow-hidden bg-slate-900/10">
                <img
                  src={imageUrl}
                  alt={currentBroadcast.title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-black tracking-wide text-white backdrop-blur-md">
                  <NotificationBadgeIcon name={badgeIcon} className="text-xs" />
                  <span>{badgeText}</span>
                </div>
              </div>
            ) : null}

            <div className={`p-4 sm:p-5 ${imageUrl ? 'md:col-span-7' : ''} flex flex-col justify-between gap-3`}>
              <div>
                {!imageUrl ? (
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase">
                    <span className={`size-2 rounded-full ${palette.dot}`} />
                    <span className={palette.badge}>{badgeText}</span>
                  </div>
                ) : null}

                <h3 className="text-base sm:text-lg font-black leading-snug text-[var(--app-text)]">
                  {currentBroadcast.title}
                </h3>

                <p className="mt-1 text-xs sm:text-sm text-[var(--app-text-muted)] line-clamp-2 leading-relaxed">
                  {currentBroadcast.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Diffusion Partenaire Moxt
                </span>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={FiExternalLink}
                  onClick={(e) => handleActionClick(currentBroadcast.link, null, e)}
                  className="shadow-sm active:scale-95 cursor-pointer"
                >
                  {actionLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDERING BUILT-IN MOXT PROMOTIONAL BANNERS ---

  // 1. Android App Download
  if (builtInVariant === 'install_android') {
    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
            <img src="/assets/services/quick-marketplace.png" alt="" className="size-full object-contain" />
          </div>

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <FiSmartphone className="text-xl" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1">
                  <LuSparkles className="text-xs" />
                  <span>Application Officielle Android</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                  Téléchargez Moxt pour Android (.APK)
                </h3>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                  Profitez d’une rapidité maximale, des notifications instantanées et d’une navigation fluide sans quitter votre écran.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <a
                href={apkDownloadUrl}
                download="Moxt.apk"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95 cursor-pointer"
              >
                <FiDownload className="text-sm" />
                <span>Télécharger l’APK</span>
              </a>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => handleActionClick('/install', null, e)}
              >
                Détails
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. iOS Safari Add to Home
  if (builtInVariant === 'install_ios') {
    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 via-brand-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
            <img src="/assets/install/iphone-add-home-fr.png" alt="" className="size-full object-contain" />
          </div>

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
                <FiSmartphone className="text-xl" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 mb-1">
                  <span>iPhone & iPad (iOS)</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                  Installez Moxt sur votre écran d’accueil
                </h3>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                  Accédez à vos annonces en plein écran en 2 clics avec Safari : Partager 📤 puis « Sur l’écran d’accueil ➕ ».
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={FiShare}
              onClick={(e) => {
                e.stopPropagation()
                setIosModalOpen(true)
              }}
              className="self-end sm:self-center shrink-0 cursor-pointer"
            >
              Guide d’installation
            </Button>
          </div>
        </div>

        {/* Modal Guide iOS */}
        <Modal
          open={iosModalOpen}
          onClose={() => setIosModalOpen(false)}
          title="Installer Moxt sur iPhone"
        >
          <div className="grid gap-4 py-2">
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-500 text-sm font-black text-white">
                1
              </span>
              <div>
                <strong className="text-sm font-bold text-[var(--app-text)]">
                  Appuyez sur « Partager »
                </strong>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                  Dans Safari au bas de votre écran, cliquez sur l’icône carrée avec la flèche pointant vers le haut (📤).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-500 text-sm font-black text-white">
                2
              </span>
              <div>
                <strong className="text-sm font-bold text-[var(--app-text)]">
                  Choisissez « Sur l’écran d’accueil »
                </strong>
                <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                  Faites défiler le menu des options et appuyez sur l’icône ➕ « Sur l’écran d’accueil », puis validez par « Ajouter ».
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                🎉 Vous aurez l’icône officielle Moxt directement sur votre écran d’iPhone !
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full justify-center mt-2 cursor-pointer"
              onClick={() => setIosModalOpen(false)}
            >
              Compris !
            </Button>
          </div>
        </Modal>
      </div>
    )
  }

  // 3. Business Creation & Promotion
  if (builtInVariant === 'business_create') {
    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/15 via-amber-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
            <img src="/assets/services/service-businesses.png" alt="" className="size-full object-contain" />
          </div>

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/20">
                <FiBriefcase className="text-xl" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand-300 mb-1">
                  <span>Moxt Business</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                  Vous avez un commerce ou une boutique ?
                </h3>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                  Créez gratuitement votre vitrine d’entreprise sur Moxt, publiez votre catalogue et touchez des milliers de clients locaux et internationaux.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={FiPlus}
              onClick={(e) => handleActionClick('/businesses/new', null, e)}
              className="self-end sm:self-center shrink-0 shadow-sm cursor-pointer"
            >
              Créer ma page Pro
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 4. Parcels & Baggage Transport Promo
  if (builtInVariant === 'parcels_promo') {
    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
            <img src="/assets/services/quick-parcel.png" alt="" className="size-full object-contain" />
          </div>

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                <FiPackage className="text-xl" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 mb-1">
                  <span>Colis & Livraisons Express</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                  Envoyez vos colis et valises entre villes et pays
                </h3>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                  Faites voyager vos colis en toute sérénité grâce à notre réseau de voyageurs vérifiés et de transporteurs partenaires certifiés.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={FiArrowRight}
              onClick={(e) => handleActionClick('/parcels', null, e)}
              className="self-end sm:self-center shrink-0 shadow-sm cursor-pointer"
            >
              Expédier un colis
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 5. Jobs & Recruitment Promo
  if (builtInVariant === 'jobs_promo') {
    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/15 via-blue-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
            <img src="/assets/services/quick-job.png" alt="" className="size-full object-contain" />
          </div>

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <FiBriefcase className="text-xl" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
                  <span>Emploi & Recrutement</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                  Trouvez un job ou recrutez des talents qualifiés
                </h3>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                  Découvrez les opportunités d'emploi récentes ou publiez votre offre pour attirer les meilleurs profils de votre communauté.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={FiArrowRight}
              onClick={(e) => handleActionClick('/jobs', null, e)}
              className="self-end sm:self-center shrink-0 shadow-sm cursor-pointer"
            >
              Voir les offres
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 6. Events & Community Promo
  if (builtInVariant === 'events_promo') {
    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
            <img src="/assets/services/quick-event.png" alt="" className="size-full object-contain" />
          </div>

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20">
                <FiCalendar className="text-xl" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300 mb-1">
                  <span>Événements & Billetterie</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                  Concerts, salons et événements communautaires
                </h3>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                  Ne manquez aucun événement près de chez vous. Réservez vos entrées ou annoncez votre propre rencontre d’affaires.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={FiArrowRight}
              onClick={(e) => handleActionClick('/events', null, e)}
              className="self-end sm:self-center shrink-0 shadow-sm cursor-pointer"
            >
              Découvrir les événements
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 7. Video Reels Promo
  if (builtInVariant === 'videos_promo') {
    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
            <img src="/assets/services/service-community.png" alt="" className="size-full object-contain" />
          </div>

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
                <FiPlay className="text-xl" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1">
                  <span>Vidéos & Reels Produits</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                  Découvrez les articles en démonstration vidéo
                </h3>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                  Regardez les produits en situation réelle, posés et essayés par les vendeurs, pour acheter en totale confiance.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={FiPlay}
              onClick={(e) => handleActionClick('/feed?type=video', null, e)}
              className="self-end sm:self-center shrink-0 shadow-sm cursor-pointer"
            >
              Regarder les vidéos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 8. Avatar Customization
  if (builtInVariant === 'avatar_customize') {
    return (
      <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 via-rose-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
            <img src="/assets/welcome-moxt-launch.png" alt="" className="size-full object-contain" />
          </div>

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-600/20">
                <LuSparkles className="text-xl" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-1">
                  <span>Profil & Confiance</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                  Donnez du style à votre profil avec un Avatar unique
                </h3>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                  Choisissez parmi nos portraits photoréalistes ou créez un avatar illustré personnalisé pour inspirer confiance à vos acheteurs.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={FiUser}
              onClick={(e) => {
                e.stopPropagation()
                setAvatarModalOpen(true)
              }}
              className="self-end sm:self-center shrink-0 cursor-pointer"
            >
              Personnaliser mon avatar
            </Button>
          </div>
        </div>

        {user && avatarModalOpen ? (
          <AvatarDicebearEditor
            open={avatarModalOpen}
            onClose={() => setAvatarModalOpen(false)}
            onSaved={() => setAvatarModalOpen(false)}
          />
        ) : null}
      </div>
    )
  }

  // 9. Moxt Transfers
  return (
    <div className="col-span-2 md:col-span-3 xl:col-span-4 my-2">
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-brand-500/10 to-[var(--app-surface)] p-4 sm:p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-6 -bottom-6 size-36 sm:size-48 opacity-25 dark:opacity-30 select-none">
          <img src="/assets/services/service-transfer.png" alt="" className="size-full object-contain" />
        </div>

        <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <FiZap className="text-xl" />
            </span>
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200 mb-1">
                <span>Transferts & Devises</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-[var(--app-text)]">
                Besoin d’envoyer ou échanger de l’argent ?
              </h3>
              <p className="mt-0.5 text-xs text-[var(--app-text-muted)] leading-relaxed max-w-xl">
                Comparez les taux de change en direct et réalisez vos transferts avec nos échangeurs certifiés et sécurisés.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={FiArrowRight}
            onClick={(e) => handleActionClick('/transfers', null, e)}
            className="self-end sm:self-center shrink-0 cursor-pointer"
          >
            Faire un transfert
          </Button>
        </div>
      </div>
    </div>
  )
}
