import { useFormik } from 'formik'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiGlobe,
  FiImage,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRepeat,
  FiSend,
  FiSettings,
  FiShare2,
  FiUser,
  FiZap,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useDispatch, useSelector } from 'react-redux'
import { storageService } from '../services/storageService'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CitySelector } from '../components/ui/CitySelector'
import { Input, Textarea } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import {
  BUSINESS_ACTIVITIES,
  BUSINESS_SCHEDULE_PRESETS,
  businessExperienceForActivity,
  schedulePreset,
  servicesForActivities,
} from '../config/businessActivities'
import { ensurePhoneCountry, phonePlaceholder } from '../config/phone'
import { businessSchemaFor } from '../features/businesses/businessSchemas'
import { saveBusiness } from '../features/businesses/businessSlice'
import { generateBusinessPresentation } from '../features/businesses/generateBusinessPresentation'
import { selectActiveBusinessForOwner } from '../features/businesses/businessVisibility'
import { useScrollToTopOnStep } from '../hooks/useScrollToTopOnStep'
import { createId } from '../services/createId'
import { addToast } from '../features/ui/uiSlice'
import { SecurityGatePanel } from '../features/security/SecurityGatePanel'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { useActionBurst } from '../components/ui/ActionBurst'
import {
  paymentMethodsForCountry,
  transferCurrenciesForCountry,
} from '../features/transfers/transferConfig'
import { statusMeta } from '../config/statuses'
import { buildBusinessShareUrlFromValues } from '../features/share/businessShareUtils'
import { makeQrCodeUrl } from '../utils/qrCode'
import { useLanguage } from '../contexts/useLanguage'
import {
  businessesOptionLabel,
  businessesOptionDescription,
  businessesServiceLabel,
  businessesSpotlightLabel,
  businessesText,
} from '../features/businesses/businessesI18n'

/* ─── Step definition ──────────────────────────────────────────────────── */
const STEP_DEFS = [
  { value: 1, key: 'identity', labelKey: 'businesses.setup.steps.identity', icon: FiUser, color: 'brand' },
  { value: 2, key: 'contact', labelKey: 'businesses.setup.steps.contact', icon: FiMapPin, color: 'cyan' },
  { value: 3, key: 'services', labelKey: 'businesses.setup.steps.services', icon: FiZap, color: 'violet' },
  { value: 4, key: 'review', labelKey: 'businesses.setup.steps.review', icon: FiCheckCircle, color: 'emerald' },
]


const stepFields = {
  1: ['name', 'logoUrl', 'bannerUrl', 'primaryActivity', 'secondaryActivity'],
  2: ['city', 'address', 'phone', 'originPhone', 'email', 'telegram', 'website', 'description'],
  3: [
    'scheduleType',
    'serviceZones',
    'services',
    'feePercent',
    'averageDelay',
    'currencies',
    'exchangeMethods',
  ],
}

/* ─── Activity color palette ────────────────────────────────────────────── */
const ACTIVITY_COLORS = {
  transfer: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500' },
  logistics: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-500' },
  commerce: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-500' },
  recruitment: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', ring: 'ring-purple-500' },
  events: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', ring: 'ring-rose-500' },
  education: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-500' },
  real_estate: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', ring: 'ring-teal-500' },
  services: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300', ring: 'ring-slate-400' },
}

/* ─── Section title ─────────────────────────────────────────────────────── */
function SectionTitle({ action, description, icon: Icon, label }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--app-border)] pb-4">
      {action ? (
        action
      ) : (
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <Icon className="text-base" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black uppercase tracking-wide text-[var(--app-text-muted)]">{label}</h3>
        {description ? <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{description}</p> : null}
      </div>
    </div>
  )
}

/* ─── Visual Stepper ────────────────────────────────────────────────────── */
function Stepper({ step, onGoTo }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const steps = STEP_DEFS.map((item) => ({ ...item, label: bt(item.labelKey) }))
  return (
    <div className="relative flex items-start justify-between gap-0">
      {/* connecting line */}
      <div className="absolute left-0 right-0 top-5 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-5 h-px bg-brand-600 transition-all duration-500"
        style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        aria-hidden
      />

      {steps.map((s) => {
        const done = step > s.value
        const active = step === s.value
        const Icon = s.icon
        return (
          <button
            key={s.key}
            type="button"
            disabled={s.value > step}
            onClick={() => s.value < step && onGoTo(s.value)}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <span
              className={`grid size-10 place-items-center rounded-full border-2 transition-all duration-300 ${
                done
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : active
                    ? 'border-brand-600 bg-white text-brand-700 shadow-lg shadow-brand-200 dark:bg-slate-900 dark:shadow-brand-900/40'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]'
              }`}
            >
              {done ? <FiCheck className="text-sm font-black" /> : <Icon className="text-sm" />}
            </span>
            <span
              className={`text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : done ? 'text-[var(--app-text)]' : 'text-[var(--app-text-muted)]'}`}
            >
              {s.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Live preview card ─────────────────────────────────────────────────── */
function BusinessPreview({ formik, hasTransfer, serviceOptions }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const v = formik.values
  const activity = BUSINESS_ACTIVITIES.find((a) => a.value === v.primaryActivity)
  const activityLabel = businessesOptionLabel(t, activity)
  const experience = businessExperienceForActivity(v.primaryActivity)
  const experiencePromise = experience.promiseKey
    ? businessesText(t, experience.promiseKey)
    : experience.promise
  const colors = ACTIVITY_COLORS[v.primaryActivity] || ACTIVITY_COLORS.services
  const Icon = activity?.icon
  const status = statusMeta('pending_review', t)
  const shareUrl = buildBusinessShareUrlFromValues(v)
  const qrUrl = makeQrCodeUrl(shareUrl, 120)

  const initials = v.name
    ? v.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="sticky top-24 grid gap-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
        {bt('businesses.setup.preview.title')}
      </p>
      <div className="overflow-hidden rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl">
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <FiRepeat className="text-xs" />
            {bt('businesses.setup.preview.republish')}
          </span>
        </div>

        <div className="grid gap-3 border-b border-[var(--app-border)] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-start gap-3">
            {v.logoUrl ? (
              <img src={v.logoUrl} alt="" className="size-10 rounded-xl object-cover" />
            ) : (
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-xs font-black text-[var(--app-accent)]">
                {initials}
              </span>
            )}
            <div className="min-w-0 text-xs text-[var(--app-text-muted)]">
              <p className="font-bold text-[var(--app-text)]">{v.name || bt('businesses.setup.preview.companyNamePlaceholder')}</p>
              {activity ? <p className="mt-0.5 font-semibold text-brand-700">{activityLabel}</p> : null}
              {v.city ? (
                <p className="mt-1 flex items-center gap-1">
                  <FiMapPin className="shrink-0" /> {bt('businesses.setup.preview.cityRussia', { city: v.city })}
                </p>
              ) : null}
              {v.phone ? (
                <p className="mt-0.5 flex items-center gap-1">
                  <FiPhone className="shrink-0" /> {v.phone}
                </p>
              ) : null}
              {v.email ? (
                <p className="mt-0.5 flex items-center gap-1">
                  <FiMail className="shrink-0" /> {v.email}
                </p>
              ) : null}
            </div>
          </div>
          <img
            key={shareUrl}
            src={qrUrl}
            alt={bt('businesses.setup.preview.qrAlt')}
            className="size-20 rounded-xl border border-[var(--app-border)] bg-white p-1"
          />
        </div>

        <div className="relative">
          <div className="relative h-28 bg-gradient-to-br from-brand-600 to-cyan-600">
            {v.bannerUrl ? (
              <img src={v.bannerUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          </div>

          <div className="absolute -bottom-8 left-4 z-10">
            {v.logoUrl ? (
              <img
                src={v.logoUrl}
                alt={bt('businesses.setup.preview.logoAlt')}
                className="size-16 rounded-2xl border-4 border-[var(--app-surface)] object-cover shadow-lg"
              />
            ) : (
              <div
                className={`grid size-16 place-items-center rounded-2xl border-4 border-[var(--app-surface)] shadow-lg ${colors.bg}`}
              >
                {Icon ? <Icon className={`text-2xl ${colors.text}`} /> : (
                  <span className={`text-lg font-black ${colors.text}`}>{initials}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 px-4 pb-4 pt-12">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>

          <div>
            <p className="font-black leading-tight">
              {v.name || <span className="italic text-[var(--app-text-muted)]">{bt('businesses.setup.preview.companyNamePlaceholder')}</span>}
            </p>
            {activity ? (
              <p className={`mt-0.5 text-xs font-bold ${colors.text}`}>{activityLabel}</p>
            ) : null}
          </div>

          {v.description ? (
            <p className="whitespace-pre-line text-xs leading-5 text-[var(--app-text-muted)]">{v.description}</p>
          ) : (
            <p className="text-xs italic text-[var(--app-text-faint)]">
              {bt('businesses.setup.preview.presentationPlaceholder')}
            </p>
          )}

          {activity ? (
            <div className={`rounded-2xl p-3 text-xs leading-5 ${colors.bg}`}>
              <strong className={`block ${colors.text}`}>{activityLabel}</strong>
              <span className="text-[var(--app-text-muted)]">{experiencePromise}</span>
            </div>
          ) : null}

          {v.city ? (
            <p className="flex items-center gap-1.5 text-xs text-[var(--app-text-muted)]">
              <FiMapPin className="shrink-0 text-brand-600" /> {bt('businesses.setup.preview.cityDotRussia', { city: v.city })}
            </p>
          ) : null}

          {serviceOptions.length ? (
            <div className="flex flex-wrap gap-1.5">
              {serviceOptions.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          <div className={`grid gap-2 ${hasTransfer ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-center">
              <strong className="block text-base">0/5</strong>
              <span className="text-[10px] text-[var(--app-text-muted)]">{bt('businesses.setup.preview.reviewsZero')}</span>
            </div>
            {hasTransfer ? (
              <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-center">
                <strong className="block text-base">{v.feePercent ?? 0}%</strong>
                <span className="text-[10px] text-[var(--app-text-muted)]">{bt('businesses.setup.preview.fees')}</span>
              </div>
            ) : null}
          </div>

          {(v.phone || v.email) ? (
            <div className="border-t border-[var(--app-border)] pt-3">
              {v.phone ? (
                <div className="flex items-center gap-1.5 text-xs text-[var(--app-text-muted)]">
                  <FiPhone className="shrink-0" /> {v.phone}
                </div>
              ) : null}
              {v.email ? (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--app-text-muted)]">
                  <FiMail className="shrink-0" /> {v.email}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <p className="text-center text-[10px] text-[var(--app-text-muted)]">
        {bt('businesses.setup.preview.visibleAfterValidation')}
      </p>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export function BusinessSetupPage() {
  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const { requireBusiness } = useSecurityGate()
  const [shareModal, setShareModal] = useState(null)
  const [createdBusiness, setCreatedBusiness] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) => state.businesses.items)
  const ownBusiness = selectActiveBusinessForOwner(businesses, user.id)
  const draftBusinessId = useMemo(
    () => ownBusiness?.id || createId('BIZ'),
    [ownBusiness?.id],
  )
  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const transferCurrencies = transferCurrenciesForCountry(originCountry)
  const exchangeMethodOptions = [
    ...paymentMethodsForCountry(originCountry),
    ...paymentMethodsForCountry('RU'),
  ]
  const defaultSchedule = schedulePreset(ownBusiness?.scheduleType || 'weekdays')

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: draftBusinessId,
      ownerId: user.id,
      name: ownBusiness?.name || '',
      logoUrl: ownBusiness?.logoUrl || '',
      bannerUrl: ownBusiness?.bannerUrl || '',
      primaryActivity: ownBusiness?.primaryActivity || ownBusiness?.sector || '',
      secondaryActivity: ownBusiness?.secondaryActivity || '',
      sector: ownBusiness?.sector || '',
      country: 'RU',
      city: ownBusiness?.city || user.city || 'Moscou',
      address: ownBusiness?.address || '',
      phone: ensurePhoneCountry(ownBusiness?.phone || user.phone, 'RU'),
      originPhone: ownBusiness?.originPhone || '',
      email: ownBusiness?.email || user.email || '',
      telegram: ownBusiness?.telegram || '',
      description: ownBusiness?.description || '',
      website: ownBusiness?.website || '',
      scheduleType: ownBusiness?.scheduleType || defaultSchedule?.value || 'weekdays',
      schedule: ownBusiness?.schedule || defaultSchedule?.schedule || [],
      scheduleSummary: ownBusiness?.scheduleSummary || defaultSchedule?.summary || '',
      serviceZones: ownBusiness?.serviceZones || 'Moscou et villes proches',
      feePercent: ownBusiness?.feePercent ?? 2.5,
      averageDelay: ownBusiness?.averageDelay || '30-60 min',
      currencies: ownBusiness?.currencies?.length ? ownBusiness.currencies : transferCurrencies,
      exchangeMethods: ownBusiness?.exchangeMethods?.length
        ? ownBusiness.exchangeMethods
        : exchangeMethodOptions,
      services: ownBusiness?.services || [],
    },
    validationSchema: businessSchemaFor(t),
    onSubmit: (values) => {
      const preset = schedulePreset(values.scheduleType)
      const isNew = !ownBusiness
      const action = dispatch(
        saveBusiness({
          ...ownBusiness,
          ...values,
          ownerId: user.id,
          schedule: preset?.schedule || values.schedule,
          scheduleSummary: preset?.summary || values.scheduleSummary,
        }),
      )
      if (isNew) {
        setCreatedBusiness(action.payload)
      } else {
        navigate('/professional')
      }
    },
  })

  const primaryActivity = formik.values.primaryActivity
  const secondaryActivity = formik.values.secondaryActivity
  const selectedServices = formik.values.services.join('|')
  const serviceOptions = useMemo(
    () => servicesForActivities(primaryActivity, secondaryActivity),
    [primaryActivity, secondaryActivity],
  )
  const hasTransfer = serviceOptions.includes('Transfert')
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)

  useEffect(() => {
    const services = servicesForActivities(primaryActivity, secondaryActivity)
    if (services.join('|') !== selectedServices) {
      formik.setFieldValue('services', services, false)
    }
  }, [formik, primaryActivity, secondaryActivity, selectedServices])

  function toggleArrayField(field, value) {
    const values = formik.values[field].includes(value)
      ? formik.values[field].filter((item) => item !== value)
      : [...formik.values[field], value]
    formik.setFieldValue(field, values)
  }

  function selectSchedule(value) {
    const preset = schedulePreset(value)
    formik.setFieldValue('scheduleType', value)
    formik.setFieldValue('schedule', preset?.schedule || [])
    formik.setFieldValue('scheduleSummary', preset?.summary || '')
  }

  async function nextStep() {
    const fields = stepFields[step] || []
    const errors = await formik.validateForm()
    formik.setTouched(
      fields.reduce((acc, field) => ({ ...acc, [field]: true }), formik.touched),
      false,
    )
    if (fields.some((field) => errors[field])) return
    setStep((current) => Math.min(4, current + 1))
  }

  if (createdBusiness) {
    const successServices = servicesForActivities(
      createdBusiness.primaryActivity,
      createdBusiness.secondaryActivity,
    )
    return (
      <>
        {shareModal ? (
          <ShareToFeedModal
            sourceType="business"
            sourceId={shareModal.sourceId}
            sourceData={shareModal.sourceData}
            onClose={() => {
              setShareModal(null)
              navigate('/professional')
            }}
          />
        ) : null}
        <BusinessCreatedSuccess
          business={createdBusiness}
          hasTransfer={successServices.includes('Transfert')}
          serviceOptions={successServices}
          onGoProfessional={() => navigate('/professional')}
          onShare={() =>
            setShareModal({ sourceId: createdBusiness.id, sourceData: createdBusiness })
          }
        />
      </>
    )
  }

  return (
    <SecurityGatePanel kind="business" backTo="/businesses">
    <>
    {shareModal ? (
      <ShareToFeedModal
        sourceType="business"
        sourceId={shareModal.sourceId}
        sourceData={shareModal.sourceData}
        onClose={() => { setShareModal(null); navigate('/professional') }}
      />
    ) : null}
    <div className="grid gap-7">
      <PageHeader
        eyebrow={bt('businesses.setup.eyebrow')}
        title={ownBusiness ? bt('businesses.setup.title.edit') : bt('businesses.setup.title.create')}
        description={bt('businesses.setup.description')}
        actions={
          <Link to={ownBusiness ? '/professional' : '/businesses'}>
            <Button variant="secondary" icon={FiArrowLeft}>{bt('businesses.common.back')}</Button>
          </Link>
        }
      />

      <Alert title={bt('businesses.setup.validationAlertTitle')}>
        {bt('businesses.setup.validationAlertBody')}
      </Alert>

      {/* Stepper */}
      <Card className="px-6 py-5">
        <Stepper step={step} onGoTo={setStep} />
      </Card>

      <form className="grid gap-5" onSubmit={formik.handleSubmit} noValidate>
        {/* Split layout: form + live preview */}
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div className="grid gap-5">
            {step === 1 ? (
              <IdentityStep
                businessId={formik.values.id}
                errorFor={errorFor}
                formik={formik}
                userId={user.id}
              />
            ) : null}
            {step === 2 ? (
              <ContactStep
                errorFor={errorFor}
                formik={formik}
                onScheduleChange={selectSchedule}
                onUseAccountPhone={() =>
                  formik.setFieldValue('phone', ensurePhoneCountry(user.phone, 'RU'))
                }
              />
            ) : null}
            {step === 3 ? (
              <ServicesStep
                exchangeMethodOptions={exchangeMethodOptions}
                errorFor={errorFor}
                formik={formik}
                hasTransfer={hasTransfer}
                serviceOptions={serviceOptions}
                toggleArrayField={toggleArrayField}
                transferCurrencies={transferCurrencies}
              />
            ) : null}
            {step === 4 ? (
              <ReviewStep formik={formik} hasTransfer={hasTransfer} serviceOptions={serviceOptions} />
            ) : null}
          </div>

          {/* Live preview — desktop only, hidden on step 4 (full recap already shown) */}
          {step < 4 ? (
            <div className="hidden lg:block">
              <BusinessPreview
                formik={formik}
                hasTransfer={hasTransfer}
                serviceOptions={serviceOptions}
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            icon={FiArrowLeft}
            disabled={step === 1}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
          >
            {bt('businesses.common.back')}
          </Button>
          {step < 4 ? (
            <Button type="button" icon={FiArrowRight} onClick={nextStep}>
              {bt('businesses.common.continue')}
            </Button>
          ) : (
            <Button type="submit" icon={FiCheckCircle} loading={formik.isSubmitting}>
              {ownBusiness
                ? bt('businesses.setup.saveChanges')
                : bt('businesses.setup.submitForValidation')}
            </Button>
          )}
        </div>
      </form>
    </div>
    </>
    </SecurityGatePanel>
  )
}
function IdentityStep({ businessId, errorFor, formik, userId }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const dispatch = useDispatch()
  const selectedActivity = BUSINESS_ACTIVITIES.find((a) => a.value === formik.values.primaryActivity)
  const logoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  async function handleLogoFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    formik.setFieldValue('logoUrl', URL.createObjectURL(file))
    try {
      const url = await storageService.uploadBusinessLogo(userId, businessId, file)
      formik.setFieldValue('logoUrl', url)
      dispatch(
        addToast({
          title: bt('businesses.setup.toast.logoAddedTitle'),
          message: bt('businesses.setup.toast.logoAddedBody'),
          tone: 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: bt('businesses.setup.toast.logoFailedTitle'),
          message: err.message || bt('businesses.setup.toast.logoFailedBody'),
          tone: 'error',
        }),
      )
    }
  }
  async function handleBannerFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    formik.setFieldValue('bannerUrl', URL.createObjectURL(file))
    try {
      const url = await storageService.uploadBusinessBanner(userId, businessId, file)
      formik.setFieldValue('bannerUrl', url)
      dispatch(
        addToast({
          title: bt('businesses.setup.toast.bannerAddedTitle'),
          message: bt('businesses.setup.toast.bannerAddedBody'),
          tone: 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: bt('businesses.setup.toast.bannerFailedTitle'),
          message: err.message || bt('businesses.setup.toast.bannerFailedBody'),
          tone: 'error',
        }),
      )
    }
  }

  return (
    <div className="grid gap-5">
      {/* Name */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiUser} label={bt('businesses.setup.identity.section')} description={bt('businesses.setup.identity.sectionHint')} />
        <Input
          id="business-name"
          label={bt('businesses.setup.identity.name')}
          placeholder={bt('businesses.setup.identity.namePlaceholder')}
          {...formik.getFieldProps('name')}
          error={errorFor('name')}
        />
      </Card>

      {/* Activity grid */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiZap} label={bt('businesses.setup.identity.domainSection')} description={bt('businesses.setup.identity.domainHint')} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BUSINESS_ACTIVITIES.map((activity) => {
            const Icon = activity.icon
            const colors = ACTIVITY_COLORS[activity.value] || ACTIVITY_COLORS.services
            const selected = formik.values.primaryActivity === activity.value
            return (
              <button
                key={activity.value}
                type="button"
                onClick={() => {
                  formik.setFieldValue('primaryActivity', activity.value)
                  if (formik.values.secondaryActivity === activity.value) {
                    formik.setFieldValue('secondaryActivity', '')
                  }
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                  selected
                    ? `border-transparent ${colors.bg} ring-2 ${colors.ring} shadow-md`
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-accent)] hover:shadow-sm'
                }`}
              >
                <span
                  className={`grid size-10 place-items-center rounded-xl ${selected ? colors.bg : 'bg-[var(--app-surface-muted)]'}`}
                >
                  <Icon className={`text-lg ${selected ? colors.text : 'text-[var(--app-text-muted)]'}`} />
                </span>
                <span className={`text-xs font-black leading-tight ${selected ? colors.text : ''}`}>
                  {businessesOptionLabel(t, activity)}
                </span>
              </button>
            )
          })}
        </div>
        {errorFor('primaryActivity') ? (
          <p className="text-xs text-red-600">{errorFor('primaryActivity')}</p>
        ) : null}

        {selectedActivity ? (
          <div className={`flex items-start gap-3 rounded-2xl p-4 ${ACTIVITY_COLORS[selectedActivity.value]?.bg || ''}`}>
            <selectedActivity.icon className={`mt-0.5 shrink-0 text-lg ${ACTIVITY_COLORS[selectedActivity.value]?.text || ''}`} />
            <div>
              <p className={`text-sm font-black ${ACTIVITY_COLORS[selectedActivity.value]?.text || ''}`}>{businessesOptionLabel(t, selectedActivity)}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{businessesOptionDescription(t, selectedActivity)}</p>
            </div>
          </div>
        ) : null}

        {/* Secondary activity */}
        <Select
          id="business-secondary-activity"
          label={bt('businesses.setup.identity.secondary')}
          {...formik.getFieldProps('secondaryActivity')}
          error={errorFor('secondaryActivity')}
        >
          <option value="">{bt('businesses.setup.identity.secondaryNone')}</option>
          {BUSINESS_ACTIVITIES.filter((a) => a.value !== formik.values.primaryActivity).map((a) => (
            <option key={a.value} value={a.value}>{businessesOptionLabel(t, a)}</option>
          ))}
        </Select>
      </Card>

      {/* Visuals */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiCamera} label={bt('businesses.setup.identity.visualSection')} description={bt('businesses.setup.identity.visualHint')} />

        {/* Logo */}
        <div>
          <p className="mb-3 text-sm font-bold">{bt('businesses.setup.identity.logo')}</p>
          <div className="flex items-center gap-4">
            {formik.values.logoUrl ? (
              <img
                src={formik.values.logoUrl}
                alt="Logo"
                className="size-20 rounded-2xl object-cover shadow-md ring-2 ring-[var(--app-border)]"
              />
            ) : (
              <div className="grid size-20 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                <FiImage className="text-2xl" />
              </div>
            )}
            <div className="grid gap-2">
              <Button type="button" variant="secondary" icon={FiCamera} onClick={() => logoInputRef.current?.click()}>
                {formik.values.logoUrl ? bt('businesses.setup.identity.changeLogo') : bt('businesses.setup.identity.addLogo')}
              </Button>
              {formik.values.logoUrl ? (
                <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => formik.setFieldValue('logoUrl', '')}>
                  {bt('businesses.common.delete')}
                </button>
              ) : null}
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoFile} />
          {errorFor('logoUrl') ? <p className="mt-1 text-xs text-red-600">{errorFor('logoUrl')}</p> : null}
        </div>

        {/* Banner */}
        <div>
          <p className="mb-3 text-sm font-bold">{bt('businesses.setup.identity.banner')}</p>
          {formik.values.bannerUrl ? (
            <div className="relative mb-3">
              <img src={formik.values.bannerUrl} alt={bt('businesses.setup.identity.bannerAlt')} className="h-32 w-full rounded-[1.5rem] object-cover shadow-md" />
              <button
                type="button"
                onClick={() => formik.setFieldValue('bannerUrl', '')}
                className="absolute right-3 top-3 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold text-white"
              >
                {bt('businesses.common.delete')}
              </button>
            </div>
          ) : null}
          <Button type="button" variant="secondary" icon={FiImage} onClick={() => bannerInputRef.current?.click()}>
            {formik.values.bannerUrl ? bt('businesses.setup.identity.changeBanner') : bt('businesses.setup.identity.addBanner')}
          </Button>
          <input ref={bannerInputRef} type="file" accept="image/*" className="sr-only" onChange={handleBannerFile} />
          {errorFor('bannerUrl') ? <p className="mt-1 text-xs text-red-600">{errorFor('bannerUrl')}</p> : null}
        </div>
      </Card>
    </div>
  )
}

/* ─── Step 2 — Contact ──────────────────────────────────────────────────── */
function ContactStep({ errorFor, formik, onScheduleChange, onUseAccountPhone }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  return (
    <div className="grid gap-5">
      {/* Location */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiMapPin} label={bt('businesses.setup.contact.locationSection')} description={bt('businesses.setup.contact.locationHint')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="business-country" label={bt('businesses.common.country')} value={bt('businesses.common.russia')} disabled />
          <CitySelector
            id="business-city"
            label={bt('businesses.setup.contact.cityInRussia')}
            value={formik.values.city}
            onChange={(city) => formik.setFieldValue('city', city)}
            error={errorFor('city')}
          />
        </div>
        <Input
          id="business-address"
          label={bt('businesses.setup.contact.fullAddress')}
          placeholder={bt('businesses.setup.contact.addressPlaceholder')}
          {...formik.getFieldProps('address')}
          error={errorFor('address')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="business-schedule-type"
            label={bt('businesses.common.hours')}
            value={formik.values.scheduleType}
            onChange={(event) => onScheduleChange(event.target.value)}
            error={errorFor('scheduleType')}
          >
            {BUSINESS_SCHEDULE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.labelKey ? businessesText(t, preset.labelKey) : preset.label}
              </option>
            ))}
          </Select>
          <Input
            id="business-zones"
            label={bt('businesses.setup.contact.serviceZones')}
            placeholder={bt('businesses.setup.contact.serviceZonesPlaceholder')}
            {...formik.getFieldProps('serviceZones')}
            error={errorFor('serviceZones')}
          />
        </div>
      </Card>

      {/* Phone & digital */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiPhone} label={bt('businesses.setup.contact.coordsSection')} description={bt('businesses.setup.contact.coordsHint')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Input
              id="business-phone"
              label={bt('businesses.setup.contact.russianPhone')}
              type="tel"
              placeholder={phonePlaceholder('RU')}
              {...formik.getFieldProps('phone')}
              error={errorFor('phone')}
            />
            <Button type="button" variant="secondary" onClick={onUseAccountPhone}>
              {bt('businesses.setup.contact.useAccountPhone')}
            </Button>
          </div>
          <Input
            id="business-origin-phone"
            label={bt('businesses.setup.contact.originPhone')}
            type="tel"
            placeholder={phonePlaceholder('BJ')}
            {...formik.getFieldProps('originPhone')}
            error={errorFor('originPhone')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="business-email"
            label={bt('businesses.setup.contact.professionalEmail')}
            type="email"
            placeholder={bt('businesses.setup.contact.emailPlaceholder')}
            {...formik.getFieldProps('email')}
            error={errorFor('email')}
          />
          <Input
            id="business-telegram"
            label={bt('businesses.setup.contact.telegram')}
            placeholder={bt('businesses.setup.contact.telegramPlaceholder')}
            {...formik.getFieldProps('telegram')}
            error={errorFor('telegram')}
          />
        </div>
        <Input
          id="business-website"
          label={bt('businesses.setup.contact.website')}
          placeholder={bt('businesses.setup.contact.websitePlaceholder')}
          {...formik.getFieldProps('website')}
          error={errorFor('website')}
        />
      </Card>

      {/* Description */}
      <Card className="grid gap-5">
        <SectionTitle
          action={
            <button
              type="button"
              title={bt('businesses.setup.contact.generateAria')}
              aria-label={bt('businesses.setup.contact.generateAria')}
              onClick={() => {
                const generated = generateBusinessPresentation(formik.values)
                formik.setFieldValue('description', generated)
                formik.setFieldTouched('description', true, false)
              }}
              className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-brand-700 transition hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/30"
            >
              <FiZap className="text-base" />
            </button>
          }
          icon={FiGlobe}
          label={bt('businesses.setup.contact.presentationSection')}
          description={bt('businesses.setup.contact.presentationHint')}
        />
        <Textarea
          id="business-description"
          label={bt('businesses.setup.contact.about')}
          rows={5}
          placeholder={bt('businesses.setup.contact.aboutPlaceholder')}
          {...formik.getFieldProps('description')}
          error={errorFor('description')}
        />
      </Card>
    </div>
  )
}

/* ─── Step 3 — Services ─────────────────────────────────────────────────── */
function ServicesStep({
  exchangeMethodOptions,
  errorFor,
  formik,
  hasTransfer,
  serviceOptions,
  toggleArrayField,
  transferCurrencies,
}) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  return (
    <div className="grid gap-5">
      <Card className="grid gap-4">
        <SectionTitle icon={FiZap} label={bt('businesses.setup.services.modulesSection')} description={bt('businesses.setup.services.modulesHint')} />
        <div className="flex flex-wrap gap-2">
          {serviceOptions.length ? (
            serviceOptions.map((service) => (
              <Badge key={service} tone={service === 'Transfert' ? 'success' : 'info'}>
                <FiCheckCircle className="mr-1 inline" />
                {businessesServiceLabel(t, service)}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-[var(--app-text-muted)]">
              {bt('businesses.setup.services.selectDomainFirst')}
            </p>
          )}
        </div>
        {errorFor('services') ? (
          <p className="text-xs text-red-600">{errorFor('services')}</p>
        ) : null}
      </Card>

      {hasTransfer ? (
        <Card className="grid gap-6">
          <SectionTitle icon={FiSettings} label={bt('businesses.setup.services.transferSection')} description={bt('businesses.setup.services.transferHint')} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="business-fee"
              label={bt('businesses.setup.services.feePercent')}
              type="number"
              step="0.1"
              {...formik.getFieldProps('feePercent')}
              error={errorFor('feePercent')}
            />
            <Input
              id="business-delay"
              label={bt('businesses.setup.services.averageDelay')}
              placeholder={bt('businesses.setup.services.averageDelayPlaceholder')}
              {...formik.getFieldProps('averageDelay')}
              error={errorFor('averageDelay')}
            />
          </div>

          <ChoiceGroup
            label={bt('businesses.setup.services.currencies')}
            values={formik.values.currencies}
            options={transferCurrencies}
            onToggle={(value) => toggleArrayField('currencies', value)}
            error={errorFor('currencies')}
          />

          <div>
            <p className="mb-1 text-sm font-semibold">{bt('businesses.setup.services.networksTitle')}</p>
            <p className="mb-3 text-xs text-[var(--app-text-muted)]">{bt('businesses.setup.services.networksHint')}</p>
            {/* Split African / Russian */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">{bt('businesses.setup.services.africanNetworks')}</p>
                <div className="flex flex-wrap gap-2">
                  {exchangeMethodOptions
                    .filter((o) => !['Sberbank', 'VTB', 'T-Bank', 'Alfa-Bank', 'Gazprombank', 'Raiffeisenbank', 'Ozon Bank'].includes(o))
                    .map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleArrayField('exchangeMethods', option)}
                        className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                          formik.values.exchangeMethods.includes(option)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">{bt('businesses.setup.services.russianBanks')}</p>
                <div className="flex flex-wrap gap-2">
                  {['Sberbank', 'VTB', 'T-Bank', 'Alfa-Bank', 'Gazprombank', 'Raiffeisenbank', 'Ozon Bank'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArrayField('exchangeMethods', option)}
                      className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                        formik.values.exchangeMethods.includes(option)
                          ? 'bg-brand-700 text-white'
                          : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {errorFor('exchangeMethods') ? (
              <p className="mt-2 text-xs text-red-600">{errorFor('exchangeMethods')}</p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  )
}

/* ─── Step 4 — Review ───────────────────────────────────────────────────── */
function ReviewStep({ formik, hasTransfer, serviceOptions }) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const experience = businessExperienceForActivity(formik.values.primaryActivity)
  const spotlight = (experience.spotlightKeys || [])
    .map((key) => businessesSpotlightLabel(t, key))
    .join(', ')
    .toLowerCase()
  const v = formik.values
  return (
    <div className="grid gap-5">
      {/* Identity */}
      <Card className="grid gap-4">
        <SectionTitle icon={FiUser} label={bt('businesses.setup.review.identity')} />
        <div className="flex items-center gap-4">
          {v.logoUrl ? (
            <img src={v.logoUrl} alt={bt('businesses.setup.preview.logoAlt')} className="size-16 rounded-2xl object-cover shadow ring-2 ring-[var(--app-border)]" />
          ) : (
            <div className="grid size-16 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
              <FiImage className="text-xl" />
            </div>
          )}
          <div>
            <p className="font-black">{v.name || '—'}</p>
            <p className="text-sm text-[var(--app-text-muted)]">{v.primaryActivity || '—'}</p>
            {v.secondaryActivity ? <p className="text-xs text-[var(--app-text-muted)]">+ {v.secondaryActivity}</p> : null}
          </div>
        </div>
        {v.bannerUrl ? (
          <img src={v.bannerUrl} alt={bt('businesses.setup.identity.bannerAlt')} className="h-20 w-full rounded-[1.4rem] object-cover shadow" />
        ) : null}
      </Card>

      {/* Contact */}
      <Card className="grid gap-3">
        <SectionTitle icon={FiMapPin} label={bt('businesses.setup.review.contact')} />
        <ReviewRow label={bt('businesses.common.city')} value={v.city} />
        <ReviewRow label={bt('businesses.common.address')} value={v.address} />
        <ReviewRow label={bt('businesses.setup.review.russianPhone')} value={v.phone} />
        {v.originPhone ? <ReviewRow label={bt('businesses.setup.review.originPhone')} value={v.originPhone} /> : null}
        {v.email ? <ReviewRow label={bt('businesses.common.email')} value={v.email} /> : null}
        {v.telegram ? <ReviewRow label={bt('businesses.setup.contact.telegram')} value={v.telegram} /> : null}
        {v.website ? <ReviewRow label={bt('businesses.setup.contact.website')} value={v.website} /> : null}
        <ReviewRow label={bt('businesses.common.hours')} value={v.scheduleSummary || bt('businesses.common.emDash')} />
        <ReviewRow label={bt('businesses.common.zones')} value={v.serviceZones || bt('businesses.common.emDash')} />
        {v.description ? (
          <div className="rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">{v.description}</div>
        ) : null}
      </Card>

      {/* Services */}
      <Card className="grid gap-3">
        <SectionTitle icon={FiZap} label={bt('businesses.setup.review.services')} />
        <ReviewRow
          label={bt('businesses.setup.review.modules')}
          value={
            serviceOptions.map((service) => businessesServiceLabel(t, service)).join(', ') ||
            bt('businesses.setup.review.none')
          }
        />
        {hasTransfer ? (
          <>
            <ReviewRow label={bt('businesses.setup.review.fees')} value={`${v.feePercent}%`} />
            <ReviewRow label={bt('businesses.setup.services.averageDelay')} value={v.averageDelay} />
            <ReviewRow label={bt('businesses.setup.review.currencies')} value={v.currencies.join(', ')} />
            <ReviewRow label={bt('businesses.setup.review.networksBanks')} value={v.exchangeMethods.join(', ')} />
          </>
        ) : null}
      </Card>

      <div className="flex items-start gap-3 rounded-[1.4rem] bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <FiSend className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
            {bt('businesses.setup.review.readyTitle')}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
            {bt('businesses.setup.review.readyBody', { spotlight })}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function ChoiceGroup({ error, label, onToggle, options, values }) {
  return (
    <div>
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full px-3 py-2 text-xs font-bold transition ${
              values.includes(option)
                ? 'bg-brand-700 text-white'
                : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="font-semibold text-[var(--app-text-muted)]">{label}</span>
      <span className="text-right font-bold text-[var(--app-text)]">{value || '—'}</span>
    </div>
  )
}

function BusinessCreatedSuccess({
  business,
  hasTransfer,
  onGoProfessional,
  onShare,
  serviceOptions,
}) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const { trigger, node } = useActionBurst()
  const experience = businessExperienceForActivity(business.primaryActivity)
  const spotlight = (experience.spotlightKeys || [])
    .map((key) => businessesSpotlightLabel(t, key))
    .join(', ')
    .toLowerCase()

  useEffect(() => {
    const timer = window.setTimeout(() => trigger(), 180)
    return () => window.clearTimeout(timer)
  }, [trigger])

  return (
    <div className="business-created-success grid gap-6">
      {node}
      <Card variant="featured" className="overflow-hidden p-0">
        <div className="business-created-hero bg-gradient-to-br from-brand-700 via-brand-600 to-[var(--app-teal)] px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="business-created-hero-icon grid size-16 place-items-center rounded-3xl bg-white/15 backdrop-blur">
            <HiOutlineBuildingOffice2 className="text-3xl" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/75">
            {bt('businesses.setup.success.congrats')}
          </p>
          <h1 className="mt-2 font-display text-2xl font-black sm:text-3xl">
            {bt('businesses.setup.success.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/88">
            <strong>{business.name}</strong> {bt('businesses.setup.success.body')}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-4">
          <SectionTitle icon={FiUser} label={bt('businesses.setup.success.recap')} />
          <div className="flex items-center gap-4">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt=""
                className="size-16 rounded-2xl object-cover shadow ring-2 ring-[var(--app-border)]"
              />
            ) : (
              <div className="grid size-16 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                <FiImage className="text-xl" aria-hidden="true" />
              </div>
            )}
            <div>
              <p className="font-black text-[var(--app-text)]">{business.name}</p>
              <p className="text-sm text-[var(--app-text-muted)]">{business.primaryActivity}</p>
              {business.secondaryActivity ? (
                <p className="text-xs text-[var(--app-text-muted)]">+ {business.secondaryActivity}</p>
              ) : null}
            </div>
          </div>
          <ReviewRow label={bt('businesses.common.city')} value={business.city} />
          <ReviewRow label={bt('businesses.common.phone')} value={business.phone} />
          {business.email ? <ReviewRow label={bt('businesses.common.email')} value={business.email} /> : null}
          <ReviewRow label={bt('businesses.common.hours')} value={business.scheduleSummary} />
          <ReviewRow
            label={bt('businesses.setup.review.services')}
            value={serviceOptions.map((service) => businessesServiceLabel(t, service)).join(', ')}
          />
          {hasTransfer ? (
            <>
              <ReviewRow label={bt('businesses.setup.review.fees')} value={`${business.feePercent}%`} />
              <ReviewRow label={bt('businesses.setup.review.currencies')} value={(business.currencies || []).join(', ')} />
            </>
          ) : null}
        </Card>

        <div className="grid gap-4">
          <Card className="grid gap-3">
            <SectionTitle icon={FiCheckCircle} label={bt('businesses.setup.success.nextSteps')} />
            <ul className="grid gap-2 text-sm text-[var(--app-text-muted)]">
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                {bt('businesses.setup.success.stepValidation')}
              </li>
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                {bt('businesses.setup.success.stepSpotlight', { spotlight })}
              </li>
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                {bt('businesses.setup.success.stepComplete')}
              </li>
            </ul>
          </Card>

          <div className="grid gap-2">
            <Button className="w-full" icon={HiOutlineBuildingOffice2} onClick={onGoProfessional}>
              {bt('businesses.setup.success.goProfessional')}
            </Button>
            <Button className="w-full" variant="secondary" icon={FiShare2} onClick={onShare}>
              {bt('businesses.setup.success.republish')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
