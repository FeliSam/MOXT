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
  FiSmartphone,
  FiUser,
  FiZap,
} from 'react-icons/fi'
import { LuSparkles } from 'react-icons/lu'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
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

function FeedBannerCard({
  borderColor,
  gradient,
  illustration,
  icon: Icon,
  iconBg,
  iconShadow,
  badgeBg,
  badgeIcon: BadgeIcon,
  badgeText,
  title,
  description,
  action,
  children,
}) {
  return (
    <div className="col-span-1 h-[320px] min-w-0 flex">
      <div
        className={`relative w-full h-full flex flex-col justify-between overflow-hidden rounded-2xl border ${borderColor} bg-gradient-to-br ${gradient} p-3.5 sm:p-4 shadow-sm`}
      >
        {illustration ? (
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-32 opacity-20 dark:opacity-25 select-none">
            <img src={illustration} alt="" className="size-full object-contain" />
          </div>
        ) : null}

        <div className="relative z-[1] flex flex-col justify-between gap-2.5 h-full min-w-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-xl ${iconBg} text-white shadow-md ${iconShadow}`}
            >
              <Icon className="text-base" />
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={`inline-flex items-center gap-1 rounded-full ${badgeBg} px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider mb-1`}
              >
                {BadgeIcon ? <BadgeIcon className="text-xs" /> : null}
                <span>{badgeText}</span>
              </div>
              <h3 className="text-xs sm:text-[13px] font-black text-[var(--app-text)] leading-snug line-clamp-2">
                {title}
              </h3>
              <p className="mt-1 text-[10.5px] text-[var(--app-text-muted)] leading-relaxed line-clamp-3">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch shrink-0 pt-2 border-t border-[var(--app-border)]/50">
            {action}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function MarketplaceFeedBanner({ bannerIndex = 0, onInteract }) {
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

  // Alternance : les slots pairs (0, 2, 4...) affichent les diffusions admin partenaires,
  // et les slots impairs (1, 3, 5...) affichent les bannières de promotions Moxt natives.
  // Cela garantit qu'avoir des diffusions n'efface jamais les anciennes bannières.
  const currentBroadcast = useMemo(() => {
    if (!broadcasts.length) return null
    if (bannerIndex % 2 !== 0) return null

    const eligible = broadcasts.filter((b) => {
      const filter = b.target_filter || {}
      return filter.showInMarketplace !== false || filter.imageUrl || filter.bannerUrl
    })
    if (!eligible.length) return null
    const broadcastSlotIndex = Math.floor(bannerIndex / 2)
    return eligible[broadcastSlotIndex % eligible.length]
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
      <div className="col-span-1 h-[320px] min-w-0 flex">
        <div className="group relative w-full h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-md transition-all hover:shadow-lg">
          <div className="flex flex-col justify-between h-full">
            {imageUrl ? (
              <div className="relative h-[130px] shrink-0 overflow-hidden bg-slate-900/10">
                <img
                  src={imageUrl}
                  alt={currentBroadcast.title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-black tracking-wide text-white backdrop-blur-md">
                  <NotificationBadgeIcon name={badgeIcon} className="text-xs" />
                  <span>{badgeText}</span>
                </div>
              </div>
            ) : null}

            <div className="p-3.5 flex-1 flex flex-col justify-between gap-2 min-w-0">
              <div>
                {!imageUrl ? (
                  <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase">
                    <span className={`size-1.5 rounded-full ${palette.dot}`} />
                    <span className={palette.badge}>{badgeText}</span>
                  </div>
                ) : null}

                <h3 className="text-xs sm:text-[13px] font-black leading-snug text-[var(--app-text)] line-clamp-2">
                  {currentBroadcast.title}
                </h3>

                <p className="mt-1 text-[10.5px] text-[var(--app-text-muted)] line-clamp-2 leading-relaxed">
                  {currentBroadcast.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--app-border)]/60">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">
                  Diffusion Partenaire
                </span>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={FiExternalLink}
                  onClick={(e) => handleActionClick(currentBroadcast.link, null, e)}
                  className="shadow-sm active:scale-95 cursor-pointer text-xs"
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
      <FeedBannerCard
        borderColor="border-emerald-500/30"
        gradient="from-emerald-500/15 via-teal-500/10 to-[var(--app-surface)]"
        illustration="/assets/services/quick-marketplace.png"
        icon={FiSmartphone}
        iconBg="bg-emerald-500"
        iconShadow="shadow-emerald-500/20"
        badgeBg="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
        badgeIcon={LuSparkles}
        badgeText="Application Android"
        title="Téléchargez Moxt pour Android (.APK)"
        description="Profitez d’une rapidité maximale, des notifications instantanées et d’une navigation fluide sans quitter votre écran."
        action={
          <>
            <a
              href={apkDownloadUrl}
              download="Moxt.apk"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95 cursor-pointer lg:flex-1 lg:justify-center"
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
          </>
        }
      />
    )
  }

  // 2. iOS Safari Add to Home
  if (builtInVariant === 'install_ios') {
    return (
      <FeedBannerCard
        borderColor="border-sky-500/30"
        gradient="from-sky-500/15 via-brand-500/10 to-[var(--app-surface)]"
        illustration="/assets/install/iphone-add-home-fr.png"
        icon={FiSmartphone}
        iconBg="bg-sky-500"
        iconShadow="shadow-sky-500/20"
        badgeBg="bg-sky-500/20 text-sky-700 dark:text-sky-300"
        badgeText="iPhone & iPad (iOS)"
        title="Installez Moxt sur votre écran d’accueil"
        description="Accédez à vos annonces en plein écran en 2 clics avec Safari : Partager 📤 puis « Sur l’écran d’accueil ➕ »."
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={FiShare}
            onClick={(e) => {
              e.stopPropagation()
              setIosModalOpen(true)
            }}
            className="cursor-pointer lg:w-full lg:justify-center"
          >
            Guide d’installation
          </Button>
        }
      >
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
      </FeedBannerCard>
    )
  }

  // 3. Business Creation & Promotion
  if (builtInVariant === 'business_create') {
    return (
      <FeedBannerCard
        borderColor="border-brand-500/30"
        gradient="from-brand-500/15 via-amber-500/10 to-[var(--app-surface)]"
        illustration="/assets/services/service-businesses.png"
        icon={FiBriefcase}
        iconBg="bg-brand-600"
        iconShadow="shadow-brand-600/20"
        badgeBg="bg-brand-500/20 text-brand-700 dark:text-brand-300"
        badgeText="Moxt Business"
        title="Vous avez un commerce ou une boutique ?"
        description="Créez gratuitement votre vitrine d’entreprise sur Moxt, publiez votre catalogue et touchez des milliers de clients locaux et internationaux."
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={FiPlus}
            onClick={(e) => handleActionClick('/businesses/new', null, e)}
            className="shadow-sm cursor-pointer lg:w-full lg:justify-center"
          >
            Créer ma page Pro
          </Button>
        }
      />
    )
  }

  // 4. Parcels & Baggage Transport Promo
  if (builtInVariant === 'parcels_promo') {
    return (
      <FeedBannerCard
        borderColor="border-teal-500/30"
        gradient="from-teal-500/15 via-cyan-500/10 to-[var(--app-surface)]"
        illustration="/assets/services/quick-parcel.png"
        icon={FiPackage}
        iconBg="bg-teal-600"
        iconShadow="shadow-teal-600/20"
        badgeBg="bg-teal-500/20 text-teal-700 dark:text-teal-300"
        badgeText="Colis & Livraisons Express"
        title="Envoyez vos colis et valises entre villes et pays"
        description="Faites voyager vos colis en toute sérénité grâce à notre réseau de voyageurs vérifiés et de transporteurs partenaires certifiés."
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={FiArrowRight}
            onClick={(e) => handleActionClick('/parcels', null, e)}
            className="shadow-sm cursor-pointer lg:w-full lg:justify-center"
          >
            Expédier un colis
          </Button>
        }
      />
    )
  }

  // 5. Jobs & Recruitment Promo
  if (builtInVariant === 'jobs_promo') {
    return (
      <FeedBannerCard
        borderColor="border-indigo-500/30"
        gradient="from-indigo-500/15 via-blue-500/10 to-[var(--app-surface)]"
        illustration="/assets/services/quick-job.png"
        icon={FiBriefcase}
        iconBg="bg-indigo-600"
        iconShadow="shadow-indigo-600/20"
        badgeBg="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
        badgeText="Emploi & Recrutement"
        title="Trouvez un job ou recrutez des talents qualifiés"
        description="Découvrez les opportunités d'emploi récentes ou publiez votre offre pour attirer les meilleurs profils de votre communauté."
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={FiArrowRight}
            onClick={(e) => handleActionClick('/jobs', null, e)}
            className="shadow-sm cursor-pointer lg:w-full lg:justify-center"
          >
            Voir les offres
          </Button>
        }
      />
    )
  }

  // 6. Events & Community Promo
  if (builtInVariant === 'events_promo') {
    return (
      <FeedBannerCard
        borderColor="border-fuchsia-500/30"
        gradient="from-fuchsia-500/15 via-purple-500/10 to-[var(--app-surface)]"
        illustration="/assets/services/quick-event.png"
        icon={FiCalendar}
        iconBg="bg-fuchsia-600"
        iconShadow="shadow-fuchsia-600/20"
        badgeBg="bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300"
        badgeText="Événements & Billetterie"
        title="Concerts, salons et événements communautaires"
        description="Ne manquez aucun événement près de chez vous. Réservez vos entrées ou annoncez votre propre rencontre d’affaires."
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={FiArrowRight}
            onClick={(e) => handleActionClick('/events', null, e)}
            className="shadow-sm cursor-pointer lg:w-full lg:justify-center"
          >
            Découvrir les événements
          </Button>
        }
      />
    )
  }

  // 7. Video Reels Promo
  if (builtInVariant === 'videos_promo') {
    return (
      <FeedBannerCard
        borderColor="border-rose-500/30"
        gradient="from-rose-500/15 via-pink-500/10 to-[var(--app-surface)]"
        illustration="/assets/services/service-community.png"
        icon={FiPlay}
        iconBg="bg-rose-600"
        iconShadow="shadow-rose-600/20"
        badgeBg="bg-rose-500/20 text-rose-700 dark:text-rose-300"
        badgeText="Vidéos & Reels Produits"
        title="Découvrez les articles en démonstration vidéo"
        description="Regardez les produits en situation réelle, posés et essayés par les vendeurs, pour acheter en totale confiance."
        action={
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={FiPlay}
            onClick={(e) => handleActionClick('/feed?type=video', null, e)}
            className="shadow-sm cursor-pointer lg:w-full lg:justify-center"
          >
            Regarder les vidéos
          </Button>
        }
      />
    )
  }

  // 8. Avatar Customization
  if (builtInVariant === 'avatar_customize') {
    return (
      <FeedBannerCard
        borderColor="border-violet-500/30"
        gradient="from-violet-500/15 via-rose-500/10 to-[var(--app-surface)]"
        illustration="/assets/welcome-moxt-launch.png"
        icon={LuSparkles}
        iconBg="bg-violet-600"
        iconShadow="shadow-violet-600/20"
        badgeBg="bg-violet-500/20 text-violet-700 dark:text-violet-300"
        badgeText="Profil & Confiance"
        title="Donnez du style à votre profil avec un Avatar unique"
        description="Choisissez parmi nos portraits photoréalistes ou créez un avatar illustré personnalisé pour inspirer confiance à vos acheteurs."
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={FiUser}
            onClick={(e) => {
              e.stopPropagation()
              setAvatarModalOpen(true)
            }}
            className="cursor-pointer lg:w-full lg:justify-center"
          >
            Personnaliser mon avatar
          </Button>
        }
      >
        {user && avatarModalOpen ? (
          <AvatarDicebearEditor
            open={avatarModalOpen}
            onClose={() => setAvatarModalOpen(false)}
            onSaved={() => setAvatarModalOpen(false)}
          />
        ) : null}
      </FeedBannerCard>
    )
  }

  // 9. Moxt Transfers
  return (
    <FeedBannerCard
      borderColor="border-amber-500/30"
      gradient="from-amber-500/15 via-brand-500/10 to-[var(--app-surface)]"
      illustration="/assets/services/service-transfer.png"
      icon={FiZap}
      iconBg="bg-amber-500"
      iconShadow="shadow-amber-500/20"
      badgeBg="bg-amber-500/20 text-amber-800 dark:text-amber-200"
      badgeText="Transferts & Devises"
      title="Besoin d’envoyer ou échanger de l’argent ?"
      description="Comparez les taux de change en direct et réalisez vos transferts avec nos échangeurs certifiés et sécurisés."
      action={
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={FiArrowRight}
          onClick={(e) => handleActionClick('/transfers', null, e)}
          className="cursor-pointer lg:w-full lg:justify-center"
        >
          Faire un transfert
        </Button>
      }
    />
  )
}
