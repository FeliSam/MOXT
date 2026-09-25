import { useEffect, useState } from 'react'
import {
  FiAward,
  FiBell,
  FiCamera,
  FiClock,
  FiEdit3,
  FiHash,
  FiImage,
  FiLayout,
  FiRefreshCw,
  FiSmile,
  FiWatch,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import {
  AVATAR_GENERATED_STYLES,
  AVATAR_SETTINGS_LIMITS,
  normalizeAvatarSettings,
} from '../../../config/avatarSettings'
import { loadAvatarSettings, saveAvatarSettings } from '../../platform/avatarSettingsSlice'
import { fetchAvatarStyleStats } from '../../platform/avatarSettingsRemote'
import { loadPlatformModules, savePlatformModules } from '../../platform/platformModulesSlice'
import { addToast } from '../../ui/uiSlice'
import { CARD, CHIP } from '../adminConfig'
import { adminText } from '../adminI18n'
import { AdminToggleRow } from './AdminToggleRow'

const STYLE_KEYS = { portrait: 'portraitEnabled', lorelei: 'loreleiEnabled', photo: 'photoEnabled' }
const STAT_KEYS = ['portrait', 'lorelei', 'photo', 'none']

function SectionTitle({ children }) {
  return (
    <h3 className="mt-2 px-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">
      {children}
    </h3>
  )
}

function NumberRow({ icon: Icon, label, hint, value, limits, onCommit }) {
  const [text, setText] = useState(String(value))
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setText(String(value))
  }
  return (
    <Card className={`${CARD} flex items-center gap-4 p-4`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text)]">
        <Icon className="text-lg" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black">{label}</p>
        <p className="mt-0.5 text-sm text-[var(--app-text-muted)]">{hint}</p>
      </div>
      <input
        type="number"
        inputMode="decimal"
        aria-label={label}
        min={limits.min}
        max={limits.max}
        step={limits.step}
        value={text}
        onChange={(event) => {
          const raw = event.target.value
          setText(raw)
          const next = Number(raw)
          if (raw !== '' && Number.isFinite(next)) onCommit(next)
        }}
        onBlur={() => setText(String(value))}
        className="h-11 w-24 shrink-0 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-right text-base font-black text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:shadow-[0_0_0_3px_rgba(18,191,163,0.14)]"
      />
    </Card>
  )
}

function DefaultStyleRow({ t, value, styles, onChange }) {
  return (
    <Card className={`${CARD} flex flex-wrap items-center gap-4 p-4`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text)]">
        <FiLayout className="text-lg" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black">{adminText(t, 'admin.avatar.defaultStyle')}</p>
        <p className="mt-0.5 text-sm text-[var(--app-text-muted)]">
          {adminText(t, 'admin.avatar.defaultStyleHint')}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-label={adminText(t, 'admin.avatar.defaultStyle')}
        className="flex shrink-0 gap-2"
      >
        {AVATAR_GENERATED_STYLES.map((id) => {
          const available = styles.includes(id)
          const active = value === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!available}
              onClick={() => onChange(id)}
              className={`${CHIP} ${
                active
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface)]'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {adminText(
                t,
                id === 'portrait' ? 'admin.avatar.statsPortrait' : 'admin.avatar.statsLorelei',
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function StatsCard({ t, stats, onRefresh }) {
  const data = stats.data
  return (
    <Card className={`${CARD} grid gap-3 p-4`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--app-text-muted)]">
          {data ? adminText(t, 'admin.avatar.statsTotal', { count: data.total }) : null}
          {stats.status === 'unavailable' ? adminText(t, 'admin.avatar.statsUnavailable') : null}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          icon={FiRefreshCw}
          loading={stats.status === 'loading'}
          onClick={onRefresh}
        >
          {adminText(t, 'admin.avatar.statsRefresh')}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAT_KEYS.map((key) => (
          <div
            key={key}
            className="rounded-xl border border-[color:rgb(148_163_184/0.11)] bg-[var(--app-surface-muted)] px-3 py-2.5"
          >
            <p className="text-xs font-bold text-[var(--app-text-muted)]">
              {adminText(t, `admin.avatar.stats${key[0].toUpperCase()}${key.slice(1)}`)}
            </p>
            <p className="mt-0.5 text-xl font-black tabular-nums">{data ? data[key] : '—'}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Module Avatar (admin ?view=avatar) — même mécanique que « Lecture du Fil » :
 * table singleton app_avatar_settings + RPC admin, cache local + défauts si la ligne manque.
 * L’interrupteur principal est le flag `avatar` de app_module_flags (aussi listé dans Modules).
 */
export function AdminAvatarPanel() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const remote = useSelector((state) => state.avatarSettings.config)
  const saveStatus = useSelector((state) => state.avatarSettings.saveStatus)
  const modulesSaveStatus = useSelector((state) => state.platformModules.saveStatus)
  const updatedAt = useSelector((state) => state.avatarSettings.updatedAt)
  const remoteFlags = useSelector((state) => state.platformModules.flags)
  const remoteEnabled = remoteFlags?.avatar !== false
  const [draft, setDraft] = useState(remote)
  const [draftEnabled, setDraftEnabled] = useState(remoteEnabled)
  const remoteKey = `${JSON.stringify(remote)}|${remoteEnabled}`
  const [syncedRemoteKey, setSyncedRemoteKey] = useState(remoteKey)
  if (remoteKey !== syncedRemoteKey) {
    setSyncedRemoteKey(remoteKey)
    setDraft(remote)
    setDraftEnabled(remoteEnabled)
  }
  const [stats, setStats] = useState({ status: 'loading', data: null })
  const [statsNonce, setStatsNonce] = useState(0)

  useEffect(() => {
    dispatch(loadAvatarSettings())
    dispatch(loadPlatformModules())
  }, [dispatch])

  useEffect(() => {
    let cancelled = false
    fetchAvatarStyleStats()
      .then((data) => {
        if (!cancelled) setStats({ status: data ? 'ready' : 'unavailable', data })
      })
      .catch(() => {
        if (!cancelled) setStats({ status: 'unavailable', data: null })
      })
    return () => {
      cancelled = true
    }
  }, [statsNonce])

  const settingsDirty = JSON.stringify(normalizeAvatarSettings(draft)) !== JSON.stringify(remote)
  const moduleDirty = draftEnabled !== remoteEnabled
  const saving = saveStatus === 'saving' || modulesSaveStatus === 'saving'
  const activeStyles = Object.values(STYLE_KEYS).filter((key) => draft[key]).length
  const generatedStyles = AVATAR_GENERATED_STYLES.filter((id) => draft[STYLE_KEYS[id]])

  function update(patch) {
    setDraft((current) => normalizeAvatarSettings({ ...current, ...patch }))
  }

  function styleRow(id, icon) {
    const key = STYLE_KEYS[id]
    const lastActive = draft[key] && activeStyles <= 1
    return (
      <AdminToggleRow
        icon={icon}
        label={adminText(t, `admin.avatar.${id}`)}
        hint={
          lastActive
            ? adminText(t, 'admin.avatar.atLeastOne')
            : adminText(t, `admin.avatar.${id}Hint`)
        }
        enabled={draft[key]}
        disabled={lastActive}
        onToggle={() => update({ [key]: !draft[key] })}
      />
    )
  }

  async function save() {
    try {
      if (moduleDirty) {
        await dispatch(savePlatformModules({ ...remoteFlags, avatar: draftEnabled })).unwrap()
      }
      if (settingsDirty) await dispatch(saveAvatarSettings(draft)).unwrap()
      dispatch(addToast({ title: adminText(t, 'admin.avatar.saved'), tone: 'success' }))
    } catch (error) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.avatar.saveFailed'),
          message: typeof error === 'string' ? error : error?.message,
          tone: 'error',
        }),
      )
    }
  }

  function refreshStats() {
    setStats((current) => ({ ...current, status: 'loading' }))
    setStatsNonce((value) => value + 1)
  }

  return (
    <div className="grid gap-4">
      <Card className={`${CARD} grid gap-3 p-5`}>
        <div>
          <h2 className="text-lg font-black">{adminText(t, 'admin.avatar.title')}</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {adminText(t, 'admin.avatar.description')}
          </p>
        </div>
        <p className="rounded-xl border border-brand-200/70 bg-brand-50/80 px-3 py-2 text-xs text-brand-900 dark:border-brand-900/40 dark:bg-brand-900/30 dark:text-brand-100">
          {adminText(t, 'admin.avatar.hint')}
        </p>
      </Card>

      <AdminToggleRow
        icon={FiSmile}
        label={adminText(t, 'admin.avatar.enabled')}
        hint={adminText(t, 'admin.avatar.enabledHint')}
        enabled={draftEnabled}
        onToggle={() => setDraftEnabled((value) => !value)}
      />

      {draftEnabled ? null : (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {adminText(t, 'admin.avatar.disabledNotice')}
        </p>
      )}

      <div className={`grid gap-3 transition ${draftEnabled ? '' : 'opacity-60'}`}>
        <SectionTitle>{adminText(t, 'admin.avatar.sections.styles')}</SectionTitle>
        {styleRow('portrait', FiCamera)}
        {styleRow('lorelei', FiEdit3)}
        {styleRow('photo', FiImage)}
        <DefaultStyleRow
          t={t}
          value={draft.defaultStyle}
          styles={generatedStyles}
          onChange={(id) => update({ defaultStyle: id })}
        />

        <SectionTitle>{adminText(t, 'admin.avatar.sections.prompt')}</SectionTitle>
        <AdminToggleRow
          icon={FiBell}
          label={adminText(t, 'admin.avatar.promptEnabled')}
          hint={adminText(t, 'admin.avatar.promptEnabledHint')}
          enabled={draft.promptEnabled}
          onToggle={() => update({ promptEnabled: !draft.promptEnabled })}
        />
        <div className={`grid gap-3 ${draft.promptEnabled ? '' : 'opacity-60'}`}>
          <NumberRow
            icon={FiHash}
            label={adminText(t, 'admin.avatar.promptMaxShows')}
            hint={adminText(t, 'admin.avatar.promptMaxShowsHint')}
            value={draft.promptMaxShows}
            limits={AVATAR_SETTINGS_LIMITS.promptMaxShows}
            onCommit={(value) => update({ promptMaxShows: value })}
          />
          <NumberRow
            icon={FiClock}
            label={adminText(t, 'admin.avatar.promptIntervalHours')}
            hint={adminText(t, 'admin.avatar.promptIntervalHoursHint')}
            value={draft.promptIntervalHours}
            limits={AVATAR_SETTINGS_LIMITS.promptIntervalHours}
            onCommit={(value) => update({ promptIntervalHours: value })}
          />
          <NumberRow
            icon={FiWatch}
            label={adminText(t, 'admin.avatar.promptDelaySeconds')}
            hint={adminText(t, 'admin.avatar.promptDelaySecondsHint')}
            value={draft.promptDelaySeconds}
            limits={AVATAR_SETTINGS_LIMITS.promptDelaySeconds}
            onCommit={(value) => update({ promptDelaySeconds: value })}
          />
        </div>

        <SectionTitle>{adminText(t, 'admin.avatar.sections.badge')}</SectionTitle>
        <AdminToggleRow
          icon={FiAward}
          label={adminText(t, 'admin.avatar.badgeEnabled')}
          hint={adminText(t, 'admin.avatar.badgeEnabledHint')}
          enabled={draft.badgeEnabled}
          onToggle={() => update({ badgeEnabled: !draft.badgeEnabled })}
        />
      </div>

      <SectionTitle>{adminText(t, 'admin.avatar.sections.stats')}</SectionTitle>
      <StatsCard t={t} stats={stats} onRefresh={refreshStats} />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={(!settingsDirty && !moduleDirty) || saving}
          loading={saving}
          onClick={save}
        >
          {adminText(t, 'admin.avatar.save')}
        </Button>
        {updatedAt ? (
          <p className="text-xs text-[var(--app-text-muted)]">
            {adminText(t, 'admin.avatar.updatedAt', { date: new Date(updatedAt).toLocaleString() })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
