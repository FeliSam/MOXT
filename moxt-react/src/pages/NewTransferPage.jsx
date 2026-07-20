import { useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiExternalLink,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiSliders,
  FiStar,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { VerifiedDisplayName } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { ScrollSectionAnchor } from '../components/ui/ScrollSectionAnchor'
import { Select } from '../components/ui/Select'
import { flagColor, flagEmoji } from '../config/flags'
import { ensurePhoneCountry, phoneError, phonePlaceholder, phonePrefix, validatePhone } from '../config/phone'
import { saveTransferProfile } from '../features/account/accountSlice'
import { isBusinessPublishReady } from '../features/businesses/businessPublishUtils'
import { isBusinessOwnedBy, selectActiveBusinessForOwner } from '../features/businesses/businessVisibility'
import {
  currencyForCountry,
  DIRECTIONS,
  paymentMethodsForCountry,
} from '../features/transfers/transferConfig'
import { createTransferSchemas } from '../features/transfers/transferSchemas'
import { createTransfer } from '../features/transfers/transferSlice'
import { TransferCalculator } from '../features/transfers/TransferCalculator'
import { TransferReceivingAccountCard } from '../features/transfers/TransferReceivingAccountCard'
import {
  buildExchangerPaymentView,
  resolveBusinessReceivingAccount,
} from '../features/transfers/transferAccountUtils'
import { ExchangerPickerAvatar } from '../features/transfers/ExchangerPickerAvatar'
import { listExchangersForTransfer, resolveUserPartnerCountry } from '../features/transfers/exchangerListUtils'
import { useExchangeRate } from '../features/transfers/useExchangeRate'
import { useLanguage } from '../contexts/useLanguage'
import { useScrollToSecondSection } from '../hooks/useScrollToSecondSection'
import {
  calculateTransfer,
  directionInfo,
  formatMoney,
  monthlyTransferTotal,
  validateTransferAmount,
} from '../features/transfers/transferUtils'

import { TransferWizardSectionTitle as SectionTitle } from '../features/transfers/wizard/TransferWizardSectionTitle'
import { TransferWizardStepper as Stepper } from '../features/transfers/wizard/TransferWizardStepper'
import {
  clearTransferDraft,
  readTransferDraft,
  writeTransferDraft,
} from '../features/transfers/wizard/transferWizardConfig'
export function NewTransferPage() {
  const { t } = useLanguage()
  useScrollToSecondSection()
  const [step, setStep] = useState(1)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) => state.businesses.items)
  const ownTransferBusiness = useMemo(() => {
    const own = selectActiveBusinessForOwner(businesses, user.id)
    return own?.services?.includes('Transfert') ? own : null
  }, [businesses, user.id])
  const transfers = useSelector((state) => state.transfers.items)
  const transferProfiles = useSelector((state) =>
    (state.account.transferProfiles || []).filter((item) => item.userId === user.id),
  )
  const draft = useMemo(() => readTransferDraft(), [])
  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const liveRate = useExchangeRate(currencyForCountry(originCountry))
  const initialDirection = user.country === 'RU' ? DIRECTIONS.RU_TO_BJ : DIRECTIONS.BJ_TO_RU
  const initialInfo = directionInfo(initialDirection, originCountry)
  const formik = useFormik({
    initialValues: {
      direction: initialDirection,
      sourceCountry: initialInfo.sourceCountry,
      destinationCountry: initialInfo.destinationCountry,
      amount: '',
      exchangerId: searchParams.get('exchangerId') || '',
      senderFirstName: user.firstName || '',
      senderLastName: user.lastName || '',
      senderPhone: ensurePhoneCountry(user.phone, initialInfo.sourceCountry),
      senderMethod: '',
      recipientFirstName: '',
      recipientLastName: '',
      recipientPhone: ensurePhoneCountry('', initialInfo.destinationCountry),
      recipientMethod: '',
      acceptTerms: false,
      ...(draft?.userId === user.id ? draft.values : {}),
    },
    validationSchema: createTransferSchemas(t).transferSchema,
    onSubmit: (values) => {
      const exchanger = exchangers.find((item) => item.id === values.exchangerId)
      const business = businesses.find((item) => item.id === values.exchangerId)
      if (!exchanger || !business) {
        formik.setFieldError('exchangerId', t('transfers.new.errors.chooseAvailableBusiness'))
        return
      }
      if (exchanger && isBusinessOwnedBy(business, user.id)) {
        formik.setFieldError('exchangerId', t('transfers.new.errors.cannotUseOwnBusiness'))
        return
      }
      const paymentView = buildExchangerPaymentView(business, values.direction, originCountry)
      if (!paymentView.paymentDetails) {
        formik.setFieldError(
          'exchangerId',
          t('transfers.new.errors.businessMissingReceivingAccount'),
        )
        return
      }
      const transferInfo = directionInfo(values.direction)
      const amountError = validateTransferAmount(
        values.amount,
        values.direction,
        user.verified,
        monthlyTransferTotal(transfers, user.id, transferInfo.from),
        originCountry,
        t,
      )
      if (amountError) {
        formik.setFieldError('amount', amountError)
        return
      }
      const action = dispatch(
        createTransfer({
          amount: values.amount,
          direction: values.direction,
          originCountry,
          user,
          exchanger: {
            ...exchanger,
            paymentAccount: paymentView.paymentAccount,
            paymentDetails: paymentView.paymentDetails,
          },
          rateOverride:
            values.direction === DIRECTIONS.BJ_TO_RU ? liveRate.originToRub : liveRate.rubToOrigin,
          rateSource: liveRate.source,
          rateDate: liveRate.date,
          sender: {
            firstName: values.senderFirstName,
            lastName: values.senderLastName,
            phone: values.senderPhone,
            method: values.senderMethod,
          },
          recipient: {
            firstName: values.recipientFirstName,
            lastName: values.recipientLastName,
            phone: values.recipientPhone,
            method: values.recipientMethod,
          },
        }),
      )
      clearTransferDraft()
      navigate(`/transfers/${action.payload.id}`, { state: { transferView: 'client' } })
    },
  })

  const transferDirection = formik.values.direction
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- direction extracted; list depends on businesses/user/country
  const exchangers = useMemo(
    () =>
      listExchangersForTransfer({
        businesses,
        user,
        originCountry,
        direction: transferDirection,
        excludeOwnerId: user.id,
      }),
    [businesses, user, originCountry, transferDirection],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      writeTransferDraft(user.id, step, formik.values)
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [formik.values, step, user.id])

  useEffect(() => {
    if (!formik.values.exchangerId) return
    const stillVisible = exchangers.some((item) => item.id === formik.values.exchangerId)
    if (!stillVisible) {
      formik.setFieldValue('exchangerId', '')
    }
  }, [exchangers, formik, formik.values.exchangerId])

  useEffect(() => {
    if (!formik.values.exchangerId) return
    const selectedBusiness = businesses.find((item) => item.id === formik.values.exchangerId)
    if (selectedBusiness && isBusinessOwnedBy(selectedBusiness, user.id)) {
      formik.setFieldValue('exchangerId', '')
    }
  }, [businesses, formik, formik.values.exchangerId, user.id])

  const selectedExchanger = exchangers.find((item) => item.id === formik.values.exchangerId)
  const selectedExchangerBusiness = businesses.find((item) => item.id === formik.values.exchangerId)
  const selectedReceivingAccount = useMemo(() => {
    if (!selectedExchangerBusiness) return null
    return resolveBusinessReceivingAccount(
      selectedExchangerBusiness.transferAccounts,
      formik.values.direction,
      originCountry,
    )
  }, [selectedExchangerBusiness, formik.values.direction, originCountry])
  const calculation = calculateTransfer(
    formik.values.amount,
    formik.values.direction,
    selectedExchanger?.feePercent,
    formik.values.direction === DIRECTIONS.BJ_TO_RU ? liveRate.originToRub : liveRate.rubToOrigin,
    originCountry,
  )
  const info = directionInfo(formik.values.direction, originCountry)
  const usedThisMonth = monthlyTransferTotal(transfers, user.id, info.from)
  const senderProfiles = transferProfiles.filter((item) => item.country === info.sourceCountry)
  const recipientProfiles = transferProfiles.filter(
    (item) => item.country === info.destinationCountry,
  )
  const sourceMethods = paymentMethodsForCountry(info.sourceCountry)
  const destinationMethods = paymentMethodsForCountry(info.destinationCountry)
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)
  const stepFields = {
    1: ['direction', 'amount', 'exchangerId'],
    2: ['senderFirstName', 'senderLastName', 'senderPhone', 'senderMethod'],
    3: ['recipientFirstName', 'recipientLastName', 'recipientPhone', 'recipientMethod'],
    4: ['acceptTerms'],
  }

  async function nextStep() {
    const fields = stepFields[step] || []
    const errors = await formik.validateForm()
    if (step === 1) {
      const amountError = validateTransferAmount(
        formik.values.amount,
        formik.values.direction,
        user.verified,
        usedThisMonth,
        originCountry,
        t,
      )
      if (amountError) errors.amount = amountError
      formik.setFieldError('amount', amountError || undefined)

      const selectedBusiness = businesses.find((item) => item.id === formik.values.exchangerId)
      if (selectedBusiness && isBusinessOwnedBy(selectedBusiness, user.id)) {
        errors.exchangerId = t('transfers.new.errors.ownBusinessReceivesOnly')
        formik.setFieldError('exchangerId', errors.exchangerId)
      }
    }
    formik.setTouched(
      fields.reduce((touched, field) => ({ ...touched, [field]: true }), formik.touched),
    )
    if (fields.some((field) => errors[field])) return
    setStep((current) => Math.min(4, current + 1))
  }

  function applyProfile(prefix, profile) {
    formik.setFieldValue(`${prefix}FirstName`, profile.firstName)
    formik.setFieldValue(`${prefix}LastName`, profile.lastName)
    formik.setFieldValue(`${prefix}Phone`, profile.phone)
    formik.setFieldValue(`${prefix}Method`, profile.method)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={t('transfers.new.eyebrow')}
        title={t('transfers.new.title')}
        description={t('transfers.new.description')}
        actions={
          <>
            <Button variant="secondary" icon={FiSliders} onClick={() => setCalculatorOpen(true)}>
              {t('transfers.new.calculator')}
            </Button>
            <Link to="/exchangers">
              <Button variant="secondary" icon={FiRefreshCw}>
                {t('transfers.new.exchangers')}
              </Button>
            </Link>
            <Link to="/transfers/history">
              <Button variant="secondary" icon={FiArrowLeft}>
                {t('transfers.history.sectionTitle')}
              </Button>
            </Link>
          </>
        }
      />
      {ownTransferBusiness ? (
        <Alert
          variant={isBusinessPublishReady(ownTransferBusiness) ? 'info' : 'warning'}
          title={
            isBusinessPublishReady(ownTransferBusiness)
              ? t('transfers.new.ownBusinessActiveTitle')
              : t('transfers.new.ownBusinessPendingTitle')
          }
        >
          {isBusinessPublishReady(ownTransferBusiness) ? (
            t('transfers.new.ownBusinessActiveBody', { name: ownTransferBusiness.name })
          ) : (
            t('transfers.new.ownBusinessPendingBody', { name: ownTransferBusiness.name })
          )}
        </Alert>
      ) : null}
      <ScrollSectionAnchor as={Card} className="scroll-mt-24 overflow-hidden px-3 py-4 sm:px-6 sm:py-5 lg:scroll-mt-28">
        <Stepper step={step} onGoTo={setStep} />
      </ScrollSectionAnchor>

      <form className="grid gap-5" onSubmit={formik.handleSubmit} noValidate>
        {step === 1 ? (
          <div className="grid gap-5">
            {/* Direction — 2 visual cards */}
            <Card className="grid gap-5">
              <SectionTitle icon={FiZap} label={t('transfers.new.directionTitle')} />
              <div className="grid gap-3 sm:grid-cols-2">
                {[DIRECTIONS.BJ_TO_RU, DIRECTIONS.RU_TO_BJ].map((dir) => {
                  // Chaque carte calcule ses propres pays/devises a partir de
                  // SA direction (dir), jamais de la direction active
                  // (formik.values.direction) : sinon les deux cartes
                  // affichent le meme contenu des que l'utilisateur change de sens.
                  const cardInfo = directionInfo(dir, originCountry)
                  const fromFlag = flagEmoji(cardInfo.sourceCountry)
                  const toFlag = flagEmoji(cardInfo.destinationCountry)
                  const accent = flagColor(cardInfo.destinationCountry)
                  const active = formik.values.direction === dir
                  return (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => {
                        formik.setFieldValue("direction", dir)
                        formik.setFieldValue("sourceCountry", cardInfo.sourceCountry)
                        formik.setFieldValue("destinationCountry", cardInfo.destinationCountry)
                        formik.setFieldValue("senderPhone", phonePrefix(cardInfo.sourceCountry))
                        formik.setFieldValue("recipientPhone", phonePrefix(cardInfo.destinationCountry))
                        formik.setFieldValue("senderMethod", "")
                        formik.setFieldValue("recipientMethod", "")
                      }}
                      style={active ? { borderColor: accent } : undefined}
                      className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-br from-brand-50 to-cyan-50 shadow-md dark:from-brand-950/40 dark:to-cyan-950/40'
                          : 'border-[var(--app-border)] hover:border-brand-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-lg font-black">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-xl leading-none">{fromFlag}</span>
                          {cardInfo.from}
                        </span>
                        <FiArrowRight className={`shrink-0 ${active ? 'text-brand-600' : 'text-[var(--app-text-muted)]'}`} />
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-xl leading-none">{toFlag}</span>
                          {cardInfo.to}
                        </span>
                      </div>
                      <p className={`mt-1 text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'}`}>
                        {dir === DIRECTIONS.BJ_TO_RU ? t('transfers.direction.africaToRu') : t('transfers.direction.ruToAfrica')}
                      </p>
                      {active ? (
                        <span
                          className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                          style={{ backgroundColor: accent }}
                        >
                          <FiCheck className="text-[10px]" /> {t('transfers.new.selected')}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Amount */}
            <Card className="grid gap-5">
              <SectionTitle icon={FiSend} label={t('transfers.new.amountToSend', { currency: calculation.currencyFrom })} />
              <Input
                id="amount"
                label={t('transfers.new.amountIn', { currency: calculation.currencyFrom })}
                type="number"
                min={calculation.minimumRequired}
                placeholder={t('transfers.new.amountMinPlaceholder', { amount: formatMoney(calculation.minimumRequired, calculation.currencyFrom) })}
                {...formik.getFieldProps('amount')}
                error={errorFor('amount')}
              />
              <div className="flex items-start gap-3 rounded-2xl bg-[var(--app-accent-soft)] p-4 text-sm">
                <FiClock className="mt-0.5 shrink-0 text-[var(--app-accent)]" />
                <p className="text-[var(--app-text-muted)]">
                  {t('transfers.new.minimumLabel')}: <strong>{formatMoney(calculation.minimumRequired, calculation.currencyFrom)}</strong>.
                  {!user.verified
                    ? ` ${t('transfers.new.usedThisMonth', { amount: formatMoney(usedThisMonth, calculation.currencyFrom) })}`
                    : ` ${t('transfers.new.verifiedCeiling')}`}
                </p>
              </div>
            </Card>

            {/* Exchanger cards */}
            <Card className="grid gap-4">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                    <FiStar className="text-base" />
                  </span>
                  <h2 className="font-black">{t('transfers.new.choosePartner')}</h2>
                </div>
                <Link to="/exchangers" className="shrink-0">
                  <Button variant="ghost" size="sm" icon={FiExternalLink}>
                    {t('transfers.new.allExchangers')}
                  </Button>
                </Link>
              </div>
              {errorFor('exchangerId') ? (
                <p className="text-xs text-red-600">{errorFor('exchangerId')}</p>
              ) : null}
              {!exchangers.length ? (
                <Alert variant="warning" title={t('transfers.new.noPartnerTitle')}>
                  {t('transfers.new.noPartnerBody', { flag: flagEmoji(resolveUserPartnerCountry(user, originCountry)) })}
                </Alert>
              ) : null}
              <div className="w-full min-w-0 max-w-full overflow-x-auto xl:overflow-visible">
                <div className="flex w-max gap-3 xl:grid xl:w-full xl:grid-cols-4 xl:gap-3">
                  {ownTransferBusiness && isBusinessPublishReady(ownTransferBusiness) ? (
                    <div
                      aria-disabled="true"
                      title={t('transfers.new.ownBusinessReceivesTooltip')}
                      className="flex w-[9.25rem] shrink-0 cursor-not-allowed flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-[var(--app-surface-muted)] p-4 text-center opacity-80 sm:w-[10.5rem] xl:w-auto xl:shrink"
                    >
                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-base font-black text-brand-800 dark:bg-brand-950/50 dark:text-brand-200">
                        {ownTransferBusiness.logoUrl ? (
                          <img
                            src={ownTransferBusiness.logoUrl}
                            alt=""
                            className="size-12 rounded-2xl object-cover"
                            loading="lazy"
                          />
                        ) : (
                          ownTransferBusiness.name[0]
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs font-black leading-tight">{ownTransferBusiness.name}</p>
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800 dark:bg-brand-950/50 dark:text-brand-200">
                        {t('transfers.new.yourBusiness')}
                      </span>
                      <p className="text-[10px] leading-4 text-[var(--app-text-muted)]">
                        {t('transfers.new.receptionOnly')} ·{' '}
                        <Link to="/professional" className="font-bold text-brand-700 underline">
                          {t('transfers.new.proSpace')}
                        </Link>
                      </p>
                    </div>
                  ) : null}
                  {exchangers.map((exchanger) => {
                    const active = formik.values.exchangerId === exchanger.id
                    return (
                      <button
                        key={exchanger.id}
                        type="button"
                        onClick={() => formik.setFieldValue('exchangerId', exchanger.id)}
                        className={`flex w-[9.25rem] shrink-0 flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 sm:w-[10.5rem] xl:w-auto xl:shrink ${
                          active
                            ? 'border-brand-500 bg-[var(--app-accent-soft)] shadow-md'
                            : 'border-[var(--app-border)] hover:border-brand-400 hover:shadow-sm'
                        }`}
                      >
                        <ExchangerPickerAvatar exchanger={exchanger} active={active} />
                        <VerifiedDisplayName
                          as="p"
                          name={exchanger.name}
                          verified={['verified', 'approved', 'active'].includes(exchanger.status)}
                          iconSize="sm"
                          className="line-clamp-2 text-xs font-black leading-tight"
                          nameClassName="line-clamp-2 text-xs font-black leading-tight"
                        />
                        <span className="text-[10px] font-semibold text-[var(--app-text-muted)]">
                          {flagEmoji(exchanger.country)} {exchanger.city || exchanger.country}
                        </span>
                        {exchanger.rating > 0 ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <FiStar className="text-[9px]" /> {exchanger.rating.toFixed(1)}
                          </span>
                        ) : null}
                        <div className="flex w-full flex-col gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-brand-700 text-white' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'}`}>
                            {exchanger.feePercent}% {t('transfers.new.fees')}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-brand-600 text-white' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'}`}>
                            <FiClock className="mr-0.5 inline text-[9px]" />{exchanger.averageDelay}
                          </span>
                        </div>
                        {active ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-brand-600">
                            <FiCheck className="text-[10px]" /> {t('transfers.new.selected')}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>

            {selectedExchanger ? (
              <TransferReceivingAccountCard
                account={selectedReceivingAccount}
                direction={formik.values.direction}
                originCountry={originCountry}
              />
            ) : null}

            {/* Calculation block */}
            {Number(formik.values.amount) > 0 && selectedExchanger ? (
              <Card className="overflow-hidden p-0">
                {/* Hero gradient */}
                <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <FiZap className="text-white/80" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                      {t('transfers.new.estimation')}
                    </span>
                  </div>
                  <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-bold text-white/70">{t('transfers.new.youPay')}</p>
                      <p className="text-xl font-black text-white sm:text-2xl">
                        {formatMoney(calculation.totalToPay, calculation.currencyFrom)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full bg-white/20 px-3 py-1">
                        <FiArrowRight className="shrink-0 text-xs text-white" />
                        <span className="text-center text-[10px] font-bold leading-4 text-white">
                          1 {calculation.currencyFrom} = {calculation.rawRate} {calculation.currencyTo}
                        </span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-xs font-bold text-white/70">{t('transfers.new.recipientReceivesApprox')}</p>
                      <p className="text-xl font-black text-white sm:text-2xl">
                        {formatMoney(calculation.amountReceived, calculation.currencyTo)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 divide-y divide-[var(--app-border)] border-b border-[var(--app-border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {[
                    { label: t('transfers.new.amountSent'), value: formatMoney(calculation.amountSent, calculation.currencyFrom) },
                    { label: t('transfers.new.feesPercent', { percent: calculation.feePercent }), value: formatMoney(calculation.fees, calculation.currencyFrom), highlight: true },
                    { label: t('transfers.new.estimatedDelay'), value: selectedExchanger.averageDelay },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="grid gap-0.5 px-4 py-3 text-center">
                      <span className="text-[10px] font-bold text-[var(--app-text-faint)]">
                        {label}
                      </span>
                      <span className={`text-sm font-black ${highlight ? 'text-red-500' : 'text-[var(--app-text)]'}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Payment details + rate note */}
                <div className="grid gap-3 p-5">
                  <p className="text-[10px] leading-5 text-[var(--app-text-faint)]">
                    {t('transfers.new.rateNote', { source: liveRate.source, date: liveRate.date || t('transfers.new.dateUnavailable'), margin: calculation.rateMarginPercent })}
                  </p>
                </div>
              </Card>
            ) : !selectedExchanger ? null : (
              <Alert variant="info">{t('transfers.new.enterAmountForEstimate')}</Alert>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <PartyCard
            title={t('transfers.new.stepSender')}
            prefix="sender"
            profiles={senderProfiles}
            formik={formik}
            methods={sourceMethods}
            errorFor={errorFor}
            userId={user.id}
            onProfile={(profile) => applyProfile('sender', profile)}
          />
        ) : null}
        {step === 3 ? (
          <PartyCard
            title={t('transfers.new.stepRecipient')}
            prefix="recipient"
            profiles={recipientProfiles}
            formik={formik}
            methods={destinationMethods}
            errorFor={errorFor}
            userId={user.id}
            onProfile={(profile) => applyProfile('recipient', profile)}
          />
        ) : null}

        {step === 4 ? (
          <div className="grid gap-5">
            <Card className="grid gap-4">
              <SectionTitle icon={FiShield} label={t('transfers.new.recapTitle')} />
              {/* Amount highlight */}
              <div className="flex flex-col items-stretch gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold opacity-80">{t('transfers.new.youSend')}</p>
                  <p className="text-xl font-black sm:text-2xl">{formatMoney(calculation.totalToPay, calculation.currencyFrom)}</p>
                </div>
                <FiArrowRight className="mx-auto shrink-0 text-2xl opacity-70 sm:text-3xl" />
                <div className="text-center sm:text-right">
                  <p className="text-xs font-bold opacity-80">{t('transfers.new.recipientReceivesApprox')}</p>
                  <p className="text-xl font-black sm:text-2xl">{formatMoney(calculation.amountReceived, calculation.currencyTo)}</p>
                </div>
              </div>
              {[
                [t('transfers.new.partnerBusiness'), selectedExchanger?.name],
                [t('transfers.new.fees'), formatMoney(calculation.fees, calculation.currencyFrom)],
                [t('transfers.new.sender'), `${formik.values.senderFirstName} ${formik.values.senderLastName}`],
                [t('transfers.new.recipient'), `${formik.values.recipientFirstName} ${formik.values.recipientLastName}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] px-4 py-3">
                  <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
                  <strong className="text-right text-sm">{value || '—'}</strong>
                </div>
              ))}
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-[var(--app-border)] p-4 transition hover:border-brand-400">
                <input
                  className="mt-0.5 size-4 accent-brand-700"
                  type="checkbox"
                  {...formik.getFieldProps('acceptTerms')}
                  checked={formik.values.acceptTerms}
                />
                <span className="text-sm leading-relaxed">
                  {t('transfers.new.acceptTerms')}
                </span>
              </label>
              {errorFor('acceptTerms') ? (
                <p className="text-xs text-red-600">{errorFor('acceptTerms')}</p>
              ) : null}
              <Button type="submit" icon={FiShield} className="w-full sm:w-auto">
                {t('transfers.new.createAndSubmit')}
              </Button>
            </Card>
          </div>
        ) : null}

        <div className="flex justify-between gap-3">
          <Button
            variant="secondary"
            icon={FiArrowLeft}
            disabled={step === 1}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
          >
            {t('common.back')}
          </Button>
          {step < 4 ? (
            <Button icon={FiArrowRight} onClick={nextStep}>
              {t('common.continue')}
            </Button>
          ) : null}
        </div>
      </form>
      <Modal
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        title={t('transfers.history.calculatorModalTitle')}
        size="large"
      >
        <TransferCalculator originCountry={originCountry} verified={user.verified} />
      </Modal>
    </div>
  )
}

function PartyCard({ title, prefix, profiles, formik, methods, errorFor, onProfile, userId }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const country =
    prefix === 'sender' ? formik.values.sourceCountry : formik.values.destinationCountry
  const isRecipient = prefix === 'recipient'
  const [draft, setDraft] = useState({
    firstName: '',
    lastName: '',
    phone: phonePrefix(country),
    method: '',
  })

  function openCreateModal() {
    setDraft({
      firstName: String(formik.values[`${prefix}FirstName`] || '').trim(),
      lastName: String(formik.values[`${prefix}LastName`] || '').trim(),
      phone: String(formik.values[`${prefix}Phone`] || phonePrefix(country)).trim() || phonePrefix(country),
      method: String(formik.values[`${prefix}Method`] || ''),
    })
    setCreateError('')
    setCreateOpen(true)
  }

  function submitCreateProfile(event) {
    event.preventDefault()
    const firstName = draft.firstName.trim()
    const lastName = draft.lastName.trim()
    const phone = draft.phone.trim()
    const method = draft.method.trim()
    if (!firstName || !lastName) {
      setCreateError(t('transfers.new.profileCreate.errors.name'))
      return
    }
    if (!validatePhone(phone, country)) {
      setCreateError(phoneError(country))
      return
    }
    if (!method) {
      setCreateError(t('transfers.new.profileCreate.errors.method'))
      return
    }
    const action = saveTransferProfile({
      userId,
      firstName,
      lastName,
      phone,
      country,
      method,
    })
    dispatch(action)
    onProfile(action.payload)
    setCreateOpen(false)
  }

  return (
    <div className="grid gap-5">
      <Card className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <FiStar className="text-base" />
            </span>
            <h2 className="font-black">{t('transfers.new.favoriteProfiles')}</h2>
          </div>
          <Button type="button" variant="secondary" icon={FiPlus} onClick={openCreateModal}>
            {t('transfers.new.profileCreate.button')}
          </Button>
        </div>
        {profiles.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => onProfile(profile)}
                className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] p-3 text-left transition hover:border-brand-400 hover:shadow-sm"
              >
                <span className="grid size-9 shrink-0 place-items-center whitespace-nowrap rounded-xl bg-[var(--app-surface-muted)] text-sm font-black">
                  {`${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">{profile.method}</p>
                </div>
                <FiCheck className="ml-auto shrink-0 text-[var(--app-text-muted)]" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--app-text-muted)]">
            {t('transfers.new.noFavoriteProfiles')}
          </p>
        )}
      </Card>

      <Card className="grid gap-5">
        <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
          <span
            className={`grid size-9 place-items-center rounded-xl ${
              isRecipient
                ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300'
                : 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
            }`}
          >
            <FiUsers className="text-base" />
          </span>
          <h2 className="font-black">{title}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={`${prefix}FirstName`}
            label={t('transfers.new.firstName')}
            {...formik.getFieldProps(`${prefix}FirstName`)}
            error={errorFor(`${prefix}FirstName`)}
          />
          <Input
            id={`${prefix}LastName`}
            label={t('transfers.new.lastName')}
            {...formik.getFieldProps(`${prefix}LastName`)}
            error={errorFor(`${prefix}LastName`)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={`${prefix}Phone`}
            label={t('transfers.new.phone')}
            type="tel"
            inputMode="tel"
            placeholder={phonePlaceholder(country)}
            {...formik.getFieldProps(`${prefix}Phone`)}
            error={errorFor(`${prefix}Phone`)}
          />
          <div>
            <p className="mb-1.5 text-sm font-bold">{t('transfers.new.networkOrBank')}</p>
            <div className="flex flex-wrap gap-2">
              {methods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => formik.setFieldValue(`${prefix}Method`, method)}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                    formik.values[`${prefix}Method`] === method
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-[var(--app-surface-muted)] text-[var(--app-text)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {errorFor(`${prefix}Method`) ? (
              <p className="mt-1 text-xs text-red-600">{errorFor(`${prefix}Method`)}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('transfers.new.profileCreate.title', {
          party: isRecipient
            ? t('transfers.new.recipient')
            : t('transfers.new.sender'),
        })}
      >
        <form className="grid gap-4" onSubmit={submitCreateProfile} noValidate>
          <p className="text-sm text-[var(--app-text-muted)]">
            {t('transfers.new.profileCreate.description')}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id={`${prefix}-profile-firstName`}
              label={t('transfers.new.firstName')}
              value={draft.firstName}
              onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))}
            />
            <Input
              id={`${prefix}-profile-lastName`}
              label={t('transfers.new.lastName')}
              value={draft.lastName}
              onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))}
            />
          </div>
          <Input
            id={`${prefix}-profile-phone`}
            label={t('transfers.new.phone')}
            type="tel"
            inputMode="tel"
            placeholder={phonePlaceholder(country)}
            value={draft.phone}
            onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
          />
          <Select
            id={`${prefix}-profile-method`}
            label={t('transfers.new.networkOrBank')}
            value={draft.method}
            onChange={(event) => setDraft((current) => ({ ...current, method: event.target.value }))}
          >
            <option value="">{t('common.select')}</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          {createError ? <p className="text-xs text-red-600">{createError}</p> : null}
          <Button type="submit" icon={FiPlus}>
            {t('transfers.new.profileCreate.submit')}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
