import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiPhone,
  FiRepeat,
  FiUsers,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import {
  ensurePhoneCountry,
  phoneError,
  phonePlaceholder,
  validatePhone,
} from '../config/phone'
import { useLanguage } from '../contexts/useLanguage'
import { createOffer } from '../features/p2p/p2pSlice'
import {
  applyP2PRateMargin,
  calculateP2PFee,
  clampP2PRateMargin,
  formatP2PRate,
  frankfurterRateForPair,
  P2P_CONFIG,
  p2pLimit,
} from '../features/p2p/p2pUtils'
import {
  methodCountryForP2POffer,
  usePaymentMethodOptions,
} from '../features/p2p/usePaymentMethodOptions'
import { SecurityGatePanel } from '../features/security/SecurityGatePanel'
import { useSecurityGate } from '../features/security/useSecurityGate'
import {
  currencyForCountry,
  transferCurrenciesForCountry,
} from '../features/transfers/transferConfig'
import { useExchangeRate } from '../features/transfers/useExchangeRate'
import { formatMoney } from '../features/transfers/transferUtils'
import { addToast } from '../features/ui/uiSlice'
import { useScrollToTopOnStep } from '../hooks/useScrollToTopOnStep'

const STEP_DEFS = [
  { key: 'pair', labelKey: 'p2p.publish.steps.currencies', icon: FiRepeat },
  { key: 'amount', labelKey: 'p2p.publish.steps.amount', icon: FiDollarSign },
  { key: 'terms', labelKey: 'p2p.publish.steps.terms', icon: FiCheckCircle },
]

function Stepper({ step, onGoTo, t }) {
  return (
    <div className="relative flex items-start justify-between">
      <div className="absolute left-0 right-0 top-5 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-5 h-px bg-brand-600 transition-all duration-500"
        style={{ width: `${((step - 1) / (STEP_DEFS.length - 1)) * 100}%` }}
        aria-hidden
      />
      {STEP_DEFS.map((s, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        const Icon = s.icon
        return (
          <button
            key={s.key}
            type="button"
            disabled={n > step}
            onClick={() => n < step && onGoTo(n)}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <span
              className={`grid size-10 place-items-center rounded-full border-2 transition-all duration-300 ${
                done
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : active
                    ? 'border-brand-600 bg-white text-brand-700 shadow-lg shadow-brand-200 dark:bg-slate-900 dark:shadow-none'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]'
              }`}
            >
              {done ? <FiCheck className="text-sm" /> : <Icon className="text-sm" />}
            </span>
            <span
              className={`text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'}`}
            >
              {t(s.labelKey)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SectionTitle({ icon: Icon, label, onIconClick, iconAriaLabel }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
      {onIconClick ? (
        <button
          type="button"
          onClick={onIconClick}
          aria-label={iconAriaLabel || label}
          className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)] transition hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-950/40"
        >
          <Icon className="text-base" />
        </button>
      ) : (
        <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <Icon className="text-base" />
        </span>
      )}
      <h2 className="font-black">{label}</h2>
    </div>
  )
}

export function PublishP2PPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { requireP2PPublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const originCurrency = currencyForCountry(originCountry)
  const availableCurrencies = transferCurrenciesForCountry(originCountry)
  const otherCurrency = (currency) => (currency === 'RUB' ? originCurrency : 'RUB')

  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const [errors, setErrors] = useState({})
  const [publishing, setPublishing] = useState(false)
  const [form, setForm] = useState({
    fromCurrency: originCurrency,
    toCurrency: 'RUB',
    amount: '',
    rate: '',
    rateMarginPercent: '0',
    method: '',
    receivePhone: '',
    receiveName: '',
    comment: '',
  })
  const liveRate = useExchangeRate(originCurrency, { kind: 'p2p' })
  const methodCountry = methodCountryForP2POffer(form.fromCurrency, originCountry)
  const { options: methodOptions, loading: methodsLoading, isRussia: methodIsRussia } =
    usePaymentMethodOptions(methodCountry)

  useEffect(() => {
    if (!methodOptions.length) return
    setForm((prev) => {
      if (prev.method && methodOptions.includes(prev.method)) return prev
      return { ...prev, method: '' }
    })
  }, [methodOptions])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      receivePhone: ensurePhoneCountry(prev.receivePhone, methodCountry),
    }))
  }, [methodCountry])

  const frankfurterRaw = useMemo(
    () =>
      frankfurterRateForPair(
        liveRate,
        form.fromCurrency,
        form.toCurrency,
        originCurrency,
      ),
    [form.fromCurrency, form.toCurrency, liveRate, originCurrency],
  )
  const appliedRate = useMemo(
    () => applyP2PRateMargin(frankfurterRaw, form.rateMarginPercent),
    [frankfurterRaw, form.rateMarginPercent],
  )
  const rateFormatted = formatP2PRate(appliedRate)
  const frankfurterFormatted = formatP2PRate(frankfurterRaw)

  useEffect(() => {
    if (!rateFormatted) return
    setForm((prev) => (prev.rate === rateFormatted ? prev : { ...prev, rate: rateFormatted }))
  }, [rateFormatted])

  function set(field, value) {
    setForm((prev) => {
      if (field === 'fromCurrency') {
        return {
          ...prev,
          fromCurrency: value,
          toCurrency: otherCurrency(value),
        }
      }
      if (field === 'toCurrency') {
        return {
          ...prev,
          toCurrency: value,
          fromCurrency: otherCurrency(value),
        }
      }
      return { ...prev, [field]: value }
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function swapCurrencies() {
    setForm((prev) => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency,
    }))
    setErrors((prev) => ({ ...prev, fromCurrency: undefined, toCurrency: undefined }))
  }

  function validate(n) {
    const errs = {}
    if (n === 1) {
      if (!form.fromCurrency) errs.fromCurrency = t('validation.p2p.fromCurrencyRequired')
      if (!form.toCurrency) errs.toCurrency = t('validation.p2p.toCurrencyRequired')
      if (form.fromCurrency === form.toCurrency) {
        errs.toCurrency = t('validation.p2p.differentCurrency')
      }
      const pairOk =
        (form.fromCurrency === 'RUB' && form.toCurrency === originCurrency) ||
        (form.toCurrency === 'RUB' && form.fromCurrency === originCurrency)
      if (!pairOk) {
        errs.toCurrency = t('validation.p2p.originRubPair', {
          currency: originCurrency,
        })
      }
    }
    if (n === 2) {
      const amount = Number(form.amount)
      const rate = Number(form.rate)
      if (!form.amount || !(amount > 0)) errs.amount = t('validation.p2p.amountRequired')
      else if (amount > p2pLimit(user, form.fromCurrency)) {
        errs.amount = t('validation.p2p.amountCeiling', {
          amount: formatMoney(p2pLimit(user, form.fromCurrency), form.fromCurrency),
        })
      }
      if (!form.rate || !(rate > 0)) errs.rate = t('validation.p2p.rateRequired')
      const margin = Number(form.rateMarginPercent)
      if (form.rateMarginPercent !== '' && form.rateMarginPercent != null && !Number.isFinite(margin)) {
        errs.rateMarginPercent = t('validation.p2p.marginInvalid')
      } else if (Number.isFinite(margin) && Math.abs(margin) > P2P_CONFIG.maxRateMarginPercent) {
        errs.rateMarginPercent = t('validation.p2p.marginRange', {
          max: P2P_CONFIG.maxRateMarginPercent,
        })
      }
    }
    if (n === 3) {
      if (!form.method.trim()) errs.method = t('validation.p2p.methodRequired')
      if (!validatePhone(form.receivePhone, methodCountry)) {
        errs.receivePhone = phoneError(methodCountry)
      }
      if (!String(form.receiveName || '').trim() || String(form.receiveName).trim().length < 2) {
        errs.receiveName = t('validation.p2p.receiveNameRequired')
      }
      if (form.comment.trim().length > 300) errs.comment = t('validation.p2p.commentMax')
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(s + 1, STEP_DEFS.length))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1))
  }

  function publish() {
    if (!requireP2PPublish()) return
    if (!validate(1)) {
      setStep(1)
      return
    }
    if (!validate(2)) {
      setStep(2)
      return
    }
    if (!validate(3)) {
      setStep(3)
      return
    }
    setPublishing(true)
    const action = dispatch(
      createOffer({
        ...form,
        receivePhone: form.receivePhone.trim(),
        receiveName: form.receiveName.trim(),
        receiveCountry: methodCountry,
        rate: Number(form.rate),
        rateMarginPercent: clampP2PRateMargin(form.rateMarginPercent),
        frankfurterRate: frankfurterRaw,
        rateSource: liveRate.source || 'Frankfurter',
        feePercent: P2P_CONFIG.platformFeePercent,
        ownerId: user.id,
        ownerName: business?.name || `${user.firstName} ${user.lastName}`,
        businessId: business?.id || null,
      }),
    )
    setPublishing(false)
    dispatch(
      addToast({
        title: t('p2p.publish.toastTitle'),
        message: t('p2p.publish.toastMessage'),
        tone: 'success',
      }),
    )
    navigate(action.payload?.id ? `/p2p/${action.payload.id}` : '/p2p')
  }

  const amountNumber = Number(form.amount)
  const rateNumber = Number(form.rate)
  const estimatedFee =
    amountNumber > 0
      ? calculateP2PFee(amountNumber, form.fromCurrency, P2P_CONFIG.platformFeePercent)
      : 0
  const amountReceived =
    amountNumber > 0 && rateNumber > 0 ? amountNumber * rateNumber : 0
  const amountReceivedFormatted =
    amountReceived > 0 ? formatMoney(amountReceived, form.toCurrency) : null

  return (
    <SecurityGatePanel kind="p2p" backTo="/p2p">
      <div className="mx-auto grid max-w-2xl gap-7">
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/p2p')}>
            {t('p2p.publish.backLabel')}
          </Button>
          <h1 className="text-xl font-black">{t('p2p.publish.title')}</h1>
        </div>

        <Card className="px-6 py-5">
          <Stepper step={step} onGoTo={setStep} t={t} />
        </Card>

        {step === 1 ? (
          <div className="grid gap-5">
            <Card className="grid gap-5">
              <SectionTitle
                icon={FiRepeat}
                label={t('p2p.publish.currencyPair')}
                onIconClick={swapCurrencies}
                iconAriaLabel={t('p2p.publish.swapCurrencies')}
              />
              <p className="text-sm text-[var(--app-text-muted)]">
                {t('p2p.publish.currencyLimit', {
                  currencies: availableCurrencies.join(', '),
                  origin: originCurrency,
                })}
              </p>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <Select
                  id="p2p-publish-from"
                  label={t('p2p.publish.iOffer')}
                  value={form.fromCurrency}
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
                  id="p2p-publish-to"
                  label={t('p2p.publish.iSeek')}
                  value={form.toCurrency}
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
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-xs font-black uppercase tracking-wide">
                    {form.fromCurrency}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={swapCurrencies}
                  aria-label={t('p2p.publish.swapCurrencies')}
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-white transition hover:bg-brand-600 dark:bg-brand-600"
                >
                  <FiArrowRight className="text-xs" />
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-xs font-black uppercase tracking-wide">
                    {form.toCurrency}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5">
            <Card className="grid gap-5">
              <SectionTitle icon={FiDollarSign} label={t('p2p.publish.amountAndRate')} />
              <p className="text-sm text-[var(--app-text-muted)]">
                {t('p2p.publish.currentCeiling', {
                  amount: formatMoney(p2pLimit(user, form.fromCurrency), form.fromCurrency),
                })}
              </p>
              <Input
                id="p2p-publish-amount"
                label={t('p2p.publish.amountLabel', { currency: form.fromCurrency })}
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => set('amount', event.target.value)}
                error={errors.amount}
              />
              <Input
                id="p2p-publish-rate"
                label={t('p2p.publish.rateLabel', {
                  from: form.fromCurrency,
                  to: form.toCurrency,
                })}
                type="number"
                step="0.0001"
                inputMode="decimal"
                value={form.rate}
                readOnly
                disabled
                error={errors.rate}
              />
              <Input
                id="p2p-publish-margin"
                label={t('p2p.publish.rateMarginLabel', {
                  max: P2P_CONFIG.maxRateMarginPercent,
                })}
                type="number"
                step="0.1"
                inputMode="decimal"
                value={form.rateMarginPercent}
                onChange={(event) => set('rateMarginPercent', event.target.value)}
                error={errors.rateMarginPercent}
              />
              <p className="text-xs text-[var(--app-text-muted)]">
                {t('p2p.publish.rateMarginHint')}
              </p>
              {frankfurterFormatted ? (
                <div className="rounded-2xl bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text-muted)]">
                  {t('p2p.publish.frankfurterRateHint', {
                    rate: frankfurterFormatted,
                    applied: rateFormatted || frankfurterFormatted,
                    from: form.fromCurrency,
                    to: form.toCurrency,
                    source: liveRate.source || 'Frankfurter',
                    date: liveRate.date || '—',
                    margin: clampP2PRateMargin(form.rateMarginPercent),
                  })}
                </div>
              ) : liveRate.loading ? (
                <p className="text-sm text-[var(--app-text-muted)]">
                  {t('p2p.publish.frankfurterRateLoading')}
                </p>
              ) : null}
              {amountReceivedFormatted ? (
                <div className="rounded-[var(--radius-card)] border border-brand-200/60 bg-brand-50/80 px-4 py-4 dark:border-brand-800/50 dark:bg-brand-950/30">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                    {t('p2p.publish.receivedLabel')}
                  </p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-[var(--app-text)]">
                    {amountReceivedFormatted}
                  </p>
                  <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                    {t('p2p.publish.receivedHint', {
                      amount: formatMoney(amountNumber, form.fromCurrency),
                      rate: rateFormatted || form.rate,
                      from: form.fromCurrency,
                      to: form.toCurrency,
                    })}
                  </p>
                </div>
              ) : null}
              <Alert variant="info">
                {t('p2p.publish.estimatedFees', {
                  amount: formatMoney(estimatedFee, form.fromCurrency),
                  percent: P2P_CONFIG.platformFeePercent,
                })}
              </Alert>
            </Card>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-5">
            <Card className="grid gap-5">
              <SectionTitle icon={FiUsers} label={t('p2p.publish.exchangeTerms')} />
              <Select
                id="p2p-publish-method"
                label={
                  methodIsRussia
                    ? t('p2p.publish.methodRussia')
                    : t('p2p.publish.methodAfrica', { country: originCountry })
                }
                value={form.method}
                onChange={(event) => set('method', event.target.value)}
                error={errors.method}
                disabled={methodsLoading && methodIsRussia}
              >
                <option value="">
                  {methodsLoading
                    ? t('p2p.publish.methodLoading')
                    : t('p2p.publish.methodPlaceholder')}
                </option>
                {methodOptions.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </Card>
            <Card className="grid gap-5">
              <SectionTitle icon={FiPhone} label={t('p2p.publish.receiveSection')} />
              <p className="text-sm text-[var(--app-text-muted)]">
                {methodIsRussia
                  ? t('p2p.publish.receiveHintRussia')
                  : t('p2p.publish.receiveHintAfrica', { country: methodCountry })}
              </p>
              <Input
                id="p2p-publish-receive-phone"
                label={t('p2p.publish.receivePhone')}
                placeholder={phonePlaceholder(methodCountry)}
                value={form.receivePhone}
                onChange={(event) =>
                  set('receivePhone', ensurePhoneCountry(event.target.value, methodCountry))
                }
                onFocus={() => {
                  if (!String(form.receivePhone || '').replace(/\D/g, '').slice(1)) {
                    set('receivePhone', ensurePhoneCountry('', methodCountry))
                  }
                }}
                error={errors.receivePhone}
              />
              <Input
                id="p2p-publish-receive-name"
                label={t('p2p.publish.receiveName')}
                placeholder={t('p2p.publish.receiveNamePlaceholder')}
                value={form.receiveName}
                onChange={(event) => set('receiveName', event.target.value)}
                error={errors.receiveName}
              />
              <Input
                id="p2p-publish-comment"
                label={t('p2p.publish.conditionsOptional')}
                placeholder={t('p2p.publish.conditionsPlaceholder')}
                value={form.comment}
                onChange={(event) => set('comment', event.target.value)}
                error={errors.comment}
              />
            </Card>
            <Card className="grid gap-4">
              <SectionTitle icon={FiCheckCircle} label={t('p2p.publish.recap')} />
              {[
                [t('p2p.publish.iOffer'), `${form.amount || '—'} ${form.fromCurrency}`],
                [t('p2p.publish.iSeek'), form.toCurrency],
                [
                  t('p2p.publish.receivedLabel'),
                  amountReceivedFormatted || '—',
                ],
                [t('p2p.publish.rate'), form.rate || '—'],
                [
                  t('p2p.publish.rateMarginRecap'),
                  `${clampP2PRateMargin(form.rateMarginPercent)} %`,
                ],
                [t('p2p.publish.rateSource'), liveRate.source || 'Frankfurter'],
                [t('p2p.publish.method'), form.method || '—'],
                [t('p2p.publish.receivePhone'), form.receivePhone || '—'],
                [t('p2p.publish.receiveName'), form.receiveName || '—'],
                [
                  t('p2p.publish.estimatedFeesLabel'),
                  formatMoney(estimatedFee, form.fromCurrency),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] px-4 py-3"
                >
                  <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
                  <span className="text-right text-sm font-bold">{value}</span>
                </div>
              ))}
              {form.comment.trim() ? (
                <p className="text-sm text-[var(--app-text-muted)]">{form.comment}</p>
              ) : null}
            </Card>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="secondary" icon={FiArrowLeft} onClick={back}>
              {t('common.back')}
            </Button>
          ) : (
            <span />
          )}
          {step < STEP_DEFS.length ? (
            <Button icon={FiArrowRight} onClick={next}>
              {t('common.continue')}
            </Button>
          ) : (
            <Button
              icon={FiCheckCircle}
              onClick={publish}
              loading={publishing}
              disabled={publishing}
            >
              {t('p2p.publish.publishOffer')}
            </Button>
          )}
        </div>
      </div>
    </SecurityGatePanel>
  )
}
