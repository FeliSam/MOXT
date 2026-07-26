import { useMemo, useState } from 'react'
import { FiArrowLeft, FiRepeat, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { ensurePhoneCountry, phoneError, phonePlaceholder, validatePhone } from '../config/phone'
import { useLanguage } from '../contexts/useLanguage'
import { updateOffer } from '../features/p2p/p2pSlice'
import {
  applyP2PRateMargin,
  calculateP2PFee,
  clampP2PRateMargin,
  formatP2PRate,
  frankfurterRateForPair,
  P2P_CONFIG,
  p2pLimit,
} from '../features/p2p/p2pUtils'
import { methodCountryForP2POffer, usePaymentMethodOptions } from '../features/p2p/usePaymentMethodOptions'
import { currencyForCountry, transferCurrenciesForCountry } from '../features/transfers/transferConfig'
import { useExchangeRate } from '../features/transfers/useExchangeRate'
import { formatMoney } from '../features/transfers/transferUtils'
import { addToast } from '../features/ui/uiSlice'

export function EditP2POfferPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { offerId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const offer = useSelector((state) => state.p2p.offers.find((item) => item.id === offerId))

  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const originCurrency = currencyForCountry(originCountry)
  const availableCurrencies = transferCurrenciesForCountry(originCountry)
  const otherCurrency = (currency) => (currency === 'RUB' ? originCurrency : 'RUB')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState(null)

  const values = form ?? {
    fromCurrency: offer?.fromCurrency || originCurrency,
    toCurrency: offer?.toCurrency || 'RUB',
    amount: offer?.amount != null ? String(offer.amount) : '',
    rate: offer?.rate != null ? String(offer.rate) : '',
    rateMarginPercent: offer?.rateMarginPercent != null ? String(offer.rateMarginPercent) : '0',
    method: offer?.method || '',
    receivePhone: offer?.receivePhone || '',
    receiveName: offer?.receiveName || '',
    comment: offer?.comment || '',
  }

  const liveRate = useExchangeRate(originCurrency, { kind: 'p2p' })
  const methodCountry = methodCountryForP2POffer(values.fromCurrency, originCountry)
  const { options: methodOptions, loading: methodsLoading, isRussia: methodIsRussia } =
    usePaymentMethodOptions(methodCountry)

  const frankfurterRaw = useMemo(
    () => frankfurterRateForPair(liveRate, values.fromCurrency, values.toCurrency, originCurrency),
    [values.fromCurrency, values.toCurrency, liveRate, originCurrency],
  )
  const appliedRate = useMemo(
    () => applyP2PRateMargin(frankfurterRaw, values.rateMarginPercent),
    [frankfurterRaw, values.rateMarginPercent],
  )
  const rateFormatted = formatP2PRate(appliedRate) || values.rate
  const frankfurterFormatted = formatP2PRate(frankfurterRaw)

  if (!offer) return <Card>{t('p2p.edit.notFound')}</Card>
  if (offer.ownerId !== user.id) return <Navigate to={`/p2p/${offerId}`} replace />

  function set(field, value) {
    setForm((prev) => {
      const current = prev ?? values
      if (field === 'fromCurrency') {
        return { ...current, fromCurrency: value, toCurrency: otherCurrency(value) }
      }
      if (field === 'toCurrency') {
        return { ...current, toCurrency: value, fromCurrency: otherCurrency(value) }
      }
      return { ...current, [field]: value }
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function swapCurrencies() {
    setForm((prev) => {
      const current = prev ?? values
      return { ...current, fromCurrency: current.toCurrency, toCurrency: current.fromCurrency }
    })
  }

  function validate() {
    const errs = {}
    if (!values.amount || !(Number(values.amount) > 0)) {
      errs.amount = t('validation.p2p.amountRequired')
    } else if (Number(values.amount) > p2pLimit(user, values.fromCurrency)) {
      errs.amount = t('validation.p2p.amountCeiling', {
        amount: formatMoney(p2pLimit(user, values.fromCurrency), values.fromCurrency),
      })
    }
    const margin = Number(values.rateMarginPercent)
    if (values.rateMarginPercent !== '' && values.rateMarginPercent != null && !Number.isFinite(margin)) {
      errs.rateMarginPercent = t('validation.p2p.marginInvalid')
    } else if (Number.isFinite(margin) && Math.abs(margin) > P2P_CONFIG.maxRateMarginPercent) {
      errs.rateMarginPercent = t('validation.p2p.marginRange', { max: P2P_CONFIG.maxRateMarginPercent })
    }
    if (!values.method.trim()) errs.method = t('validation.p2p.methodRequired')
    if (!validatePhone(values.receivePhone, methodCountry)) {
      errs.receivePhone = phoneError(methodCountry)
    }
    if (!String(values.receiveName || '').trim() || String(values.receiveName).trim().length < 2) {
      errs.receiveName = t('validation.p2p.receiveNameRequired')
    }
    if (values.comment.trim().length > 300) errs.comment = t('validation.p2p.commentMax')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (saving || !validate()) return
    setSaving(true)
    dispatch(
      updateOffer({
        id: offerId,
        ownerId: user.id,
        fromCurrency: values.fromCurrency,
        toCurrency: values.toCurrency,
        amount: Number(values.amount),
        rate: Number(rateFormatted || values.rate),
        rateMarginPercent: clampP2PRateMargin(values.rateMarginPercent),
        frankfurterRate: frankfurterRaw,
        rateSource: liveRate.source || offer.rateSource || 'Frankfurter',
        method: values.method,
        receivePhone: values.receivePhone.trim(),
        receiveName: values.receiveName.trim(),
        receiveCountry: methodCountry,
        comment: values.comment,
      }),
    )
    setSaving(false)
    dispatch(
      addToast({
        title: t('p2p.edit.toastTitle'),
        message: t('p2p.edit.toastMessage'),
        tone: 'success',
      }),
    )
    navigate(`/p2p/${offerId}`)
  }

  const amountNumber = Number(values.amount)
  const rateNumber = Number(rateFormatted || values.rate)
  const estimatedFee =
    amountNumber > 0 ? calculateP2PFee(amountNumber, values.fromCurrency, P2P_CONFIG.platformFeePercent) : 0
  const amountReceived = amountNumber > 0 && rateNumber > 0 ? amountNumber * rateNumber : 0
  const amountReceivedFormatted = amountReceived > 0 ? formatMoney(amountReceived, values.toCurrency) : null

  return (
    <div className="mx-auto grid max-w-2xl gap-7">
      <PageHeader
        eyebrow={t('p2p.edit.eyebrow')}
        title={t('p2p.edit.title')}
        description={t('p2p.edit.description')}
        actions={
          <Link to={`/p2p/${offerId}`}>
            <Button variant="secondary" icon={FiArrowLeft}>
              {t('common.cancel')}
            </Button>
          </Link>
        }
      />

      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
        <Card className="grid gap-5">
          <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
            <button
              type="button"
              onClick={swapCurrencies}
              aria-label={t('p2p.publish.swapCurrencies')}
              className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)] transition hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-950/40"
            >
              <FiRepeat className="text-base" />
            </button>
            <h2 className="font-black">{t('p2p.publish.currencyPair')}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <Select
              id="p2p-edit-from"
              label={t('p2p.publish.iOffer')}
              value={values.fromCurrency}
              onChange={(event) => set('fromCurrency', event.target.value)}
              error={errors.fromCurrency}
            >
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={swapCurrencies}
              aria-label={t('p2p.publish.swapCurrencies')}
              className="mx-auto mb-1 grid size-10 place-items-center rounded-full bg-brand-700 text-white transition hover:bg-brand-600 dark:bg-brand-600"
            >
              <FiRepeat className="text-sm" />
            </button>
            <Select
              id="p2p-edit-to"
              label={t('p2p.publish.iSeek')}
              value={values.toCurrency}
              onChange={(event) => set('toCurrency', event.target.value)}
              error={errors.toCurrency}
            >
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card className="grid gap-5">
          <h2 className="border-b border-[var(--app-border)] pb-4 font-black">
            {t('p2p.publish.amountAndRate')}
          </h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            {t('p2p.publish.currentCeiling', {
              amount: formatMoney(p2pLimit(user, values.fromCurrency), values.fromCurrency),
            })}
          </p>
          <Input
            id="p2p-edit-amount"
            label={t('p2p.publish.amountLabel', { currency: values.fromCurrency })}
            type="number"
            inputMode="decimal"
            value={values.amount}
            onChange={(event) => set('amount', event.target.value)}
            error={errors.amount}
          />
          <Input
            id="p2p-edit-rate"
            label={t('p2p.publish.rateLabel', { from: values.fromCurrency, to: values.toCurrency })}
            type="number"
            step="0.0001"
            inputMode="decimal"
            value={rateFormatted}
            readOnly
            disabled
          />
          <Input
            id="p2p-edit-margin"
            label={t('p2p.publish.rateMarginLabel', { max: P2P_CONFIG.maxRateMarginPercent })}
            type="number"
            step="0.1"
            inputMode="decimal"
            value={values.rateMarginPercent}
            onChange={(event) => set('rateMarginPercent', event.target.value)}
            error={errors.rateMarginPercent}
          />
          <p className="text-xs text-[var(--app-text-muted)]">{t('p2p.publish.rateMarginHint')}</p>
          {frankfurterFormatted ? (
            <div className="rounded-2xl bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text-muted)]">
              {t('p2p.publish.frankfurterRateHint', {
                rate: frankfurterFormatted,
                applied: rateFormatted || frankfurterFormatted,
                from: values.fromCurrency,
                to: values.toCurrency,
                source: liveRate.source || 'Frankfurter',
                date: liveRate.date || '—',
                margin: clampP2PRateMargin(values.rateMarginPercent),
              })}
            </div>
          ) : null}
          {amountReceivedFormatted ? (
            <div className="rounded-[var(--radius-card)] border border-brand-200/60 bg-brand-50/80 px-4 py-4 dark:border-brand-800/50 dark:bg-brand-950/30">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                {t('p2p.publish.receivedLabel')}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[var(--app-text)]">
                {amountReceivedFormatted}
              </p>
            </div>
          ) : null}
          <Alert variant="info">
            {t('p2p.publish.estimatedFees', {
              amount: formatMoney(estimatedFee, values.fromCurrency),
              percent: P2P_CONFIG.platformFeePercent,
            })}
          </Alert>
        </Card>

        <Card className="grid gap-5">
          <h2 className="border-b border-[var(--app-border)] pb-4 font-black">
            {t('p2p.publish.exchangeTerms')}
          </h2>
          <Select
            id="p2p-edit-method"
            label={
              methodIsRussia
                ? t('p2p.publish.methodRussia')
                : t('p2p.publish.methodAfrica', { country: originCountry })
            }
            value={values.method}
            onChange={(event) => set('method', event.target.value)}
            error={errors.method}
            disabled={methodsLoading && methodIsRussia}
          >
            <option value="">
              {methodsLoading ? t('p2p.publish.methodLoading') : t('p2p.publish.methodPlaceholder')}
            </option>
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          <Input
            id="p2p-edit-receive-phone"
            label={t('p2p.publish.receivePhone')}
            placeholder={phonePlaceholder(methodCountry)}
            value={values.receivePhone}
            onChange={(event) => set('receivePhone', ensurePhoneCountry(event.target.value, methodCountry))}
            error={errors.receivePhone}
          />
          <Input
            id="p2p-edit-receive-name"
            label={t('p2p.publish.receiveName')}
            placeholder={t('p2p.publish.receiveNamePlaceholder')}
            value={values.receiveName}
            onChange={(event) => set('receiveName', event.target.value)}
            error={errors.receiveName}
          />
          <Input
            id="p2p-edit-comment"
            label={t('p2p.publish.conditionsOptional')}
            placeholder={t('p2p.publish.conditionsPlaceholder')}
            value={values.comment}
            onChange={(event) => set('comment', event.target.value)}
            error={errors.comment}
          />
        </Card>

        <Button type="submit" icon={FiSave} loading={saving} disabled={saving}>
          {t('p2p.edit.saveChanges')}
        </Button>
      </form>
    </div>
  )
}
