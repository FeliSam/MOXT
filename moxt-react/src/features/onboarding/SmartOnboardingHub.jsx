import { useEffect, useMemo, useState } from 'react'
import {
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { LuSparkles } from 'react-icons/lu'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { isNative } from '../../platform/capacitor'
import { appReleaseService } from '../../services/appReleaseService'
import { addToast } from '../ui/uiSlice'
import { AvatarDicebearEditor } from '../account/avatarDicebear/AvatarDicebearEditor'
import { detectDevicePlatform, isAppInstalled } from '../marketplace/MarketplaceFeedBanner'

const DISMISSED_KEY_PREFIX = 'moxt_retention_hub_dismissed_'
const COLLAPSED_KEY_PREFIX = 'moxt_retention_hub_collapsed_'
const MANUAL_BUSINESS_KEY_PREFIX = 'moxt_step_business_done_'

export function SmartOnboardingHub() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const user = useSelector((state) => state.auth?.user)
  const businesses = useSelector((state) => state.businesses?.items || [])
  const userListings = useSelector((state) => state.marketplace?.userItems || [])

  const userId = user?.id || null

  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [iosGuideOpen, setIosGuideOpen] = useState(false)
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false)
  const [apkDownloadUrl, setApkDownloadUrl] = useState('https://moxtapp.ru/downloads/Moxt.apk')
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })
  const [manualBusinessDone, setManualBusinessDone] = useState(false)

  const platform = useMemo(() => detectDevicePlatform(), [])
  const installed = useMemo(() => isAppInstalled(), [])

  // Hydrate persistence state per user
  useEffect(() => {
    if (!userId) return
    try {
      const isDismissed = localStorage.getItem(`${DISMISSED_KEY_PREFIX}${userId}`) === '1'
      const isCollapsed = localStorage.getItem(`${COLLAPSED_KEY_PREFIX}${userId}`) === '1'
      const isBizDone = localStorage.getItem(`${MANUAL_BUSINESS_KEY_PREFIX}${userId}`) === '1'
      setDismissed(isDismissed)
      setCollapsed(isCollapsed)
      setManualBusinessDone(isBizDone)
    } catch {
      // ignore private browsing errors
    }
  }, [userId])

  // Fetch latest Android APK URL
  useEffect(() => {
    let cancelled = false
    void appReleaseService.getActiveRelease('android').then((release) => {
      if (!cancelled && release?.downloadUrl) {
        setApkDownloadUrl(release.downloadUrl)
      }
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Check notification permission state
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const updatePerm = () => setNotificationPermission(Notification.permission)
    updatePerm()
    window.addEventListener('focus', updatePerm)
    return () => window.removeEventListener('focus', updatePerm)
  }, [])

  if (!user || dismissed) return null

  // --- Step 1: App Installed ---
  const stepAppDone = installed

  // --- Step 2: Custom Avatar ---
  const hasCustomAvatar = Boolean(
    user.avatarUrl &&
      !user.avatarUrl.includes('initials') &&
      !user.avatarUrl.includes('placeholder'),
  )

  // --- Step 3: Business or Listing ---
  const hasBusinessOrListing =
    businesses.length > 0 || userListings.length > 0 || manualBusinessDone

  // --- Step 4: Push Notifications ---
  const stepNotificationsDone =
    notificationPermission === 'granted' || isNative

  const completedCount =
    (stepAppDone ? 1 : 0) +
    (hasCustomAvatar ? 1 : 0) +
    (hasBusinessOrListing ? 1 : 0) +
    (stepNotificationsDone ? 1 : 0)

  const totalSteps = 4
  const progressPercent = Math.round((completedCount / totalSteps) * 100)
  const allCompleted = completedCount === totalSteps

  function handleDismiss() {
    if (userId) {
      try {
        localStorage.setItem(`${DISMISSED_KEY_PREFIX}${userId}`, '1')
      } catch {
        // ignore
      }
    }
    setDismissed(true)
  }

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    if (userId) {
      try {
        localStorage.setItem(`${COLLAPSED_KEY_PREFIX}${userId}`, next ? '1' : '0')
      } catch {
        // ignore
      }
    }
  }

  async function handleRequestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      dispatch(
        addToast({
          title: 'Notifications non supportées',
          message: 'Votre navigateur actuel ne prend pas en charge les alertes web push.',
          tone: 'warning',
        }),
      )
      return
    }
    try {
      const result = await Notification.requestPermission()
      setNotificationPermission(result)
      if (result === 'granted') {
        dispatch(
          addToast({
            title: 'Notifications activées !',
            message: 'Vous recevrez les alertes pour vos messages et transferts en direct.',
            tone: 'success',
          }),
        )
      }
    } catch {
      // ignore
    }
  }

  function handleMarkBusinessDone() {
    setManualBusinessDone(true)
    if (userId) {
      try {
        localStorage.setItem(`${MANUAL_BUSINESS_KEY_PREFIX}${userId}`, '1')
      } catch {
        // ignore
      }
    }
  }

  return (
    <>
      {/* Floating Retention Hub */}
      <aside
        aria-label="Guide de démarrage Moxt"
        className="fixed bottom-[var(--bottom-nav-clearance-loose,5rem)] right-3 z-40 max-w-sm w-[calc(100vw-1.5rem)] sm:w-96 select-none transition-all duration-300"
      >
        {collapsed ? (
          /* Minimized Pill */
          <button
            type="button"
            onClick={toggleCollapse}
            className="ml-auto flex items-center gap-2 rounded-full border border-brand-500/40 bg-[var(--app-surface)] px-3.5 py-2 shadow-lg backdrop-blur-md transition hover:border-brand-500 hover:scale-105 active:scale-95"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">
              {completedCount}/{totalSteps}
            </span>
            <span className="text-xs font-black text-[var(--app-text)]">
              {allCompleted ? '🎉 Compte optimisé' : '🚀 Booster mon compte'}
            </span>
            <FiChevronUp className="text-sm text-brand-600" />
          </button>
        ) : (
          /* Expanded Card */
          <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-[var(--app-border)] bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
                  <LuSparkles className="text-xs" />
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--app-text)]">
                    Parcours de réussite Moxt
                  </h3>
                  <p className="text-[10px] text-[var(--app-text-muted)]">
                    {completedCount} sur {totalSteps} étapes complétées ({progressPercent}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="rounded-lg p-1 text-slate-400 hover:bg-[var(--app-surface-muted)] hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Réduire"
                >
                  <FiChevronDown className="text-base" />
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-lg p-1 text-slate-400 hover:bg-[var(--app-surface-muted)] hover:text-rose-600"
                  aria-label="Fermer"
                >
                  <FiX className="text-base" />
                </button>
              </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Steps Checklist */}
            <div className="max-h-[60vh] overflow-y-auto p-3.5 space-y-2.5">
              {/* Step 1: Installer l'application */}
              <div
                className={`flex items-start justify-between gap-3 rounded-xl border p-2.5 transition ${
                  stepAppDone
                    ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full mt-0.5 text-xs ${
                      stepAppDone
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {stepAppDone ? <FiCheckCircle className="text-xs" /> : '1'}
                  </span>
                  <div className="min-w-0">
                    <strong className="text-xs font-black text-[var(--app-text)] block">
                      Installer Moxt sur votre téléphone
                    </strong>
                    <span className="text-[11px] text-[var(--app-text-muted)] block leading-snug">
                      {stepAppDone
                        ? 'Application prête sur votre écran'
                        : platform === 'android'
                          ? 'Téléchargez l’APK Android direct'
                          : platform === 'ios'
                            ? 'Raccourci Safari vers l’écran d’accueil'
                            : 'Accès rapide en plein écran'}
                    </span>
                  </div>
                </div>

                {!stepAppDone ? (
                  platform === 'android' ? (
                    <a
                      href={apkDownloadUrl}
                      download="Moxt.apk"
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-emerald-500 shadow-sm"
                    >
                      <FiDownload className="text-xs" />
                      <span>APK</span>
                    </a>
                  ) : platform === 'ios' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIosGuideOpen(true)}
                      className="shrink-0 text-[11px] px-2 py-1 h-7"
                    >
                      Guide iOS
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/install')}
                      className="shrink-0 text-[11px] px-2 py-1 h-7"
                    >
                      Installer
                    </Button>
                  )
                ) : null}
              </div>

              {/* Step 2: Personnaliser l'avatar */}
              <div
                className={`flex items-start justify-between gap-3 rounded-xl border p-2.5 transition ${
                  hasCustomAvatar
                    ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full mt-0.5 text-xs ${
                      hasCustomAvatar
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {hasCustomAvatar ? <FiCheckCircle className="text-xs" /> : '2'}
                  </span>
                  <div className="min-w-0">
                    <strong className="text-xs font-black text-[var(--app-text)] block">
                      Personnaliser votre Avatar
                    </strong>
                    <span className="text-[11px] text-[var(--app-text-muted)] block leading-snug">
                      {hasCustomAvatar
                        ? 'Profil attrayant et de confiance'
                        : 'Portraits réels ou avatar illustré'}
                    </span>
                  </div>
                </div>

                {!hasCustomAvatar ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={FiUser}
                    onClick={() => setAvatarEditorOpen(true)}
                    className="shrink-0 text-[11px] px-2 py-1 h-7"
                  >
                    Choisir
                  </Button>
                ) : null}
              </div>

              {/* Step 3: Business ou Annonce */}
              <div
                className={`flex items-start justify-between gap-3 rounded-xl border p-2.5 transition ${
                  hasBusinessOrListing
                    ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full mt-0.5 text-xs ${
                      hasBusinessOrListing
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {hasBusinessOrListing ? <FiCheckCircle className="text-xs" /> : '3'}
                  </span>
                  <div className="min-w-0">
                    <strong className="text-xs font-black text-[var(--app-text)] block">
                      Lancer votre Business ou Annonce
                    </strong>
                    <span className="text-[11px] text-[var(--app-text-muted)] block leading-snug">
                      {hasBusinessOrListing
                        ? 'Activité lancée sur la plateforme'
                        : 'Créez votre page Pro ou vendez un article'}
                    </span>
                  </div>
                </div>

                {!hasBusinessOrListing ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/businesses/new')}
                      className="text-[11px] px-2 py-1 h-7"
                    >
                      Créer Pro
                    </Button>
                    <button
                      type="button"
                      onClick={handleMarkBusinessDone}
                      title="Marquer comme fait"
                      className="rounded-lg p-1 text-slate-400 hover:text-emerald-600"
                    >
                      <FiCheckCircle className="text-sm" />
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Step 4: Activer les notifications */}
              <div
                className={`flex items-start justify-between gap-3 rounded-xl border p-2.5 transition ${
                  stepNotificationsDone
                    ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full mt-0.5 text-xs ${
                      stepNotificationsDone
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {stepNotificationsDone ? <FiCheckCircle className="text-xs" /> : '4'}
                  </span>
                  <div className="min-w-0">
                    <strong className="text-xs font-black text-[var(--app-text)] block">
                      Activer les alertes & messages
                    </strong>
                    <span className="text-[11px] text-[var(--app-text-muted)] block leading-snug">
                      {stepNotificationsDone
                        ? 'Alertes en direct activées'
                        : 'Ne ratez aucun client ni virement'}
                    </span>
                  </div>
                </div>

                {!stepNotificationsDone ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRequestNotifications}
                    className="shrink-0 text-[11px] px-2 py-1 h-7"
                  >
                    Activer
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Footer Celebration or Action */}
            {allCompleted ? (
              <div className="border-t border-[var(--app-border)] bg-emerald-500/10 p-3 text-center">
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                  🎉 Bravo ! Votre compte est 100% prêt.
                </p>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="mt-1 text-[11px] font-bold text-slate-500 underline"
                >
                  Fermer ce guide
                </button>
              </div>
            ) : null}
          </div>
        )}
      </aside>

      {/* iOS Safari Guide Modal */}
      <Modal
        open={iosGuideOpen}
        onClose={() => setIosGuideOpen(false)}
        title="Ajouter Moxt sur iPhone (iOS)"
      >
        <div className="grid gap-3.5 py-2">
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-500 text-sm font-black text-white">
              1
            </span>
            <div>
              <strong className="text-sm font-bold text-[var(--app-text)]">
                Ouvrez Safari et appuyez sur Partager 📤
              </strong>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                Au bas de l’écran Safari, touchez le bouton de partage au milieu (icône carrée avec flèche montante).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-500 text-sm font-black text-white">
              2
            </span>
            <div>
              <strong className="text-sm font-bold text-[var(--app-text)]">
                Touchez « Sur l’écran d’accueil ➕ »
              </strong>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">
                Faites défiler vers le bas, sélectionnez « Sur l’écran d’accueil », puis appuyez sur « Ajouter » en haut à droite.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
              ✨ Vous pourrez lancer Moxt comme une vraie application sans passer par le navigateur !
            </p>
          </div>

          <Button
            variant="primary"
            className="w-full justify-center mt-1"
            onClick={() => setIosGuideOpen(false)}
          >
            Fermer le guide
          </Button>
        </div>
      </Modal>

      {/* Avatar Dicebear Modal */}
      {avatarEditorOpen ? (
        <AvatarDicebearEditor
          open={avatarEditorOpen}
          onClose={() => setAvatarEditorOpen(false)}
          onSaved={() => setAvatarEditorOpen(false)}
        />
      ) : null}
    </>
  )
}
