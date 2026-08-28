import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useLanguage } from '../../../contexts/useLanguage'
import { adminText } from '../adminI18n'
import { CARD } from '../adminConfig'
import {
  AdminStarsRolloutPanel,
  mergeStarsRolloutConfig,
} from './AdminStarsRolloutPanel'
import { AdminStarsPricingPanel } from './AdminStarsPricingPanel'
import {
  adminAdjustStars,
  adminFailPurchase,
  adminFulfillPurchase,
  adminSeedBonusProrata,
  adminStarsSuspects,
  adminUpdateStarsConfig,
  fetchStarsPurchases,
  fetchStarsQuotaConfig,
} from '../../stars/starsRemote'
import { loadStarsOverview } from '../../stars/starsSlice'
import { useDispatch, useSelector } from 'react-redux'
import { addToast } from '../../ui/uiSlice'

export function AdminStarsPanel() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const overview = useSelector((state) => state.stars.overview)
  const [suspects, setSuspects] = useState({ spikes: [], failedPurchases: [] })
  const [purchases, setPurchases] = useState([])
  const [config, setConfig] = useState(null)
  const [adjust, setAdjust] = useState({ ownerId: '', amount: '10', reason: '' })
  const [rolloutSaving, setRolloutSaving] = useState(false)
  const [pricingSaving, setPricingSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    dispatch(loadStarsOverview())
    adminStarsSuspects()
      .then(setSuspects)
      .catch(() => setSuspects({ spikes: [], failedPurchases: [] }))
    fetchStarsPurchases()
      .then(setPurchases)
      .catch(() => setPurchases([]))
    fetchStarsQuotaConfig()
      .then((next) => {
        if (next) setConfig(next)
      })
      .catch(() => {})
  }, [dispatch])

  async function persistConfig(nextConfig) {
    await adminUpdateStarsConfig(nextConfig)
    setConfig(nextConfig)
    dispatch(loadStarsOverview())
  }

  async function savePricing(nextPricingConfig) {
    setPricingSaving(true)
    try {
      await persistConfig(nextPricingConfig)
      dispatch(addToast({ title: adminText(t, 'admin.stars.saved'), tone: 'success' }))
    } catch (error) {
      dispatch(addToast({ title: adminText(t, 'admin.stars.saveFailed'), message: error.message, tone: 'error' }))
    } finally {
      setPricingSaving(false)
    }
  }

  async function saveRollout(rollout) {
    setRolloutSaving(true)
    try {
      const base = config || {}
      const next = mergeStarsRolloutConfig(base, rollout)
      await persistConfig(next)
      dispatch(addToast({ title: adminText(t, 'admin.stars.rolloutSaved'), tone: 'success' }))
    } catch (error) {
      dispatch(addToast({ title: adminText(t, 'admin.stars.saveFailed'), message: error.message, tone: 'error' }))
    } finally {
      setRolloutSaving(false)
    }
  }

  async function seedBonusPool() {
    setSeeding(true)
    try {
      const count = await adminSeedBonusProrata()
      dispatch(
        addToast({
          title: adminText(t, 'admin.stars.seeded'),
          message: String(count),
          tone: 'success',
        }),
      )
    } catch (error) {
      dispatch(addToast({ title: adminText(t, 'admin.stars.seedFailed'), message: error.message, tone: 'error' }))
    } finally {
      setSeeding(false)
    }
  }

  async function applyAdjust() {
    try {
      await adminAdjustStars({
        ownerType: 'user',
        ownerId: adjust.ownerId.trim(),
        amount: Number(adjust.amount),
        reason: adjust.reason.trim(),
      })
      dispatch(addToast({ title: adminText(t, 'admin.stars.adjusted'), tone: 'success' }))
    } catch (error) {
      dispatch(addToast({ title: adminText(t, 'admin.stars.adjustFailed'), message: error.message, tone: 'error' }))
    }
  }

  return (
    <div className="grid gap-4">
      <div className={`${CARD} grid gap-3 p-5 sm:grid-cols-4`}>
        {[
          ['sold', overview?.sold],
          ['used', overview?.used],
          ['gifted', overview?.gifted],
          ['revenueRub', overview?.revenueRub],
        ].map(([key, value]) => (
          <div key={key}>
            <p className="text-xs font-bold text-[var(--app-text-muted)]">{adminText(t, `admin.stars.kpi.${key}`)}</p>
            <p className="font-display text-2xl font-black tabular-nums">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      <AdminStarsRolloutPanel config={config} onSave={saveRollout} saving={rolloutSaving} />

      <AdminStarsPricingPanel
        config={config}
        onSave={savePricing}
        saving={pricingSaving}
        onSeedBonus={seedBonusPool}
        seeding={seeding}
      />

      <Card className="grid gap-3 p-5">
        <h3 className="text-sm font-black">{adminText(t, 'admin.stars.purchasesTitle')}</h3>
        {!purchases.length ? (
          <p className="text-sm text-[var(--app-text-muted)]">{adminText(t, 'admin.stars.purchasesEmpty')}</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {purchases.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--app-border)]/60 px-3 py-2">
                <span>
                  {item.owner_id?.slice(0, 8)} · {item.status} · {item.price_rub} ₽
                </span>
                {item.status === 'pending' ? (
                  <span className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await adminFulfillPurchase(item.id)
                        dispatch(loadStarsOverview())
                      }}
                    >
                      {adminText(t, 'admin.stars.confirmPay')}
                    </Button>
                    <Button variant="danger" onClick={() => adminFailPurchase(item.id)}>
                      {adminText(t, 'admin.stars.markFailed')}
                    </Button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="grid gap-3 p-5">
        <div>
          <h3 className="text-sm font-black">{adminText(t, 'admin.stars.adjustTitle')}</h3>
          <p className="mt-1 text-xs text-[var(--app-text-muted)]">{adminText(t, 'admin.stars.adjustHint')}</p>
        </div>
        <Input
          label={adminText(t, 'admin.stars.ownerId')}
          value={adjust.ownerId}
          onChange={(e) => setAdjust((s) => ({ ...s, ownerId: e.target.value }))}
        />
        <Input
          label={adminText(t, 'admin.stars.amount')}
          value={adjust.amount}
          onChange={(e) => setAdjust((s) => ({ ...s, amount: e.target.value }))}
        />
        <Input
          label={adminText(t, 'admin.stars.reason')}
          value={adjust.reason}
          onChange={(e) => setAdjust((s) => ({ ...s, reason: e.target.value }))}
        />
        <Button onClick={applyAdjust} disabled={!adjust.ownerId.trim() || !adjust.reason.trim()}>
          {adminText(t, 'admin.stars.applyAdjust')}
        </Button>
      </Card>

      {(suspects.spikes?.length || suspects.failedPurchases?.length) ? (
        <Card className="grid gap-3 p-5">
          <h3 className="text-sm font-black">{adminText(t, 'admin.stars.suspectsTitle')}</h3>
          <p className="text-xs text-[var(--app-text-muted)]">
            {adminText(t, 'admin.stars.spikes')}: {(suspects.spikes || []).length} ·{' '}
            {adminText(t, 'admin.stars.failedBuys')}: {(suspects.failedPurchases || []).length}
          </p>
        </Card>
      ) : null}
    </div>
  )
}
