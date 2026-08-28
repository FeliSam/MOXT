import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiRepeat, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { ensurePhoneCountry, phoneError, phonePlaceholder, validatePhone } from '../config/phone'
import { useLanguage } from '../contexts/useLanguage'
import { updateOffer } from '../features/p2p/p2pSlice'
import {
  applyP2PRateMargin,
  calculateP2PFee,
  clampP2PRateMargin,
  convertP2PAmountOnPairFlip,
  formatP2PRate,
  frankfurterRateForPair,
  P2P_CONFIG,
  p2pLimit,
  p2pOfferedFromReceived,
  p2pReceivedFromOffered,
} from '../features/p2p/p2pUtils'
import {
  exchangeMethodCountryForP2POffer,
  usePaymentMethodOptions,
} from '../features/p2p/usePaymentMethodOptions'
import { currencyForCountry, transferCurrenciesForCountry } from '../features/transfers/transferConfig'
import { countryLabel } from '../features/transfers/transferAccountUtils'
import { TransferAmountDualFields } from '../features/transfers/TransferAmountDualFields'
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
  const [amountAnchor, setAmountAnchor] = useState('offer')
  const [receiveInput, setReceiveInput] = useState('')

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
  const exchangeCountry = exchangeMethodCountryForP2POffer(values.toCurrency, originCountry)
  const receiveCountry = exchangeCountry
  const exchangeIsRussia = exchangeCountry === 'RU'
  const { options: methodOptions, loading: methodsLoading } = usePaymentMethodOptions(exchangeCountry)

  useEffect(() => {
    if (!methodOptions.length) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réseau selon devise recherchée / pays
    setForm((prev) => {
      if (!prev) return prev
      const nextMethod =
        prev.method && methodOptions.includes(prev.method) ? prev.method : ''
      if (nextMethod === prev.method) return prev
      return { ...prev, method: nextMethod }
    })
  }, [methodOptions, exchangeCountry])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- préfixe selon la devise reçue (toCurrency)
    setForm((prev) => {
      if (!prev) return prev
      const nextPhone = ensurePhoneCountry(prev.receivePhone, receiveCountry)
      if (nextPhone === prev.receivePhone) return prev
      return { ...prev, receivePhone: nextPhone }
    })
  }, [receiveCountry])

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
  const rateNumber = Number(appliedRate) > 0 ? Number(appliedRate) : Number(values.rate)
  const displayedOffer =
    amountAnchor === 'receive'
      ? p2pOfferedFromReceived(receiveInput, rateNumber) || values.amount
      : values.amount
  const displayedReceive =
    amountAnchor === 'receive'
      ? receiveInput
      : p2pReceivedFromOffered(values.amount, rateNumber)

  if (!offer) return <Card>{t('p2p.edit.notFound')}</Card>
  if (offer.ownerId !== user.id) return <Navigate to={`/p2p/${offerId}`} replace />
  if (!['active', 'archived'].includes(offer.status)) {
    return <Navigate to={`/p2p/${offerId}`} replace />
  }

  function applyPairChange(current, nextFrom, nextTo) {
    if (nextFrom === current.fromCurrency && nextTo === current.toCurrency) return current
    const isFlip = nextFrom === current.toCurrency && nextTo === current.fromCurrency
    return {
      ...current,
      fromCurrency: nextFrom,
      toCurrency: nextTo,
      amount: isFlip ? convertP2PAmountOnPairFlip(current.amount, current.rate || rateFormatted) : current.amount,
    }
  }

  function set(field, value) {
    if (field === 'fromCurrency' || field === 'toCurrency') {
      setAmountAnchor('offer')
    }
    setForm((prev) => {
      const current = prev ?? values
      if (field === 'fromCurrency') {
        return applyPairChange(current, value, otherCurrency(value))
      }
      if (field === 'toCurrency') {
        return applyPairChange(current, otherCurrency(value), value)
      }
      return { ...current, [field]: value }
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function swapCurrencies() {
    setAmountAnchor('offer')
    setForm((prev) => {
      const current = prev ?? values
      return applyPairChange(current, current.toCurrency, current.fromCurrency)
    })
  }

  function handleOfferAmountChange(value) {
    setAmountAnchor('offer')
    set('amount', value)
  }

  function handleReceiveAmountChange(value) {
    setAmountAnchor('receive')
    setReceiveInput(value)
    const offered = p2pOfferedFromReceived(value, rateNumber)
    if (offered) set('amount', offered)
  }

  function validate() {
    const errs = {}
    if (!displayedOffer || !(Number(displayedOffer) > 0)) {
      errs.amount = t('validation.p2p.amountRequired')
    } else if (Number(displayedOffer) > p2pLimit(user, values.fromCurrency)) {
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
    if (!validatePhone(values.receivePhone, receiveCountry)) {
      errs.receivePhone = phoneError(receiveCountry)
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
        amount: Number(displayedOffer),
        rate: Number(rateFormatted || values.rate),
        rateMarginPercent: clampP2PRateMargin(values.rateMarginPercent),
        frankfurterRate: frankfurterRaw,
        rateSource: liveRate.source || offer.rateSource || 'Frankfurter',
        method: values.method,
        receivePhone: values.receivePhone.trim(),
        receiveName: values.receiveName.trim(),
        receiveCountry,
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

  const amountNumber = Number(displayedOffer)
  const estimatedFee =
    amountNumber > 0 ? calculateP2PFee(amountNumber, values.fromCurrency, P2P_CONFIG.platformFeePercent) : 0

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
          <TransferAmountDualFields
            sendId="p2p-edit-amount"
            receiveId="p2p-edit-amount-receive"
            sendLabel={t('p2p.publish.amountLabel', { currency: values.fromCurrency })}
            receiveLabel={t('p2p.publish.amountReceiveLabel', { currency: values.toCurrency })}
            currencyFrom={values.fromCurrency}
            currencyTo={values.toCurrency}
            sendValue={displayedOffer}
            receiveValue={displayedReceive}
            onSendChange={handleOfferAmountChange}
            onReceiveChange={handleReceiveAmountChange}
            sendError={errors.amount}
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
              exchangeIsRussia
                ? t('p2p.publish.methodRussia')
                : t('p2p.publish.methodAfrica', { country: countryLabel(exchangeCountry) })
            }
            value={values.method}
            onChange={(event) => set('method', event.target.value)}
            error={errors.method}
            disabled={methodsLoading && exchangeIsRussia}
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
          <p className="text-sm text-[var(--app-text-muted)]">
            {exchangeIsRussia
              ? t('p2p.publish.receiveHintRussia')
              : t('p2p.publish.receiveHintAfrica', { country: countryLabel(receiveCountry) })}
          </p>
          <Input
            id="p2p-edit-receive-phone"
            label={t('p2p.publish.receivePhone')}
            placeholder={phonePlaceholder(receiveCountry)}
            value={values.receivePhone}
            onChange={(event) =>
              set('receivePhone', ensurePhoneCountry(event.target.value, receiveCountry))
            }
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
          <Textarea
            id="p2p-edit-comment"
            label={t('p2p.publish.conditionsOptional')}
            placeholder={t('p2p.publish.conditionsPlaceholder')}
            value={values.comment}
            onChange={(event) => set('comment', event.target.value)}
            error={errors.comment}
            rows={4}
          />
        </Card>

        <Button type="submit" icon={FiSave} loading={saving} disabled={saving}>
          {t('p2p.edit.saveChanges')}
        </Button>
      </form>
    </div>
  )
}
