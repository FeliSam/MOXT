import { useEffect, useState } from 'react'
import { FiGift, FiSave, FiStar, FiTrendingUp, FiZap } from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useLanguage } from '../../../contexts/useLanguage'
import {
  ADMIN_DURATION_KEYS,
  ADMIN_PUBLISH_KEYS,
  mergePricingIntoConfig,
  pricingFormFromConfig,
} from '../adminStarsConfigForm'
import { adminText } from '../adminI18n'

const PUBLISH_LABEL_KEYS = {
  marketplace: 'admin.stars.cat.marketplace',
  jobs: 'admin.stars.cat.jobs',
  events: 'admin.stars.cat.events',
  parcel: 'admin.stars.cat.parcel',
  video: 'admin.stars.cat.video',
}

const DURATION_LABEL_KEYS = {
  '24h': 'admin.stars.duration24h',
  '3d': 'admin.stars.duration3d',
  '7d': 'admin.stars.duration7d',
}

function StarsField({ label, hint, value, onChange, className = '' }) {
  return (
    <Input
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      label={label}
      hint={hint}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      iconRight={<span className="text-xs font-black text-[var(--app-text-faint)]">★</span>}
      className={`tabular-nums ${className}`}
    />
  )
}

function SectionBlock({ title, description, icon: Icon, children }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--app-border)]/70 bg-[var(--app-surface-muted)]/40 p-4">
      <div>
        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
          {Icon ? <Icon className="text-sm text-brand-600" aria-hidden /> : null}
          {title}
        </h4>
        {description ? (
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--app-text-faint)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function DualCostRow({ label, defaultValue, videoValue, onDefaultChange, onVideoChange, adminT }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,7rem))] sm:items-end">
      <p className="text-sm font-semibold sm:pb-2">{label}</p>
      <StarsField
        label={adminT('admin.stars.colStandard')}
        value={defaultValue}
        onChange={onDefaultChange}
      />
      <StarsField
        label={adminT('admin.stars.colVideo')}
        value={videoValue}
        onChange={onVideoChange}
      />
    </div>
  )
}

export function AdminStarsPricingPanel({ config, onSave, saving = false, onSeedBonus, seeding = false }) {
  const { t } = useLanguage()
  const adminT = (key) => adminText(t, key)
  const [form, setForm] = useState(() => pricingFormFromConfig(config))

  useEffect(() => {
    if (config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync admin form from remote config
      setForm(pricingFormFromConfig(config))
    }
  }, [config])

  function patch(path, value) {
    setForm((current) => {
      if (typeof path === 'function') return path(current)
      const [group, key] = path
      return { ...current, [group]: { ...current[group], [key]: value } }
    })
  }

  async function handleSave() {
    await onSave?.(mergePricingIntoConfig(config, form))
  }

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-black">
          <FiStar className="text-brand-600" aria-hidden />
          {adminT('admin.stars.pricingTitle')}
        </h3>
        <p className="mt-1 text-xs text-[var(--app-text-muted)]">{adminT('admin.stars.pricingDescription')}</p>
      </div>

      <SectionBlock
        title={adminT('admin.stars.sectionPool')}
        description={adminT('admin.stars.sectionPoolHint')}
        icon={FiGift}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StarsField
            label={adminT('admin.stars.poolPersonal')}
            hint={adminT('admin.stars.poolPersonalHint')}
            value={form.poolPersonal}
            onChange={(value) => setForm((current) => ({ ...current, poolPersonal: value }))}
          />
          <StarsField
            label={adminT('admin.stars.poolBusiness')}
            hint={adminT('admin.stars.poolBusinessHint')}
            value={form.poolBusiness}
            onChange={(value) => setForm((current) => ({ ...current, poolBusiness: value }))}
          />
        </div>
      </SectionBlock>

      <SectionBlock
        title={adminT('admin.stars.sectionPublish')}
        description={adminT('admin.stars.sectionPublishHint')}
        icon={FiStar}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_PUBLISH_KEYS.map((key) => (
            <StarsField
              key={key}
              label={adminT(PUBLISH_LABEL_KEYS[key])}
              value={form.publish[key]}
              onChange={(value) => patch(['publish', key], value)}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title={adminT('admin.stars.sectionFormulas')}
        description={adminT('admin.stars.sectionFormulasHint')}
        icon={FiTrendingUp}
      >
        <div className="grid gap-4">
          <DualCostRow
            label={adminT('admin.stars.formulaFeatured24h')}
            defaultValue={form.featured24hDefault}
            videoValue={form.featured24hVideo}
            onDefaultChange={(value) => setForm((current) => ({ ...current, featured24hDefault: value }))}
            onVideoChange={(value) => setForm((current) => ({ ...current, featured24hVideo: value }))}
            adminT={adminT}
          />
          <DualCostRow
            label={adminT('admin.stars.formulaFeatured7d')}
            defaultValue={form.featured7dDefault}
            videoValue={form.featured7dVideo}
            onDefaultChange={(value) => setForm((current) => ({ ...current, featured7dDefault: value }))}
            onVideoChange={(value) => setForm((current) => ({ ...current, featured7dVideo: value }))}
            adminT={adminT}
          />
        </div>
      </SectionBlock>

      <SectionBlock
        title={adminT('admin.stars.sectionStatus')}
        description={adminT('admin.stars.sectionStatusHint')}
        icon={FiZap}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {ADMIN_DURATION_KEYS.map((key) => (
            <StarsField
              key={key}
              label={adminT(DURATION_LABEL_KEYS[key])}
              value={form.status[key]}
              onChange={(value) => patch(['status', key], value)}
            />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title={adminT('admin.stars.sectionBoost')}
        description={adminT('admin.stars.sectionBoostHint')}
        icon={FiTrendingUp}
      >
        <div className="grid gap-4">
          {ADMIN_DURATION_KEYS.map((key) => (
            <DualCostRow
              key={key}
              label={adminT(DURATION_LABEL_KEYS[key])}
              defaultValue={form.boostDefault[key]}
              videoValue={form.boostVideo[key]}
              onDefaultChange={(value) => patch(['boostDefault', key], value)}
              onVideoChange={(value) => patch(['boostVideo', key], value)}
              adminT={adminT}
            />
          ))}
        </div>
      </SectionBlock>

      <div className="flex flex-wrap gap-2 border-t border-[var(--app-border)]/60 pt-4">
        <Button icon={FiSave} onClick={handleSave} disabled={saving}>
          {adminT('admin.stars.savePricing')}
        </Button>
        {onSeedBonus ? (
          <Button variant="secondary" onClick={onSeedBonus} disabled={seeding}>
            {adminT('admin.stars.seedProrata')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
