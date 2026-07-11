import { useFormik } from 'formik'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiGlobe,
  FiImage,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
  FiSettings,
  FiShare2,
  FiUser,
  FiZap,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { storageService } from '../services/storageService'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CitySelector } from '../components/ui/CitySelector'
import { Input } from '../components/ui/Input'
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
import { businessSchema } from '../features/businesses/businessSchemas'
import { saveBusiness } from '../features/businesses/businessSlice'
import { createId } from '../services/createId'
import { addToast } from '../features/ui/uiSlice'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { useActionBurst } from '../components/ui/ActionBurst'
import {
  paymentMethodsForCountry,
  transferCurrenciesForCountry,
} from '../features/transfers/transferConfig'

/* ─── Step definition ──────────────────────────────────────────────────── */
const STEPS = [
  { value: 1, key: 'identity', label: 'Identite', icon: FiUser, color: 'brand' },
  { value: 2, key: 'contact', label: 'Contact', icon: FiMapPin, color: 'cyan' },
  { value: 3, key: 'services', label: 'Services', icon: FiZap, color: 'violet' },
  { value: 4, key: 'review', label: 'Valider', icon: FiCheckCircle, color: 'emerald' },
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
function SectionTitle({ icon: Icon, label, description }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--app-border)] pb-4">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
        <Icon className="text-base" />
      </span>
      <div>
        <h3 className="text-sm font-black uppercase tracking-wide text-[var(--app-text-muted)]">{label}</h3>
        {description ? <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{description}</p> : null}
      </div>
    </div>
  )
}

/* ─── Visual Stepper ────────────────────────────────────────────────────── */
function Stepper({ step, onGoTo }) {
  return (
    <div className="relative flex items-start justify-between gap-0">
      {/* connecting line */}
      <div className="absolute left-0 right-0 top-5 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-5 h-px bg-brand-600 transition-all duration-500"
        style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        aria-hidden
      />

      {STEPS.map((s) => {
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
function BusinessPreview({ formik, serviceOptions }) {
  const v = formik.values
  const activity = BUSINESS_ACTIVITIES.find((a) => a.value === v.primaryActivity)
  const colors = ACTIVITY_COLORS[v.primaryActivity] || ACTIVITY_COLORS.services
  const Icon = activity?.icon

  const initials = v.name
    ? v.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="sticky top-24 grid gap-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
        Apercu de votre fiche
      </p>
      <div className="overflow-hidden rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl">
        {/* Banner */}
        <div className="relative h-24 bg-gradient-to-br from-brand-600 to-cyan-600">
          {v.bannerUrl ? (
            <img src={v.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Logo */}
        <div className="-mt-8 px-4">
          {v.logoUrl ? (
            <img
              src={v.logoUrl}
              alt="Logo"
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

        <div className="grid gap-3 p-4">
          <div>
            <p className="font-black leading-tight">{v.name || <span className="italic text-[var(--app-text-muted)]">Nom de l entreprise</span>}</p>
            {activity ? (
              <p className={`mt-0.5 text-xs font-bold ${colors.text}`}>{activity.label}</p>
            ) : null}
          </div>

          {v.city ? (
            <div className="flex items-center gap-1.5 text-xs text-[var(--app-text-muted)]">
              <FiMapPin className="shrink-0" /> {v.city}, Russie
            </div>
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

          {v.description ? (
            <p className="line-clamp-2 text-xs text-[var(--app-text-muted)]">{v.description}</p>
          ) : null}

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
        Votre fiche sera visible apres validation
      </p>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export function BusinessSetupPage() {
  const [step, setStep] = useState(1)
  const [shareModal, setShareModal] = useState(null)
  const [createdBusiness, setCreatedBusiness] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const businesses = useSelector((state) => state.businesses.items)
  const ownBusiness = businesses.find((item) => item.ownerId === user.id)
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
    validationSchema: businessSchema,
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
        eyebrow="Espace entreprise"
        title={ownBusiness ? 'Modifier mon entreprise' : 'Creer mon entreprise'}
        description="Parcours en plusieurs etapes pour configurer votre activite, vos contacts en Russie et vos services."
        actions={
          <Link to={ownBusiness ? '/professional' : '/businesses'}>
            <Button variant="secondary" icon={FiArrowLeft}>Retour</Button>
          </Link>
        }
      />

      <Alert title="Validation requise">
        Votre entreprise reste invisible dans l annuaire jusqu a confirmation par un administrateur.
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
              <BusinessPreview formik={formik} serviceOptions={serviceOptions} />
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
            Retour
          </Button>
          {step < 4 ? (
            <Button type="button" icon={FiArrowRight} onClick={nextStep}>
              Continuer
            </Button>
          ) : (
            <Button type="submit" icon={FiCheckCircle} loading={formik.isSubmitting}>
              {ownBusiness ? 'Enregistrer les modifications' : 'Envoyer pour validation'}
            </Button>
          )}
        </div>
      </form>
    </div>
    </>
  )
}

/* ─── Step 1 — Identity ─────────────────────────────────────────────────── */
function IdentityStep({ businessId, errorFor, formik, userId }) {
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
          title: 'Logo ajouté',
          message: 'Le logo de l’entreprise a été envoyé.',
          tone: 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: 'Logo non envoyé',
          message: err.message || "Le logo n'a pas pu être envoyé.",
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
          title: 'Bannière ajoutée',
          message: 'La bannière de l’entreprise a été envoyée.',
          tone: 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: 'Bannière non envoyée',
          message: err.message || "La bannière n'a pas pu être envoyée.",
          tone: 'error',
        }),
      )
    }
  }

  return (
    <div className="grid gap-5">
      {/* Name */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiUser} label="Identite de l entreprise" description="Le nom public qui apparaitra dans l annuaire MOXT." />
        <Input
          id="business-name"
          label="Nom public de l'entreprise"
          placeholder="Ex : Koudjo Transfer, Afrik Logistique..."
          {...formik.getFieldProps('name')}
          error={errorFor('name')}
        />
      </Card>

      {/* Activity grid */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiZap} label="Domaine principal" description="Choisissez le coeur de votre activite. Cela definit vos modules et votre positionnement." />
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
                  {activity.label}
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
              <p className={`text-sm font-black ${ACTIVITY_COLORS[selectedActivity.value]?.text || ''}`}>{selectedActivity.label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{selectedActivity.description}</p>
            </div>
          </div>
        ) : null}

        {/* Secondary activity */}
        <Select
          id="business-secondary-activity"
          label="Activite secondaire (facultatif)"
          {...formik.getFieldProps('secondaryActivity')}
          error={errorFor('secondaryActivity')}
        >
          <option value="">Aucune activite secondaire</option>
          {BUSINESS_ACTIVITIES.filter((a) => a.value !== formik.values.primaryActivity).map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </Select>
      </Card>

      {/* Visuals */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiCamera} label="Identite visuelle" description="Logo et banniere affiches sur votre fiche publique." />

        {/* Logo */}
        <div>
          <p className="mb-3 text-sm font-bold">Logo</p>
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
                {formik.values.logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
              </Button>
              {formik.values.logoUrl ? (
                <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => formik.setFieldValue('logoUrl', '')}>
                  Supprimer
                </button>
              ) : null}
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" onChange={handleLogoFile} />
          {errorFor('logoUrl') ? <p className="mt-1 text-xs text-red-600">{errorFor('logoUrl')}</p> : null}
        </div>

        {/* Banner */}
        <div>
          <p className="mb-3 text-sm font-bold">Banniere de fond</p>
          {formik.values.bannerUrl ? (
            <div className="relative mb-3">
              <img src={formik.values.bannerUrl} alt="Banniere" className="h-32 w-full rounded-[1.5rem] object-cover shadow-md" />
              <button
                type="button"
                onClick={() => formik.setFieldValue('bannerUrl', '')}
                className="absolute right-3 top-3 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold text-white"
              >
                Supprimer
              </button>
            </div>
          ) : null}
          <Button type="button" variant="secondary" icon={FiImage} onClick={() => bannerInputRef.current?.click()}>
            {formik.values.bannerUrl ? 'Changer la banniere' : 'Ajouter une banniere'}
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
  return (
    <div className="grid gap-5">
      {/* Location */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiMapPin} label="Localisation" description="Ville et adresse de votre activite en Russie." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="business-country" label="Pays" value="Russie" disabled />
          <CitySelector
            id="business-city"
            label="Ville en Russie"
            value={formik.values.city}
            onChange={(city) => formik.setFieldValue('city', city)}
            error={errorFor('city')}
          />
        </div>
        <Input
          id="business-address"
          label="Adresse complete"
          placeholder="Rue, immeuble, metro ou repere"
          {...formik.getFieldProps('address')}
          error={errorFor('address')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="business-schedule-type"
            label="Horaires"
            value={formik.values.scheduleType}
            onChange={(event) => onScheduleChange(event.target.value)}
            error={errorFor('scheduleType')}
          >
            {BUSINESS_SCHEDULE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>{preset.label}</option>
            ))}
          </Select>
          <Input
            id="business-zones"
            label="Zones desservies"
            placeholder="Moscou, Saint-Petersbourg..."
            {...formik.getFieldProps('serviceZones')}
            error={errorFor('serviceZones')}
          />
        </div>
      </Card>

      {/* Phone & digital */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiPhone} label="Coordonnees" description="Moyens de contact visibles sur votre fiche publique." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Input
              id="business-phone"
              label="Numero russe"
              type="tel"
              placeholder={phonePlaceholder('RU')}
              {...formik.getFieldProps('phone')}
              error={errorFor('phone')}
            />
            <Button type="button" variant="secondary" onClick={onUseAccountPhone}>
              Utiliser mon numero du compte
            </Button>
          </div>
          <Input
            id="business-origin-phone"
            label="Numero du pays d origine"
            type="tel"
            placeholder={phonePlaceholder('BJ')}
            {...formik.getFieldProps('originPhone')}
            error={errorFor('originPhone')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="business-email"
            label="Email professionnel"
            type="email"
            placeholder="contact@monentreprise.com"
            {...formik.getFieldProps('email')}
            error={errorFor('email')}
          />
          <Input
            id="business-telegram"
            label="Telegram"
            placeholder="@username"
            {...formik.getFieldProps('telegram')}
            error={errorFor('telegram')}
          />
        </div>
        <Input
          id="business-website"
          label="Site web"
          placeholder="https://..."
          {...formik.getFieldProps('website')}
          error={errorFor('website')}
        />
      </Card>

      {/* Description */}
      <Card className="grid gap-5">
        <SectionTitle icon={FiGlobe} label="Presentation" description="Decrivez votre entreprise, votre specialite et votre zone d intervention." />
        <Input
          id="business-description"
          label="A propos de votre entreprise"
          placeholder="Nous proposons... Notre specialite est... Nous intervenons sur..."
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
  return (
    <div className="grid gap-5">
      <Card className="grid gap-4">
        <SectionTitle icon={FiZap} label="Modules actives" description="Definis automatiquement selon votre domaine principal." />
        <div className="flex flex-wrap gap-2">
          {serviceOptions.length ? (
            serviceOptions.map((service) => (
              <Badge key={service} tone={service === 'Transfert' ? 'success' : 'info'}>
                <FiCheckCircle className="mr-1 inline" />
                {service}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-[var(--app-text-muted)]">
              Selectionnez un domaine principal (etape 1) pour activer les modules.
            </p>
          )}
        </div>
        {errorFor('services') ? (
          <p className="text-xs text-red-600">{errorFor('services')}</p>
        ) : null}
      </Card>

      {hasTransfer ? (
        <Card className="grid gap-6">
          <SectionTitle icon={FiSettings} label="Configuration transfert" description="Les devises et reseaux suivent le pays d origine du createur de l entreprise." />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="business-fee"
              label="Frais (%)"
              type="number"
              step="0.1"
              {...formik.getFieldProps('feePercent')}
              error={errorFor('feePercent')}
            />
            <Input
              id="business-delay"
              label="Delai moyen"
              placeholder="Ex : 30-60 min"
              {...formik.getFieldProps('averageDelay')}
              error={errorFor('averageDelay')}
            />
          </div>

          <ChoiceGroup
            label="Devises echangees"
            values={formik.values.currencies}
            options={transferCurrencies}
            onToggle={(value) => toggleArrayField('currencies', value)}
            error={errorFor('currencies')}
          />

          <div>
            <p className="mb-1 text-sm font-semibold">Reseaux africains et banques russes</p>
            <p className="mb-3 text-xs text-[var(--app-text-muted)]">Cochez les modes de paiement que vous acceptez des deux cotes.</p>
            {/* Split African / Russian */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">Reseaux africains</p>
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
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">Banques russes</p>
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
  const experience = businessExperienceForActivity(formik.values.primaryActivity)
  const v = formik.values
  return (
    <div className="grid gap-5">
      {/* Identity */}
      <Card className="grid gap-4">
        <SectionTitle icon={FiUser} label="Identite" />
        <div className="flex items-center gap-4">
          {v.logoUrl ? (
            <img src={v.logoUrl} alt="Logo" className="size-16 rounded-2xl object-cover shadow ring-2 ring-[var(--app-border)]" />
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
          <img src={v.bannerUrl} alt="Banniere" className="h-20 w-full rounded-[1.4rem] object-cover shadow" />
        ) : null}
      </Card>

      {/* Contact */}
      <Card className="grid gap-3">
        <SectionTitle icon={FiMapPin} label="Contact" />
        <ReviewRow label="Ville" value={v.city} />
        <ReviewRow label="Adresse" value={v.address} />
        <ReviewRow label="Telephone russe" value={v.phone} />
        {v.originPhone ? <ReviewRow label="Telephone d origine" value={v.originPhone} /> : null}
        {v.email ? <ReviewRow label="Email" value={v.email} /> : null}
        {v.telegram ? <ReviewRow label="Telegram" value={v.telegram} /> : null}
        {v.website ? <ReviewRow label="Site web" value={v.website} /> : null}
        <ReviewRow label="Horaires" value={v.scheduleSummary || '—'} />
        <ReviewRow label="Zones" value={v.serviceZones || '—'} />
        {v.description ? (
          <div className="rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm text-[var(--app-text-muted)]">{v.description}</div>
        ) : null}
      </Card>

      {/* Services */}
      <Card className="grid gap-3">
        <SectionTitle icon={FiZap} label="Services" />
        <ReviewRow label="Modules" value={serviceOptions.join(', ') || 'Aucun'} />
        {hasTransfer ? (
          <>
            <ReviewRow label="Frais" value={`${v.feePercent}%`} />
            <ReviewRow label="Delai moyen" value={v.averageDelay} />
            <ReviewRow label="Devises" value={v.currencies.join(', ')} />
            <ReviewRow label="Reseaux & banques" value={v.exchangeMethods.join(', ')} />
          </>
        ) : null}
      </Card>

      <div className="flex items-start gap-3 rounded-[1.4rem] bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <FiSend className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
            Pret a envoyer pour validation
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
            Votre fiche sera examinee par un administrateur. Points forts mis en avant :{' '}
            {experience.spotlight.join(', ').toLowerCase()}.
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
  const { trigger, node } = useActionBurst()
  const experience = businessExperienceForActivity(business.primaryActivity)

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
            <FiBriefcase className="text-3xl" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/75">
            Félicitations
          </p>
          <h1 className="mt-2 font-display text-2xl font-black sm:text-3xl">
            Votre entreprise est créée
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/88">
            <strong>{business.name}</strong> est enregistrée sur MOXT. Notre équipe va valider votre
            fiche avant publication dans l&apos;annuaire — vous pouvez déjà préparer votre espace pro.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-4">
          <SectionTitle icon={FiUser} label="Récapitulatif" />
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
          <ReviewRow label="Ville" value={business.city} />
          <ReviewRow label="Téléphone" value={business.phone} />
          {business.email ? <ReviewRow label="E-mail" value={business.email} /> : null}
          <ReviewRow label="Horaires" value={business.scheduleSummary} />
          <ReviewRow label="Services" value={serviceOptions.join(', ')} />
          {hasTransfer ? (
            <>
              <ReviewRow label="Frais" value={`${business.feePercent}%`} />
              <ReviewRow label="Devises" value={(business.currencies || []).join(', ')} />
            </>
          ) : null}
        </Card>

        <div className="grid gap-4">
          <Card className="grid gap-3">
            <SectionTitle icon={FiCheckCircle} label="Prochaines étapes" />
            <ul className="grid gap-2 text-sm text-[var(--app-text-muted)]">
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                Validation administrateur (24–48 h en moyenne)
              </li>
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                Points forts : {experience.spotlight.join(', ').toLowerCase()}
              </li>
              <li className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2">
                Complétez votre espace pro pour accueillir vos premiers clients
              </li>
            </ul>
          </Card>

          <div className="grid gap-2">
            <Button className="w-full" icon={FiBriefcase} onClick={onGoProfessional}>
              Accéder à mon espace entreprise
            </Button>
            <Button className="w-full" variant="secondary" icon={FiShare2} onClick={onShare}>
              Partager sur le fil
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
