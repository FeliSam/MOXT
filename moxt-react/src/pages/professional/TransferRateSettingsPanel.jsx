import { useMemo, useState } from 'react'
import { FiSave, FiSliders } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useLanguage } from '../../contexts/useLanguage'
import { professionalText } from '../../features/businesses/professionalI18n'
import { updateBusinessTransferPricing } from '../../features/businesses/businessSlice'
import { addToast } from '../../features/ui/uiSlice'
import { currencyForCountry, DIRECTIONS } from '../../features/transfers/transferConfig'
import {
  calculateTransfer,
  formatMoney,
} from '../../features/transfers/transferUtils'
import { useExchangeRate } from '../../features/transfers/useExchangeRate'

function clampReduction(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(15, Math.max(0, n))
}

export function TransferRateSettingsPanel({ business, dispatch, user }) {
  const { t } = useLanguage()
  const pt = (key, vars) => professionalText(t, key, vars)
  const originCountry =
    user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ')
  const originCurrency = currencyForCountry(originCountry)
  const liveRate = useExchangeRate(originCurrency)

  const [feePercent, setFeePercent] = useState(String(business.feePercent ?? 2.5))
  const [reductionToRu, setReductionToRu] = useState(
    String(business.rateReductionToRu ?? 0),
  )
  const [reductionFromRu, setReductionFromRu] = useState(
    String(business.rateReductionFromRu ?? 0),
  )
  const [saving, setSaving] = useState(false)

  const previewToRu = useMemo(
    () =>
      calculateTransfer(
        100000,
        DIRECTIONS.BJ_TO_RU,
        Number(feePercent) || 0,
        liveRate.originToRub,
        originCountry,
        clampReduction(reductionToRu),
      ),
    [feePercent, liveRate.originToRub, originCountry, reductionToRu],
  )

  const previewFromRu = useMemo(
    () =>
      calculateTransfer(
        10000,
        DIRECTIONS.RU_TO_BJ,
        Number(feePercent) || 0,
        liveRate.rubToOrigin,
        originCountry,
        clampReduction(reductionFromRu),
      ),
    [feePercent, liveRate.rubToOrigin, originCountry, reductionFromRu],
  )

  function handleSave() {
    setSaving(true)
    dispatch(
      updateBusinessTransferPricing({
        businessId: business.id,
        ownerId: business.ownerId,
        feePercent: Math.max(0, Number(feePercent) || 0),
        rateReductionToRu: clampReduction(reductionToRu),
        rateReductionFromRu: clampReduction(reductionFromRu),
      }),
    )
    dispatch(
      addToast({
        title: pt('professional.rateSettings.toastSavedTitle'),
        message: pt('professional.rateSettings.toastSavedBody'),
        tone: 'success',
      }),
    )
    setSaving(false)
  }

  return (
    <Card className="grid gap-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <FiSliders />
        </span>
        <div className="min-w-0">
          <h3 className="font-black">{pt('professional.rateSettings.title')}</h3>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {pt('professional.rateSettings.description', {
              currency: originCurrency,
              source: liveRate.loading
                ? pt('professional.rateSettings.rateLoading')
                : liveRate.source || 'Frankfurter',
            })}
          </p>
        </div>
      </div>

      <Input
        id="biz-fee-percent"
        label={pt('professional.rateSettings.feePercent')}
        type="number"
        min="0"
        step="0.1"
        value={feePercent}
        onChange={(event) => setFeePercent(event.target.value)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RateDirectionCard
          inputId="rate-reduction-to-ru"
          title={pt('professional.rateSettings.toRuTitle')}
          subtitle={pt('professional.rateSettings.toRuSubtitle', {
            from: originCurrency,
            to: 'RUB',
          })}
          frankfurter={liveRate.originToRub}
          reduction={reductionToRu}
          onReductionChange={setReductionToRu}
          preview={previewToRu}
          pt={pt}
        />
        <RateDirectionCard
          inputId="rate-reduction-from-ru"
          title={pt('professional.rateSettings.fromRuTitle')}
          subtitle={pt('professional.rateSettings.fromRuSubtitle', {
            from: 'RUB',
            to: originCurrency,
          })}
          frankfurter={liveRate.rubToOrigin}
          reduction={reductionFromRu}
          onReductionChange={setReductionFromRu}
          preview={previewFromRu}
          pt={pt}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" icon={FiSave} loading={saving} onClick={handleSave}>
          {pt('professional.rateSettings.save')}
        </Button>
      </div>
    </Card>
  )
}

function RateDirectionCard({
  inputId,
  title,
  subtitle,
  frankfurter,
  reduction,
  onReductionChange,
  preview,
  pt,
}) {
  const raw = Number(frankfurter) || preview.rawRate
  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 p-4">
      <div>
        <strong className="block text-sm">{title}</strong>
        <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{subtitle}</p>
      </div>
      <p className="text-xs text-[var(--app-text-muted)]">
        {pt('professional.rateSettings.frankfurterLabel', {
          rate: raw.toFixed(6),
        })}
      </p>
      <Input
        id={inputId}
        label={pt('professional.rateSettings.reductionPercent')}
        type="number"
        min="0"
        max="15"
        step="0.1"
        value={reduction}
        onChange={(event) => onReductionChange(event.target.value)}
        hint={pt('professional.rateSettings.reductionHint')}
      />
      <div className="rounded-xl bg-[var(--app-surface)] px-3 py-2.5 text-sm">
        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--app-text-muted)]">
          {pt('professional.rateSettings.clientPreview')}
        </p>
        <strong className="mt-1 block">
          1 {preview.currencyFrom} = {preview.rate.toFixed(6)} {preview.currencyTo}
        </strong>
        <p className="mt-1 text-xs text-[var(--app-text-muted)]">
          {pt('professional.rateSettings.exampleTotal', {
            total: formatMoney(preview.totalToPay, preview.currencyFrom),
            fees: formatMoney(preview.fees, preview.currencyFrom),
          })}
        </p>
      </div>
    </div>
  )
}
