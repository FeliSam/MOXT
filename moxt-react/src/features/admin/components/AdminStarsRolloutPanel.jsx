import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiPercent, FiUserPlus, FiZap } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useLanguage } from '../../../contexts/useLanguage'
import { adminText } from '../adminI18n'

const ROLLOUT_PRESETS = [
  { id: 'off', enabled: false, rolloutPercent: 0 },
  { id: 'pilot', enabled: true, rolloutPercent: 0 },
  { id: '10', enabled: true, rolloutPercent: 10 },
  { id: '50', enabled: true, rolloutPercent: 50 },
  { id: '100', enabled: true, rolloutPercent: 100 },
]

function parsePilotIds(raw) {
  return String(raw || '')
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean)
}

function formatPilotIds(ids = []) {
  return (ids || []).join('\n')
}

export function AdminStarsRolloutPanel({ config, onSave, saving = false }) {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const [enabled, setEnabled] = useState(Boolean(config?.enabled))
  const [rolloutPercent, setRolloutPercent] = useState(Number(config?.rolloutPercent || 0))
  const [pilotText, setPilotText] = useState(formatPilotIds(config?.pilotUserIds))
  const [newPilotId, setNewPilotId] = useState('')

  useEffect(() => {
    if (!config) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync rollout controls from remote config
    setEnabled(Boolean(config.enabled))
    setRolloutPercent(Number(config.rolloutPercent || 0))
    setPilotText(formatPilotIds(config.pilotUserIds))
  }, [config])

  const pilotIds = useMemo(() => parsePilotIds(pilotText), [pilotText])
  const statusKey = !enabled
    ? 'off'
    : rolloutPercent >= 100
      ? 'full'
      : rolloutPercent > 0
        ? 'partial'
        : pilotIds.length
          ? 'pilot'
          : 'enabledNoRollout'

  function buildPayload(overrides = {}) {
    const pilots = overrides.pilotUserIds ?? pilotIds
    return {
      enabled: overrides.enabled ?? enabled,
      rolloutPercent: Math.max(0, Math.min(100, Number(overrides.rolloutPercent ?? rolloutPercent) || 0)),
      pilotUserIds: pilots,
    }
  }

  async function applyPreset(preset) {
    setEnabled(preset.enabled)
    setRolloutPercent(preset.rolloutPercent)
    if (preset.id === 'pilot' && user?.id && !pilotIds.includes(user.id)) {
      const merged = [...pilotIds, user.id]
      setPilotText(formatPilotIds(merged))
      await onSave?.({
        enabled: preset.enabled,
        rolloutPercent: preset.rolloutPercent,
        pilotUserIds: merged,
      })
      return
    }
    await onSave?.(buildPayload({ enabled: preset.enabled, rolloutPercent: preset.rolloutPercent }))
  }

  async function handleSave() {
    await onSave?.(buildPayload())
  }

  function addPilotId() {
    const id = newPilotId.trim()
    if (!id || pilotIds.includes(id)) return
    setPilotText(formatPilotIds([...pilotIds, id]))
    setNewPilotId('')
  }

  function addSelfToPilot() {
    if (!user?.id || pilotIds.includes(user.id)) return
    setPilotText(formatPilotIds([...pilotIds, user.id]))
  }

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black">
            <FiZap className="text-amber-600" aria-hidden />
            {adminText(t, 'admin.stars.rolloutTitle')}
          </h3>
          <p className="mt-1 text-xs text-[var(--app-text-muted)]">
            {adminText(t, 'admin.stars.rolloutDescription')}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${
            statusKey === 'off'
              ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
              : statusKey === 'full'
                ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/12 text-amber-800 dark:text-amber-200'
          }`}
        >
          {statusKey === 'off' ? <FiAlertCircle aria-hidden /> : <FiCheckCircle aria-hidden />}
          {adminText(t, `admin.stars.rolloutStatus.${statusKey}`)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLLOUT_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => applyPreset(preset)}
          >
            {adminText(t, `admin.stars.rolloutPreset.${preset.id}`)}
          </Button>
        ))}
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-5 rounded"
        />
        <span className="text-sm font-bold">{adminText(t, 'admin.stars.rolloutEnabled')}</span>
      </label>

      <div className="grid gap-2">
        <label className="flex items-center justify-between text-xs font-bold text-[var(--app-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <FiPercent aria-hidden />
            {adminText(t, 'admin.stars.rolloutPercent')}
          </span>
          <span className="tabular-nums text-[var(--app-text)]">{rolloutPercent}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={rolloutPercent}
          onChange={(e) => setRolloutPercent(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <p className="text-[11px] text-[var(--app-text-faint)]">
          {adminText(t, 'admin.stars.rolloutPercentHint')}
        </p>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-bold text-[var(--app-text-muted)]">
          {adminText(t, 'admin.stars.pilotTitle')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            className="min-w-[12rem] flex-1"
            placeholder={adminText(t, 'admin.stars.pilotPlaceholder')}
            value={newPilotId}
            onChange={(e) => setNewPilotId(e.target.value)}
          />
          <Button variant="secondary" size="sm" icon={FiUserPlus} onClick={addPilotId} disabled={!newPilotId.trim()}>
            {adminText(t, 'admin.stars.pilotAdd')}
          </Button>
          {user?.id ? (
            <Button variant="secondary" size="sm" onClick={addSelfToPilot} disabled={pilotIds.includes(user.id)}>
              {adminText(t, 'admin.stars.pilotAddSelf')}
            </Button>
          ) : null}
        </div>
        <textarea
          value={pilotText}
          onChange={(e) => setPilotText(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 font-mono text-xs"
          placeholder="uuid-1&#10;uuid-2"
        />
        <p className="text-[11px] text-[var(--app-text-faint)]">{adminText(t, 'admin.stars.pilotHint')}</p>
      </div>

      <Button onClick={handleSave} loading={saving} disabled={saving}>
        {adminText(t, 'admin.stars.rolloutSave')}
      </Button>
    </Card>
  )
}

export function mergeStarsRolloutConfig(base = {}, rollout = {}) {
  return {
    ...base,
    enabled: Boolean(rollout.enabled),
    rolloutPercent: Math.max(0, Math.min(100, Number(rollout.rolloutPercent) || 0)),
    pilotUserIds: Array.isArray(rollout.pilotUserIds)
      ? rollout.pilotUserIds.filter(Boolean)
      : parsePilotIds(rollout.pilotUserIds),
  }
}
