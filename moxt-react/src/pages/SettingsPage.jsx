import { useState } from 'react'
import {
  FiBell,
  FiCheck,
  FiDownload,
  FiGlobe,
  FiInfo,
  FiLock,
  FiMoon,
  FiSun,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Link } from 'react-router-dom'
import { isEmailVerified } from '@moxt/shared/auth/userSecurity.js'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { useTheme } from '../contexts/useTheme'
import { useLanguage } from '../contexts/useLanguage'
import { LanguageSegment } from '../components/ui/LanguageSegment'
import {
  cancelAccountDeletion,
  requestAccountDeletion,
  selectAccountPreferences,
  updateAccountPreferences,
} from '../features/account/accountSlice'
import { addToast } from '../features/ui/uiSlice'
import { isNative } from '../platform/capacitor'
import { syncNativePushPreference } from '../platform/pushNotifications'
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
  const { theme, setTheme } = useTheme()
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
        eyebrow={t('settings.pageEyebrow')}
        title={t('settings.pageTitle')}
        description={t('settings.pageDescription')}
        actions={<BackButton appearance="link" />}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black">{t('settings.appearance.title')}</h2>
              <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                {t('settings.appearance.description')}
              </p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              {theme === 'dark' ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
            </span>
          </div>
          <ThemeToggle theme={theme} onSelect={setTheme} t={t} />
        </Card>
        <Card>
          <h2 className="font-black">{t('settings.languagePrivacy.title')}</h2>
          <div className="mt-5 grid gap-5">
            <div>
              <p className="mb-2.5 text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
                {t('settings.language.label')}
              </p>
              <LanguageSegment
                value={language}
                ariaLabel={t('settings.language.label')}
                onChange={(code) => {
                  setLanguage(code)
                  updatePreference('language', code)
                }}
              />
            </div>
            <div>
              <p className="mb-2.5 text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
                {t('settings.visibility.label')}
              </p>
              <VisibilityPicker
                t={t}
                value={preferences.activityVisibility}
                onSelect={(value) => updatePreference('activityVisibility', value)}
              />
              <p className="mt-2.5 text-xs leading-5 text-[var(--app-text-faint)]">
                {t('settings.visibility.hint')}
              </p>
            </div>
          </div>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="font-black">{t('settings.notifications.title')}</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {t('settings.notifications.description')}
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
              label={t('settings.notifications.newSubscribers')}
              description={t('settings.notifications.newSubscribersDesc')}
              checked={preferences.notifNewSubscribers !== false}
              onChange={(v) => updatePreference('notifNewSubscribers', v)}
            />
            <NotifToggle
              label={t('settings.notifications.email')}
              description={
                emailConfirmed
                  ? t('settings.notifications.emailDesc')
                  : t('settings.notifications.emailNeedsConfirm')
              }
              checked={emailConfirmed && preferences.emailNotifications}
              onChange={(v) => {
                if (!emailConfirmed) {
                  dispatch(
                    addToast({
                      title: t('settings.notifications.emailUnconfirmedTitle'),
                      message: t('settings.notifications.emailUnconfirmedBody'),
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
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--app-text-faint)]">
              {t('settings.notifications.priorityHeading')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {NOTIF_CATEGORIES.map(({ key, labelKey, descriptionKey }) => (
                <NotifPriority
                  key={key}
                  t={t}
                  label={t(labelKey)}
                  description={t(descriptionKey)}
                  value={preferences[key]}
                  onChange={(v) => updatePreference(key, v)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--app-text-muted)]">
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-rose-500" />{t('settings.notifications.legend.high')}</span>
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-brand-500" />{t('settings.notifications.legend.normal')}</span>
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-slate-400" />{t('settings.notifications.legend.low')}</span>
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-[var(--app-border)]" />{t('settings.notifications.legend.off')}</span>
          </div>
        </Card>
        <Card>
          <h2 className="font-black">{t('settings.data.title')}</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {t('settings.data.description')}
          </p>
          <Button className="mt-5" icon={FiDownload} onClick={exportOwnData}>
            {t('settings.data.export')}
          </Button>
        </Card>
        <Card>
          <h2 className="font-black">{t('settings.profileSecurity.title')}</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {t('settings.profileSecurity.description')}
          </p>
          <Link className="mt-5 inline-block" to="/profile">
            <Button variant="secondary">{t('settings.profileSecurity.openProfile')}</Button>
          </Link>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              <FiInfo className="text-lg" />
            </span>
            <div>
              <h2 className="font-black">{t('settings.version.title')}</h2>
              <p className="text-sm text-[var(--app-text-muted)]">{t('settings.version.description')}</p>
            </div>
          </div>
          <Link className="mt-5 inline-block" to="/settings/version">
            <Button variant="secondary" icon={FiInfo}>{t('settings.version.open')}</Button>
          </Link>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <h2 className="font-black text-red-700 dark:text-red-300">{t('settings.danger.title')}</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {t('settings.danger.description')}
          </p>
          {deletionRequest ? (
            <Button
              className="mt-5"
              variant="secondary"
              onClick={() => dispatch(cancelAccountDeletion(user.id))}
            >
              {t('settings.danger.cancelRequest')}
            </Button>
          ) : (
            <Button
              className="mt-5"
              variant="danger"
              icon={FiTrash2}
              onClick={() => setConfirmDeletion(true)}
            >
              {t('settings.danger.requestDeletion')}
            </Button>
          )}
        </Card>
      </div>
      <ConfirmDialog

        open={confirmDeletion}
        title={t('settings.danger.confirmTitle')}
        description={t('settings.danger.confirmBody')}
        onCancel={() => setConfirmDeletion(false)}
        onConfirm={() => {
          dispatch(requestAccountDeletion({ userId: user.id }))
          dispatch(
            addToast({
              title: t('settings.danger.toastTitle'),
              message: t('settings.danger.toastBody'),
              tone: 'success',
            }),
          )
          setConfirmDeletion(false)
        }}
      />
    </div>
  )
}

const THEME_OPTIONS = [
  { value: 'light', labelKey: 'settings.appearance.light', icon: FiSun },
  { value: 'dark', labelKey: 'settings.appearance.dark', icon: FiMoon },
]

function ThemeToggle({ theme, onSelect, t }) {
  return (
    <div
      role="radiogroup"
      aria-label={t('settings.appearance.ariaLabel')}
      className="relative mt-5 grid grid-cols-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-[var(--app-surface)] shadow-sm ring-1 ring-[var(--app-border)] transition-transform duration-300 ease-out"
        style={{ transform: theme === 'dark' ? 'translateX(100%)' : 'translateX(0)' }}
      />
      {THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(value)}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              active
                ? 'text-[var(--app-accent)]'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            <Icon className="text-base" aria-hidden />
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}

const VISIBILITY_OPTIONS = [
  { value: 'public', icon: FiGlobe, labelKey: 'settings.visibility.public', descriptionKey: 'settings.visibility.publicDesc' },
  { value: 'contacts', icon: FiUsers, labelKey: 'settings.visibility.contacts', descriptionKey: 'settings.visibility.contactsDesc' },
  { value: 'private', icon: FiLock, labelKey: 'settings.visibility.private', descriptionKey: 'settings.visibility.privateDesc' },
]

function VisibilityPicker({ value, onSelect, t }) {
  const current = VISIBILITY_OPTIONS.some((option) => option.value === value) ? value : 'private'
  return (
    <div role="radiogroup" aria-label={t('settings.visibility.label')} className="grid gap-2">
      {VISIBILITY_OPTIONS.map(({ value: optionValue, icon: Icon, labelKey, descriptionKey }) => {
        const active = current === optionValue
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(optionValue)}
            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
              active
                ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] shadow-sm'
                : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] hover:border-[var(--app-accent)]/40'
            }`}
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                active
                  ? 'bg-[var(--app-accent)] text-white'
                  : 'bg-[var(--app-surface)] text-[var(--app-text-muted)]'
              }`}
            >
              <Icon className="text-base" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-bold ${active ? 'text-[var(--app-accent)]' : ''}`}>
                {t(labelKey)}
              </span>
              <span className="block text-xs text-[var(--app-text-muted)]">{t(descriptionKey)}</span>
            </span>
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border transition ${
                active ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-white' : 'border-[var(--app-border)]'
              }`}
            >
              {active ? <FiCheck className="text-[11px]" aria-hidden /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const NOTIF_CATEGORIES = [
  { key: 'notifMessages', labelKey: 'settings.notifications.cat.messages', descriptionKey: 'settings.notifications.cat.messagesDesc' },
  { key: 'notifTransfers', labelKey: 'settings.notifications.cat.transfers', descriptionKey: 'settings.notifications.cat.transfersDesc' },
  { key: 'notifParcels', labelKey: 'settings.notifications.cat.parcels', descriptionKey: 'settings.notifications.cat.parcelsDesc' },
  { key: 'notifJobs', labelKey: 'settings.notifications.cat.jobs', descriptionKey: 'settings.notifications.cat.jobsDesc' },
  { key: 'notifEvents', labelKey: 'settings.notifications.cat.events', descriptionKey: 'settings.notifications.cat.eventsDesc' },
  { key: 'notifMarketplace', labelKey: 'settings.notifications.cat.marketplace', descriptionKey: 'settings.notifications.cat.marketplaceDesc' },
  { key: 'notifActualites', labelKey: 'settings.notifications.cat.news', descriptionKey: 'settings.notifications.cat.newsDesc' },
  { key: 'notifStatuses', labelKey: 'settings.notifications.cat.statuses', descriptionKey: 'settings.notifications.cat.statusesDesc' },
  { key: 'notifOther', labelKey: 'settings.notifications.cat.other', descriptionKey: 'settings.notifications.cat.otherDesc' },
  { key: 'notifSysteme', labelKey: 'settings.notifications.cat.system', descriptionKey: 'settings.notifications.cat.systemDesc' },
]

const PRIORITY_OPTIONS = [
  { value: 'high', labelKey: 'settings.notifications.priority.high', color: 'bg-rose-500' },
  { value: 'normal', labelKey: 'settings.notifications.priority.normal', color: 'bg-brand-500' },
  { value: 'low', labelKey: 'settings.notifications.priority.low', color: 'bg-slate-400' },
  { value: 'off', labelKey: 'settings.notifications.priority.off', color: 'bg-[var(--app-border)]' },
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

function NotifPriority({ label, description, value, onChange, t }) {
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
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}
