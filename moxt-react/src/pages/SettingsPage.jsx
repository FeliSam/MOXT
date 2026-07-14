import { useState } from 'react'
import { FiBell, FiDownload, FiInfo, FiMoon, FiSun, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Link } from 'react-router-dom'
import { isEmailVerified } from '@moxt/shared/auth/userSecurity.js'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { useTheme } from '../contexts/useTheme'
import { useLanguage } from '../contexts/useLanguage'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../config/uiTranslations'
import { ActivityVisibilitySelect } from '../features/account/ActivityVisibilitySelect'
import {
  cancelAccountDeletion,
  requestAccountDeletion,
  selectAccountPreferences,
  updateAccountPreferences,
} from '../features/account/accountSlice'
import { addToast } from '../features/ui/uiSlice'
import { isNative } from '../platform/capacitor'
import { syncNativePushPreference, setNativePushUserId } from '../platform/pushNotifications'
import {
  canPromptForPushPermission,
  ensureWebPushSubscription,
  getVapidPublicKey,
  getWebPushErrorMessage,
  getWebPushInstallHint,
  isWebPushContextReady,
  syncWebPushPreference,
} from '../platform/webPush'

export function SettingsPage() {
  const dispatch = useDispatch()
  const store = useStore()
  const user = useSelector((value) => value.auth.user)
  const emailConfirmed = isEmailVerified(user)
  const preferences = useSelector((value) => selectAccountPreferences(value, user.id))
  const deletionRequest = useSelector((value) =>
    value.account.deletionRequests.find(
      (item) => item.userId === user.id && item.status === 'requested',
    ),
  )
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [confirmDeletion, setConfirmDeletion] = useState(false)
  const [pushPromptLoading, setPushPromptLoading] = useState(false)
  const pushPermission =
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  const showWebPushPrompt =
    !isNative &&
    canPromptForPushPermission() &&
    preferences.pushNotifications !== false &&
    pushPermission === 'default'

  async function requestWebPushPermission() {
    if (!getVapidPublicKey()) {
      dispatch(
        addToast({
          tone: 'warning',
          title: t('settings.push.unavailableTitle'),
          message: getWebPushErrorMessage('missing_vapid', language),
        }),
      )
      return
    }

    setPushPromptLoading(true)
    try {
      const result = await ensureWebPushSubscription(user.id, { prompt: true })
      if (result.enabled) {
        dispatch(
          addToast({
            tone: 'success',
            title: t('settings.push.enabledTitle'),
            message: t('settings.push.enabledMessage'),
          }),
        )
        return
      }
      if (result.reason) {
        dispatch(
          addToast({
            tone: result.reason === 'denied' ? 'warning' : 'info',
            title:
              result.reason === 'denied'
                ? t('settings.push.deniedTitle')
                : t('settings.push.incompleteTitle'),
            message: getWebPushErrorMessage(result.reason, language),
          }),
        )
        if (result.reason === 'denied') {
          dispatch(
            updateAccountPreferences({
              userId: user.id,
              preferences: { pushNotifications: false },
            }),
          )
        }
      }
    } finally {
      setPushPromptLoading(false)
    }
  }

  function updatePreference(name, value) {
    dispatch(
      updateAccountPreferences({
        userId: user.id,
        preferences: { [name]: value },
      }),
    )

    if (name === 'pushNotifications') {
      if (isNative) {
        void syncNativePushPreference(Boolean(value)).then((result) => {
          if (value && result.reason === 'denied') {
            dispatch(
              addToast({
                tone: 'warning',
                title: t('settings.push.deniedTitle'),
                message: t('settings.push.nativeDenied'),
              }),
            )
          }
        })
      } else {
        void syncWebPushPreference(user.id, Boolean(value)).then((result) => {
          if (value && result.enabled) return
          if (value && result.reason === 'ios_install_required') {
            dispatch(
              addToast({
                tone: 'info',
                title: t('settings.push.installRequiredTitle'),
                message: t('settings.push.installRequiredBody'),
              }),
            )
            dispatch(
              updateAccountPreferences({
                userId: user.id,
                preferences: { pushNotifications: false },
              }),
            )
            return
          }
          if (value && result.reason === 'denied') {
            dispatch(
              addToast({
                tone: 'warning',
                title: t('settings.push.deniedTitle'),
                message: getWebPushErrorMessage('denied', language),
              }),
            )
            dispatch(
              updateAccountPreferences({
                userId: user.id,
                preferences: { pushNotifications: false },
              }),
            )
            return
          }
          if (value && result.reason) {
            dispatch(
              addToast({
                tone: 'info',
                title: t('settings.push.incompleteTitle'),
                message: getWebPushErrorMessage(result.reason, language),
              }),
            )
            if (
              result.reason === 'missing_vapid' ||
              result.reason === 'service_worker_timeout' ||
              result.reason === 'no_service_worker'
            ) {
              dispatch(
                updateAccountPreferences({
                  userId: user.id,
                  preferences: { pushNotifications: false },
                }),
              )
            }
          }
        })
      }
    }
  }

  function exportOwnData() {
    const state = store.getState()
    const userId = user.id
    const data = {
      profile: user,
      account: {
        preferences,
        documents: state.account.documents.filter((item) => item.userId === userId),
        favorites: state.account.favorites.filter((item) => item.userId === userId),
        verification: state.account.verificationRequests.filter((item) => item.userId === userId),
      },
      transfers: state.transfers.items.filter((item) => item.userId === userId),
      business: state.businesses.items.find((item) => item.ownerId === userId) || null,
      listings: state.marketplace.items.filter((item) => item.ownerId === userId),
      applications: state.jobs.applications.filter((item) => item.userId === userId),
      registrations: state.events.registrations.filter((item) => item.userId === userId),
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `moxt-mes-donnees-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Paramètres"
        description="Préférences simples et contrôle de vos données locales."
        actions={<BackButton appearance="link" />}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-black">Apparence</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Thème actuel : {theme === 'dark' ? 'sombre' : 'clair'}.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            icon={theme === 'dark' ? FiSun : FiMoon}
            onClick={toggleTheme}
          >
            Changer le thème
          </Button>
        </Card>
        <Card>
          <h2 className="font-black">Langue et confidentialité</h2>
          <div className="mt-5 grid gap-4">
            <Select
              id="settings-language"
              label="Langue préférée"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value)
                updatePreference('language', event.target.value)
              }}
            >
              {SUPPORTED_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_LABELS[code]?.label || code}
                </option>
              ))}
            </Select>
            <ActivityVisibilitySelect
              id="settings-visibility"
              label="Visibilité de l’activité"
              value={preferences.activityVisibility}
              onChange={(event) => updatePreference('activityVisibility', event.target.value)}
              hint="Contrôle qui peut voir vos publications publiques sur votre page membre. Enregistré sur votre profil MOXT et synchronisé entre vos appareils."
            />
          </div>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="font-black">Notifications</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Contrôlez ce que vous recevez et à quelle priorité.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <NotifToggle
              label={t('settings.push.label')}
              description={
                isNative
                  ? t('settings.push.descNative')
                  : isWebPushContextReady()
                    ? t('settings.push.descWebReady')
                    : getWebPushInstallHint()
                      ? t('settings.push.descIosInstall')
                      : t('settings.push.descDefault')
              }
              checked={preferences.pushNotifications}
              onChange={(v) => updatePreference('pushNotifications', v)}
            />
            {showWebPushPrompt ? (
              <div className="sm:col-span-2 rounded-2xl border border-brand-200 bg-brand-50/80 p-4 dark:border-brand-900/50 dark:bg-brand-950/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{t('settings.push.permissionRequiredTitle')}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
                      {t('settings.push.permissionRequiredBody')}
                    </p>
                  </div>
                  <Button onClick={requestWebPushPermission} loading={pushPromptLoading} disabled={pushPromptLoading}>
                    <FiBell className="mr-2 inline" aria-hidden />
                    {t('settings.push.allowButton')}
                  </Button>
                </div>
              </div>
            ) : null}
            <NotifToggle
              label="Nouveaux abonnés"
              description="Quand un membre s'abonne à vos publications"
              checked={preferences.notifNewSubscribers !== false}
              onChange={(v) => updatePreference('notifNewSubscribers', v)}
            />
            <NotifToggle
              label="Notifications e-mail"
              description={
                emailConfirmed
                  ? 'Résumés et alertes par e-mail'
                  : 'Confirmez votre e-mail (Sécurité) pour activer les alertes e-mail'
              }
              checked={emailConfirmed && preferences.emailNotifications}
              onChange={(v) => {
                if (!emailConfirmed) {
                  dispatch(
                    addToast({
                      title: 'E-mail non confirmé',
                      message: 'Confirmez votre adresse dans Sécurité avant d’activer les e-mails.',
                      tone: 'error',
                    }),
                  )
                  return
                }
                updatePreference('emailNotifications', v)
              }}
            />
          </div>

          <div className="mt-6 border-t border-[var(--app-border)] pt-5">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--app-text-faint)]">Priorité par catégorie</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {NOTIF_CATEGORIES.map(({ key, label, description }) => (
                <NotifPriority
                  key={key}
                  label={label}
                  description={description}
                  value={preferences[key]}
                  onChange={(v) => updatePreference(key, v)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--app-text-muted)]">
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-rose-500" />Haute — immédiate</span>
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-brand-500" />Normale — regroupée</span>
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-slate-400" />Faible — silencieuse</span>
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-[var(--app-border)]" />Off — désactivée</span>
          </div>
        </Card>
        <Card>
          <h2 className="font-black">Mes données</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Exportez uniquement les informations rattachées à votre compte.
          </p>
          <Button className="mt-5" icon={FiDownload} onClick={exportOwnData}>
            Exporter mes données
          </Button>
        </Card>
        <Card>
          <h2 className="font-black">Profil et sécurité</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Gérez vos coordonnées et votre niveau de vérification.
          </p>
          <Link className="mt-5 inline-block" to="/profile">
            <Button variant="secondary">Ouvrir mon profil</Button>
          </Link>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              <FiInfo className="text-lg" />
            </span>
            <div>
              <h2 className="font-black">Version de l'application</h2>
              <p className="text-sm text-[var(--app-text-muted)]">Historique des améliorations et mises à jour.</p>
            </div>
          </div>
          <Link className="mt-5 inline-block" to="/settings/version">
            <Button variant="secondary" icon={FiInfo}>Voir la version actuelle</Button>
          </Link>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <h2 className="font-black text-red-700 dark:text-red-300">Zone sensible</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            La demande est seulement enregistrée localement et reste réversible.
          </p>
          {deletionRequest ? (
            <Button
              className="mt-5"
              variant="secondary"
              onClick={() => dispatch(cancelAccountDeletion(user.id))}
            >
              Annuler la demande
            </Button>
          ) : (
            <Button
              className="mt-5"
              variant="danger"
              icon={FiTrash2}
              onClick={() => setConfirmDeletion(true)}
            >
              Demander la suppression
            </Button>
          )}
        </Card>
      </div>
      <ConfirmDialog

        open={confirmDeletion}
        title="Demander la suppression du compte"
        description="Votre compte sera marqué pour suppression. La modération MOXT traitera la demande sous 30 jours."
        onCancel={() => setConfirmDeletion(false)}
        onConfirm={() => {
          dispatch(requestAccountDeletion({ userId: user.id }))
          dispatch(
            addToast({
              title: 'Demande enregistrée',
              message: 'Votre demande de suppression a été transmise.',
              tone: 'success',
            }),
          )
          setConfirmDeletion(false)
        }}
      />
    </div>
  )
}

const NOTIF_CATEGORIES = [
  { key: 'notifMessages',    label: 'Messages',      description: 'Nouveaux messages reçus' },
  { key: 'notifTransfers',   label: 'Transferts',    description: 'Mises à jour de vos opérations' },
  { key: 'notifParcels',     label: 'Colis',         description: 'Réservations et confirmations' },
  { key: 'notifJobs',        label: 'Jobs',          description: 'Candidatures et offres' },
  { key: 'notifEvents',      label: 'Événements',    description: 'Inscriptions et rappels' },
  { key: 'notifMarketplace', label: 'Marketplace',   description: 'Intérêts sur vos annonces' },
  { key: 'notifActualites',  label: 'Actualités',    description: 'Posts et nouveautés' },
  { key: 'notifSysteme',     label: 'Système',       description: 'Sécurité et alertes compte' },
]

const PRIORITY_OPTIONS = [
  { value: 'high',   label: 'Haute',   color: 'bg-rose-500' },
  { value: 'normal', label: 'Normale', color: 'bg-brand-500' },
  { value: 'low',    label: 'Faible',  color: 'bg-slate-400' },
  { value: 'off',    label: 'Off',     color: 'bg-[var(--app-border)]' },
]

function NotifToggle({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
        checked
          ? 'border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/30'
          : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
      }`}
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-[var(--app-border)]'
        }`}
      >
        <span
          className={`absolute size-4 rounded-full bg-white shadow transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
      <span className="min-w-0">
        <strong className="block text-sm">{label}</strong>
        <span className="block text-xs text-[var(--app-text-muted)]">{description}</span>
      </span>
    </button>
  )
}

function NotifPriority({ label, description, value, onChange }) {
  const current = PRIORITY_OPTIONS.find((o) => o.value === value) ?? PRIORITY_OPTIONS[1]
  return (
    <div className="rounded-2xl border border-[var(--app-border)] p-3">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <strong className="block text-sm">{label}</strong>
          <span className="block text-xs text-[var(--app-text-muted)]">{description}</span>
        </div>
        <span className={`mt-0.5 shrink-0 size-2.5 rounded-full ${current.color}`} />
      </div>
      <div className="flex gap-1.5">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-xl py-1 text-[10px] font-black transition ${
              value === opt.value
                ? 'bg-brand-700 text-white dark:bg-brand-600'
                : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
