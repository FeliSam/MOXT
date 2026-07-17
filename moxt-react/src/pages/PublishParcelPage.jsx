import { useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBox,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiMapPin,
  FiPackage,
  FiUpload,
  FiX,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { storageService } from '../services/storageService'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AirportSelector } from '../components/ui/AirportSelector'
import { Button } from '../components/ui/Button'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { useActionBurst } from '../components/ui/ActionBurst'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { constrainRussianPhone, phonePlaceholder } from '../config/phone'
import { useGeographyOptions } from '../hooks/useGeographyOptions'
import { useScrollToTopOnStep } from '../hooks/useScrollToTopOnStep'
import { createParcel } from '../features/parcels/parcelSlice'
import {
  PARCEL_ACCEPTED_TYPES,
  PARCEL_PUBLISH_STEPS,
} from '../features/parcels/parcelPublishConfig'
import { BusinessPublishNotice } from '../features/businesses/BusinessPublishNotice'
import {
  isBusinessPublishReady,
  resolveBusinessPublishContext,
} from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'
import { createId } from '../services/createId'
import { SecurityGatePanel } from '../features/security/SecurityGatePanel'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { initialCatalogStatus } from '@moxt/shared/auth/userSecurity.js'
import { useLanguage } from '../contexts/useLanguage'
import {
  publishOptionLabel,
  publishOptionSub,
  publishText,
} from '../features/publications/publishI18n'

const STEPS = PARCEL_PUBLISH_STEPS

/* ─── Stepper ───────────────────────────────────────────────────────────── */
function Stepper({ step, onGoTo, t }) {
  return (
    <div className="relative flex items-start justify-between">
      <div className="absolute left-0 right-0 top-5 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-5 h-px bg-brand-600 transition-all duration-500"
        style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        aria-hidden
      />
      {STEPS.map((s, i) => {
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
            <span className={`text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'}`}>
              {publishText(t, s.labelKey)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
        <Icon className="text-base" />
      </span>
      <h2 className="font-black">{label}</h2>
    </div>
  )
}

export function PublishParcelPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { requirePublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const canPublishAsBusiness = isBusinessPublishReady(business)
  const { countries } = useGeographyOptions()

  const russiaName = publishText(t, 'publish.parcel.countries.russia')
  const beninName = publishText(t, 'publish.parcel.countries.benin')
  const RUSSIA = { code: 'RU', name: russiaName }

  // Pays d'origine de l'utilisateur (hors Russie)
  const originCountry = countries.find(
    (c) => c.code === (user.originCountry || (user.country !== 'RU' ? user.country : null)),
  )

  // Déduction du sens du voyage selon le pays de l'utilisateur
  const isInRussia = user.country === 'RU'
  const [direction, setDirection] = useState(isInRussia ? 'RU_TO_AFRICA' : 'AFRICA_TO_RU')
  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const [shareModal, setShareModal] = useState(null)
  const [errors, setErrors] = useState({})
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()

  const fromCountry =
    direction === 'RU_TO_AFRICA' ? RUSSIA : originCountry || { code: 'BJ', name: beninName }
  const toCountry =
    direction === 'RU_TO_AFRICA' ? originCountry || { code: 'BJ', name: beninName } : RUSSIA

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    originAirportCode: '',
    destinationAirportCode: '',
    departureDate: '',
    depositDeadline: '',
    distributionDate: '',
    capacityKg: 20,
    pricePerKg: 900,
    currency: 'RUB',
    maxWeightPerItem: '',
    acceptedTypes: [],
    rejectedTypes: '',
    conditions: publishText(t, 'publish.parcel.defaults.conditions'),
    contact: user.phone || '',
    publishAs: canPublishAsBusiness && business ? 'business' : 'person',
    travelProofFile: null,
  })
  const [proofError, setProofError] = useState('')

  async function handleProofFile(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setProofError(publishText(t, 'publish.parcel.toasts.fileTooLarge.inline'))
      dispatch(
        addToast({
          title: publishText(t, 'publish.parcel.toasts.fileTooLarge.title'),
          message: publishText(t, 'publish.parcel.toasts.fileTooLarge.message'),
          tone: 'warning',
        }),
      )
      return
    }
    setProofError('')
    set('travelProofFile', { name: file.name, size: file.size, type: file.type, uploading: true })
    try {
      const url = await storageService.uploadParcelProof(user.id, createId('DRAFT'), file)
      set('travelProofFile', { name: file.name, size: file.size, type: file.type, url })
      dispatch(
        addToast({
          title: publishText(t, 'publish.parcel.toasts.proofAdded.title'),
          message: publishText(t, 'publish.parcel.toasts.proofAdded.message'),
          tone: 'success',
        }),
      )
    } catch {
      setProofError(publishText(t, 'publish.parcel.toasts.uploadFailed.inline'))
      set('travelProofFile', null)
      dispatch(
        addToast({
          title: publishText(t, 'publish.parcel.toasts.uploadFailed.title'),
          message: publishText(t, 'publish.parcel.toasts.uploadFailed.message'),
          tone: 'error',
        }),
      )
    }
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function toggleType(value) {
    set(
      'acceptedTypes',
      form.acceptedTypes.includes(value)
        ? form.acceptedTypes.filter((item) => item !== value)
        : [...form.acceptedTypes, value],
    )
  }

  function validate(n) {
    const errs = {}
    if (n === 1) {
      if (!form.originAirportCode)
        errs.origin = publishText(t, 'publish.parcel.validation.originRequired')
      if (!form.destinationAirportCode)
        errs.destination = publishText(t, 'publish.parcel.validation.destinationRequired')
      const today = new Date().toISOString().slice(0, 10)
      if (!form.departureDate) {
        errs.departureDate = publishText(t, 'publish.parcel.validation.departureDateRequired')
      } else if (form.departureDate < today) {
        errs.departureDate = publishText(t, 'publish.parcel.validation.departureDatePast')
      }
      if (form.depositDeadline) {
        if (form.depositDeadline < today) {
          errs.depositDeadline = publishText(t, 'publish.parcel.validation.depositDeadlinePast')
        } else if (form.depositDeadline > form.departureDate) {
          errs.depositDeadline = publishText(
            t,
            'publish.parcel.validation.depositDeadlineAfterDeparture',
          )
        }
      }
      if (form.distributionDate) {
        if (form.departureDate && form.distributionDate < form.departureDate) {
          errs.distributionDate = publishText(
            t,
            'publish.parcel.validation.distributionAfterDeparture',
          )
        }
      } else {
        errs.distributionDate = publishText(t, 'publish.parcel.validation.distributionRequired')
      }
    }
    if (n === 2) {
      if (form.acceptedTypes.length === 0)
        errs.acceptedTypes = publishText(t, 'publish.parcel.validation.acceptedTypesRequired')
      if (!form.capacityKg || Number(form.capacityKg) <= 0)
        errs.capacityKg = publishText(t, 'publish.parcel.validation.capacityRequired')
      if (!form.pricePerKg || Number(form.pricePerKg) <= 0)
        errs.pricePerKg = publishText(t, 'publish.parcel.validation.priceRequired')
    }
    if (n === 3) {
      if (!form.contact.trim())
        errs.contact = publishText(t, 'publish.parcel.validation.contactRequired')
      if (!form.travelProofFile)
        errs.travelProofFile = publishText(t, 'publish.parcel.validation.travelProofRequired')
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(s + 1, STEPS.length))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 1))
  }

  function publish() {
    if (!requirePublish()) return
    if (!validate(3)) return
    const publishContext = resolveBusinessPublishContext({
      business,
      publishAsBusiness: form.publishAs === 'business',
    })
    if (publishContext.blocked) {
      dispatch(
        addToast({
          title: publishText(t, 'publish.common.toasts.businessBlockedTitle'),
          message: publishText(t, 'publish.parcel.toasts.businessBlockedMessage'),
          tone: 'error',
        }),
      )
      return
    }
    const { travelProofFile, ...rest } = form
    const action = dispatch(
      createParcel({
        ...rest,
        ownerId: user.id,
        ownerName: publishContext.useBusiness
          ? business.name
          : `${user.firstName} ${user.lastName}`,
        businessId: publishContext.businessId,
        fromCountry: fromCountry.code,
        toCountry: toCountry.code,
        originCountry: fromCountry.code,
        destinationCountry: toCountry.code,
        conditions: publishText(t, 'publish.parcel.conditionsAcceptedPrefix', {
          types: form.acceptedTypes.join(', '),
          conditions: form.conditions,
        }),
        travelProofName: travelProofFile.name,
        travelProofType: travelProofFile.type,
        travelProofSize: travelProofFile.size,
        travelProofUrl: travelProofFile.url || null,
        status: initialCatalogStatus(user),
      }),
    )
    triggerBurst()
    const live = action.payload?.status === 'active'
    dispatch(
      addToast({
        title: live
          ? publishText(t, 'publish.parcel.toasts.publishedTitle')
          : publishText(t, 'publish.parcel.toasts.pendingTitle'),
        message: live
          ? publishText(t, 'publish.parcel.toasts.publishedMessage')
          : publishText(t, 'publish.parcel.toasts.pendingMessage'),
        tone: 'success',
      }),
    )
    setShareModal({ sourceId: action.payload.id, sourceData: action.payload })
  }

  const africaFallback = publishText(t, 'publish.parcel.countries.africa')

  return (
    <SecurityGatePanel kind="publish" backTo="/parcels">
    <>
    {burstNode}
    {shareModal && (
      <ShareToFeedModal
        sourceType="parcel"
        sourceId={shareModal.sourceId}
        sourceData={shareModal.sourceData}
        onClose={() => { setShareModal(null); navigate('/parcels') }}
        onPublished={triggerBurst}
      />
    )}
    <div className="mx-auto grid max-w-2xl gap-7">
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/parcels')}>
          {publishText(t, 'publish.parcel.back')}
        </Button>
        <h1 className="text-xl font-black">{publishText(t, 'publish.parcel.title')}</h1>
      </div>

      <Card className="px-6 py-5">
        <Stepper step={step} onGoTo={setStep} t={t} />
      </Card>

      {/* Étape 1 — Trajet */}
      {step === 1 ? (
        <Card className="grid gap-5">
          <SectionTitle icon={FiMapPin} label={publishText(t, 'publish.parcel.direction.title')} />
          <p className="text-sm text-[var(--app-text-muted)]">
            {publishText(t, 'publish.parcel.direction.originPrefix')}{' '}
            <strong className="text-[var(--app-text)]">
              {originCountry?.name || publishText(t, 'publish.parcel.direction.notProvided')}
            </strong>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                value: 'RU_TO_AFRICA',
                from: publishText(t, 'publish.parcel.direction.fromRussia'),
                to: originCountry?.name || africaFallback,
                hint: publishText(t, 'publish.parcel.direction.hintRuToOrigin'),
                color: direction === 'RU_TO_AFRICA'
                  ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-950/40 dark:to-cyan-950/40'
                  : 'border-[var(--app-border)] hover:border-brand-400',
              },
              {
                value: 'AFRICA_TO_RU',
                from: originCountry?.name || africaFallback,
                to: publishText(t, 'publish.parcel.direction.toRussia'),
                hint: publishText(t, 'publish.parcel.direction.hintOriginToRu'),
                color: direction === 'AFRICA_TO_RU'
                  ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-950/40 dark:to-cyan-950/40'
                  : 'border-[var(--app-border)] hover:border-brand-400',
              },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setDirection(opt.value)
                  setForm((prev) => ({
                    ...prev,
                    origin: '',
                    destination: '',
                    originAirportCode: '',
                    destinationAirportCode: '',
                  }))
                }}
                className={`rounded-2xl border-2 p-5 text-left transition-all duration-200 ${opt.color}`}
              >
                <div className="flex items-center gap-2 text-base font-black">
                  <span>{opt.from}</span>
                  <FiArrowRight className="shrink-0 text-brand-600" />
                  <span>{opt.to}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--app-text-muted)]">{opt.hint}</p>
                {direction === opt.value ? (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold text-white">
                    <FiCheck className="text-[10px]" /> {publishText(t, 'publish.parcel.direction.selected')}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <Alert variant="info">
            {publishText(t, 'publish.parcel.alert.airportOnly')}
          </Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                {publishText(t, 'publish.parcel.fields.departureHeading', {
                  country: fromCountry.name,
                })}
              </p>
              <AirportSelector
                id="parcel-origin"
                label={publishText(t, 'publish.parcel.fields.originCity')}
                countryCode={fromCountry.code}
                value={form.originAirportCode}
                error={errors.origin}
                onChange={(airport) => {
                  set('origin', airport.city)
                  set('originAirportCode', airport.code)
                }}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                {publishText(t, 'publish.parcel.fields.arrivalHeading', {
                  country: toCountry.name,
                })}
              </p>
              <AirportSelector
                id="parcel-destination"
                label={publishText(t, 'publish.parcel.fields.destinationCity')}
                countryCode={toCountry.code}
                value={form.destinationAirportCode}
                error={errors.destination}
                onChange={(airport) => {
                  set('destination', airport.city)
                  set('destinationAirportCode', airport.code)
                }}
              />
            </div>
          </div>
          <div className="grid min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              id="parcel-date"
              label={publishText(t, 'publish.parcel.fields.departureDate')}
              type="date"
              wrapperClass="min-w-0 overflow-hidden"
              className="max-w-full [color-scheme:light] dark:[color-scheme:dark]"
              value={form.departureDate}
              onChange={(e) => set('departureDate', e.target.value)}
              error={errors.departureDate}
            />
            <Input
              id="parcel-deadline"
              label={publishText(t, 'publish.parcel.fields.depositDeadline')}
              type="date"
              wrapperClass="min-w-0 overflow-hidden"
              className="max-w-full [color-scheme:light] dark:[color-scheme:dark]"
              placeholder="jj/mm/aaaa"
              value={form.depositDeadline}
              onChange={(e) => set('depositDeadline', e.target.value)}
              error={errors.depositDeadline}
            />
            <Input
              id="parcel-distribution"
              label={publishText(t, 'publish.parcel.fields.distributionDate')}
              type="date"
              wrapperClass="min-w-0 overflow-hidden"
              className="max-w-full [color-scheme:light] dark:[color-scheme:dark]"
              value={form.distributionDate}
              onChange={(e) => set('distributionDate', e.target.value)}
              error={errors.distributionDate}
            />
          </div>
          <p className="text-xs text-[var(--app-text-muted)]">
            {publishText(t, 'publish.parcel.fields.distributionHint')}
          </p>
        </Card>
      ) : null}

      {/* Étape 2 — Colis acceptés */}
      {step === 2 ? (
        <Card className="grid gap-5">
          <SectionTitle
            icon={FiPackage}
            label={publishText(t, 'publish.parcel.fields.acceptedTypesTitle')}
          />
          <p className="text-sm text-[var(--app-text-muted)]">
            {publishText(t, 'publish.parcel.fields.acceptedTypesHint')}
          </p>
          {errors.acceptedTypes ? <Alert variant="error">{errors.acceptedTypes}</Alert> : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PARCEL_ACCEPTED_TYPES.map((typeItem) => {
              const sel = form.acceptedTypes.includes(typeItem.value)
              const Icon = typeItem.icon
              return (
                <button
                  key={typeItem.value}
                  type="button"
                  onClick={() => toggleType(typeItem.value)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                    sel
                      ? `border-transparent ${typeItem.color} ring-2 ring-current shadow-sm`
                      : 'border-[var(--app-border)] hover:border-[var(--app-accent)] hover:shadow-sm'
                  }`}
                >
                  <span className={`grid size-9 place-items-center rounded-xl ${sel ? 'bg-white/50 dark:bg-black/20' : 'bg-[var(--app-surface-muted)]'}`}>
                    <Icon className={`text-base ${sel ? '' : 'text-[var(--app-text-muted)]'}`} />
                  </span>
                  <div>
                    <p className={`text-xs font-black leading-tight ${sel ? '' : 'text-[var(--app-text)]'}`}>
                      {publishOptionLabel(t, typeItem)}
                    </p>
                    <p className={`mt-0.5 text-[10px] ${sel ? 'opacity-70' : 'text-[var(--app-text-muted)]'}`}>
                      {publishOptionSub(t, typeItem)}
                    </p>
                  </div>
                  {sel ? <FiCheck className="text-xs" /> : null}
                </button>
              )
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="parcel-capacity"
              label={publishText(t, 'publish.parcel.fields.capacityKg')}
              type="number"
              min="1"
              value={form.capacityKg}
              onChange={(e) => set('capacityKg', e.target.value)}
              error={errors.capacityKg}
            />
            <Input
              id="parcel-max-item"
              label={publishText(t, 'publish.parcel.fields.maxWeightPerItem')}
              type="number"
              min="0"
              placeholder={publishText(t, 'publish.parcel.fields.maxWeightPlaceholder')}
              value={form.maxWeightPerItem}
              onChange={(e) => set('maxWeightPerItem', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="parcel-price"
              label={publishText(t, 'publish.parcel.fields.pricePerKg')}
              type="number"
              value={form.pricePerKg}
              onChange={(e) => set('pricePerKg', e.target.value)}
              error={errors.pricePerKg}
            />
            <Input
              id="parcel-currency"
              label={publishText(t, 'publish.parcel.fields.currency')}
              value="RUB"
              disabled
            />
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.parcel.fields.rejectedTypes')}
            </span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              placeholder={publishText(t, 'publish.parcel.fields.rejectedTypesPlaceholder')}
              value={form.rejectedTypes}
              onChange={(e) => set('rejectedTypes', e.target.value)}
            />
          </label>
        </Card>
      ) : null}

      {/* Étape 3 — Conditions & contact */}
      {step === 3 ? (
        <Card className="grid gap-5">
          <SectionTitle
            icon={FiBox}
            label={publishText(t, 'publish.parcel.fields.conditionsTitle')}
          />
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.parcel.fields.travelProof')}
            </span>
            {form.travelProofFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40">
                  <FiFileText className="text-lg" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {(() => {
                      const name = form.travelProofFile.name
                      const dot = name.lastIndexOf('.')
                      const base = dot > 0 ? name.slice(0, dot) : name
                      const ext = dot > 0 ? name.slice(dot) : ''
                      return base.length > 28 ? `${base.slice(0, 28)}…${ext}` : name
                    })()}
                  </p>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {publishText(t, 'publish.parcel.fields.travelProofKb', {
                      size: Math.ceil(form.travelProofFile.size / 1024),
                    })}
                    {form.travelProofFile.uploading
                      ? ` · ${publishText(t, 'publish.parcel.fields.travelProofUploading')}`
                      : ` · ${publishText(t, 'publish.parcel.fields.travelProofReady')}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set('travelProofFile', null)}
                  aria-label={publishText(t, 'publish.parcel.fields.travelProofRemove')}
                  className="grid size-8 shrink-0 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-border)]"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--app-border)] px-4 text-sm font-bold text-[var(--app-text-muted)] transition hover:border-brand-400 hover:text-brand-700">
                <FiUpload /> {publishText(t, 'publish.parcel.fields.travelProofChoose')}
                <input
                  className="sr-only"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleProofFile(e.target.files?.[0])}
                />
              </label>
            )}
            {errors.travelProofFile || proofError ? (
              <p className="text-xs font-bold text-red-600">{errors.travelProofFile || proofError}</p>
            ) : (
              <p className="text-xs text-[var(--app-text-muted)]">
                {publishText(t, 'publish.parcel.fields.travelProofHint')}
              </p>
            )}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.parcel.fields.conditions')}
            </span>
            <textarea
              className="min-h-28 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              placeholder={publishText(t, 'publish.parcel.fields.conditionsPlaceholder')}
              value={form.conditions}
              onChange={(e) => set('conditions', e.target.value)}
            />
          </label>
          <Input
            id="parcel-contact"
            label={publishText(t, 'publish.parcel.fields.contact')}
            type="tel"
            placeholder={phonePlaceholder('RU')}
            value={form.contact}
            onChange={(e) => set('contact', constrainRussianPhone(e.target.value))}
            error={errors.contact}
          />
          {business ? (
            <>
              <BusinessPublishNotice business={business} />
              <Select
                id="parcel-publisher"
                label={publishText(t, 'publish.parcel.fields.publishAs')}
                value={form.publishAs}
                onChange={(e) => set('publishAs', e.target.value)}
              >
                {canPublishAsBusiness ? (
                  <option value="business">
                    {publishText(t, 'publish.parcel.fields.publishAsBusiness', {
                      name: business.name,
                    })}
                  </option>
                ) : null}
                <option value="person">
                  {publishText(t, 'publish.parcel.fields.publishAsPerson')}
                </option>
              </Select>
            </>
          ) : null}
        </Card>
      ) : null}

      {/* Étape 4 — Récapitulatif */}
      {step === 4 ? (
        <div className="grid gap-5">
          <Card className="grid gap-4">
            <SectionTitle
              icon={FiCheckCircle}
              label={publishText(t, 'publish.parcel.review.title')}
            />
            {[
              [
                publishText(t, 'publish.parcel.review.route'),
                `${form.origin} (${form.originAirportCode}) → ${form.destination} (${form.destinationAirportCode})`,
              ],
              [publishText(t, 'publish.parcel.review.departure'), form.departureDate],
              [publishText(t, 'publish.parcel.review.distribution'), form.distributionDate],
              [
                publishText(t, 'publish.parcel.review.capacity'),
                publishText(t, 'publish.parcel.review.capacityValue', { kg: form.capacityKg }),
              ],
              [
                publishText(t, 'publish.parcel.review.pricePerKg'),
                publishText(t, 'publish.parcel.review.priceValue', { price: form.pricePerKg }),
              ],
              [
                publishText(t, 'publish.parcel.review.acceptedTypes'),
                form.acceptedTypes
                  .map((v) =>
                    publishOptionLabel(
                      t,
                      PARCEL_ACCEPTED_TYPES.find((item) => item.value === v),
                    ),
                  )
                  .join(', '),
              ],
              [publishText(t, 'publish.parcel.review.contact'), form.contact],
              [
                publishText(t, 'publish.parcel.review.travelProof'),
                form.travelProofFile
                  ? publishText(t, 'publish.parcel.review.travelProofValue', {
                      name: form.travelProofFile.name,
                    })
                  : publishText(t, 'publish.common.emDash'),
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] px-4 py-3">
                <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
                <span className="text-right text-sm font-bold">
                  {value || publishText(t, 'publish.common.emDash')}
                </span>
              </div>
            ))}
          </Card>
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {publishText(t, 'publish.parcel.review.successHint')}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button variant="secondary" icon={FiArrowLeft} onClick={back}>
            {publishText(t, 'publish.common.previous')}
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length ? (
          <Button icon={FiArrowRight} onClick={next}>
            {publishText(t, 'publish.common.continue')}
          </Button>
        ) : (
          <Button icon={FiCheckCircle} onClick={publish}>
            {publishText(t, 'publish.parcel.nav.publish')}
          </Button>
        )}
      </div>
    </div>
    </>
    </SecurityGatePanel>
  )
}
