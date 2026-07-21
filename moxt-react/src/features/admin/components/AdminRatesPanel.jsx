import { useEffect, useState } from 'react'
import { FiPercent, FiSave, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { useLanguage } from '../../../contexts/useLanguage'
import { adminText } from '../adminI18n'
import { CARD } from '../adminConfig'
import { clearPlatformRates, setPlatformRates } from '../platformRatesSlice'
import { addToast } from '../../ui/uiSlice'
import { COUNTRY_CURRENCIES } from '../../transfers/transferConfig'
import { useExchangeRate } from '../../transfers/useExchangeRate'
import { formatP2PRate } from '../../p2p/p2pUtils'

const ORIGIN_CURRENCIES = [
  ...new Set(
    Object.values(COUNTRY_CURRENCIES).filter((currency) => currency && currency !== 'RUB'),
  ),
].sort()

function RateKindEditor({
  currency,
  kind,
  title,
  description,
  liveRate,
  t,
  admin,
}) {
  const dispatch = useDispatch()
  const saved = useSelector((state) => state.platformRates.pairs?.[currency]?.[kind] || {})
  const [originToRub, setOriginToRub] = useState(
    saved.originToRub != null ? String(saved.originToRub) : '',
  )
  const [rubToOrigin, setRubToOrigin] = useState(
    saved.rubToOrigin != null ? String(saved.rubToOrigin) : '',
  )
  const [saving, setSaving] = useState(false)

  // Keep form in sync when currency/kind or saved values change
  useEffect(() => {
    setOriginToRub(saved.originToRub != null ? String(saved.originToRub) : '')
    setRubToOrigin(saved.rubToOrigin != null ? String(saved.rubToOrigin) : '')
  }, [currency, kind, saved.originToRub, saved.rubToOrigin])

  function handleSave() {
    setSaving(true)
    dispatch(
      setPlatformRates({
        currency,
        kind,
        originToRub: originToRub === '' ? null : Number(originToRub),
        rubToOrigin: rubToOrigin === '' ? null : Number(rubToOrigin),
        updatedBy: admin?.id || null,
      }),
    )
    dispatch(
      addToast({
        title: adminText(t, 'admin.rates.toastSavedTitle'),
        message: adminText(t, 'admin.rates.toastSavedBody', { kind: title, currency }),
        tone: 'success',
      }),
    )
    setSaving(false)
  }

  function handleClear() {
    dispatch(
      clearPlatformRates({
        currency,
        kind,
        updatedBy: admin?.id || null,
      }),
    )
    setOriginToRub('')
    setRubToOrigin('')
    dispatch(
      addToast({
        title: adminText(t, 'admin.rates.toastClearedTitle'),
        message: adminText(t, 'admin.rates.toastClearedBody', { kind: title, currency }),
        tone: 'info',
      }),
    )
  }

  function applyFrankfurter() {
    if (liveRate?.originToRub) setOriginToRub(String(liveRate.originToRub))
    if (liveRate?.rubToOrigin) setRubToOrigin(String(liveRate.rubToOrigin))
  }

  return (
    <Card className="grid gap-4">
      <div>
        <h3 className="font-black text-[var(--app-text)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p>
      </div>
      <div className="rounded-xl bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text-muted)]">
        {adminText(t, 'admin.rates.frankfurterHint', {
          originToRub: liveRate?.originToRub != null ? formatP2PRate(liveRate.originToRub) : '—',
          rubToOrigin: liveRate?.rubToOrigin != null ? formatP2PRate(liveRate.rubToOrigin) : '—',
          currency,
          source: liveRate?.marketSource || liveRate?.source || 'Frankfurter',
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`admin-rate-${kind}-origin-rub`}
          label={adminText(t, 'admin.rates.originToRub', { currency })}
          type="number"
          step="0.0001"
          inputMode="decimal"
          value={originToRub}
          onChange={(event) => setOriginToRub(event.target.value)}
        />
        <Input
          id={`admin-rate-${kind}-rub-origin`}
          label={adminText(t, 'admin.rates.rubToOrigin', { currency })}
          type="number"
          step="0.0001"
          inputMode="decimal"
          value={rubToOrigin}
          onChange={(event) => setRubToOrigin(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icon={FiSave} loading={saving} disabled={saving} onClick={handleSave}>
          {adminText(t, 'admin.rates.save')}
        </Button>
        <Button variant="secondary" onClick={applyFrankfurter}>
          {adminText(t, 'admin.rates.useFrankfurter')}
        </Button>
        <Button variant="secondary" icon={FiTrash2} onClick={handleClear}>
          {adminText(t, 'admin.rates.clear')}
        </Button>
      </div>
    </Card>
  )
}

export function AdminRatesPanel({ admin }) {
  const { t } = useLanguage()
  const [currency, setCurrency] = useState('XOF')
  const liveRate = useExchangeRate(currency, { kind: 'market' })
  const updatedAt = useSelector((state) => state.platformRates.updatedAt)

  return (
    <div className="grid gap-5">
      <div className={`${CARD} grid gap-3 p-5`}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <FiPercent className="text-lg" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black">{adminText(t, 'admin.rates.title')}</h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {adminText(t, 'admin.rates.description')}
            </p>
            {updatedAt ? (
              <p className="mt-2 text-xs text-[var(--app-text-faint)]">
                {adminText(t, 'admin.rates.updatedAt', {
                  date: new Date(updatedAt).toLocaleString(),
                })}
              </p>
            ) : null}
          </div>
        </div>
        <Select
          id="admin-rates-currency"
          label={adminText(t, 'admin.rates.currency')}
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
        >
          {ORIGIN_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code} ↔ RUB
            </option>
          ))}
        </Select>
      </div>

      <RateKindEditor
        admin={admin}
        currency={currency}
        description={adminText(t, 'admin.rates.transferDescription')}
        kind="transfer"
        liveRate={liveRate}
        t={t}
        title={adminText(t, 'admin.rates.transferTitle')}
      />
      <RateKindEditor
        admin={admin}
        currency={currency}
        description={adminText(t, 'admin.rates.p2pDescription')}
        kind="p2p"
        liveRate={liveRate}
        t={t}
        title={adminText(t, 'admin.rates.p2pTitle')}
      />
    </div>
  )
}
