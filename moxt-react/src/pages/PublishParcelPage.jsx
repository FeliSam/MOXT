import { useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBox,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiGift,
  FiHeart,
  FiMapPin,
  FiMonitor,
  FiPackage,
  FiShoppingBag,
  FiUpload,
  FiUsers,
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
import { BusinessPublishNotice } from '../features/businesses/BusinessPublishNotice'
import {
  isBusinessPublishReady,
  resolveBusinessPublishContext,
} from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'
import { createId } from '../services/createId'
import { SecurityGatePanel } from '../features/security/SecurityGatePanel'
import { useSecurityGate } from '../features/security/useSecurityGate'

const STEPS = [
  { key: 'route', label: 'Trajet', icon: FiMapPin },
  { key: 'cargo', label: 'Colis', icon: FiPackage },
  { key: 'terms', label: 'Conditions', icon: FiBox },
  { key: 'review', label: 'Valider', icon: FiCheckCircle },
]

const RUSSIA = { code: 'RU', name: 'Russie' }

/* ─── Stepper ───────────────────────────────────────────────────────────── */
function Stepper({ step, onGoTo }) {
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
              {s.label}
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
  const { requirePublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const canPublishAsBusiness = isBusinessPublishReady(business)
  const { countries } = useGeographyOptions()

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
    direction === 'RU_TO_AFRICA' ? RUSSIA : originCountry || { code: 'BJ', name: 'Bénin' }
  const toCountry =
    direction === 'RU_TO_AFRICA' ? originCountry || { code: 'BJ', name: 'Bénin' } : RUSSIA

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
    conditions:
      'Objets autorisés uniquement après vérification. Photos demandées avant acceptation.',
    contact: user.phone || '',
    publishAs: canPublishAsBusiness && business ? 'business' : 'person',
    travelProofFile: null,
  })
  const [proofError, setProofError] = useState('')

  async function handleProofFile(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setProofError('Le fichier ne doit pas dépasser 5 Mo.')
      dispatch(
        addToast({
          title: 'Fichier trop volumineux',
          message: 'La preuve de voyage ne doit pas dépasser 5 Mo.',
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
          title: 'Preuve ajoutée',
          message: 'Le document de voyage a été envoyé.',
          tone: 'success',
        }),
      )
    } catch {
      setProofError('Échec de l\'envoi du fichier. Réessayez.')
      set('travelProofFile', null)
      dispatch(
        addToast({
          title: 'Envoi impossible',
          message: "La preuve de voyage n'a pas pu être envoyée.",
          tone: 'error',
        }),
      )
    }
  }

  const ACCEPTED_TYPES = [
    { value: 'clothes', label: 'Vêtements', sub: '& textile', icon: FiShoppingBag, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
    { value: 'food', label: 'Alimentaire', sub: 'Produits frais / secs', icon: FiBox, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    { value: 'electronics', label: 'Électronique', sub: 'Appareils & acc.', icon: FiMonitor, color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
    { value: 'documents', label: 'Documents', sub: 'Papiers & courrier', icon: FiFileText, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    { value: 'cosmetics', label: 'Cosmétiques', sub: 'Beauté & soins', icon: FiHeart, color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
    { value: 'gifts', label: 'Cadeaux', sub: 'Divers & objets', icon: FiGift, color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' },
    { value: 'medicine', label: 'Médicaments', sub: 'Déclarés uniquement', icon: FiUsers, color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' },
  ]

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function toggleType(value) {
    set(
      'acceptedTypes',
      form.acceptedTypes.includes(value)
        ? form.acceptedTypes.filter((t) => t !== value)
        : [...form.acceptedTypes, value],
    )
  }

  function validate(n) {
    const errs = {}
    if (n === 1) {
      if (!form.originAirportCode) errs.origin = 'Ville de départ (aéroport) obligatoire.'
      if (!form.destinationAirportCode) errs.destination = 'Ville de destination (aéroport) obligatoire.'
      const today = new Date().toISOString().slice(0, 10)
      if (!form.departureDate) {
        errs.departureDate = 'Date de départ obligatoire.'
      } else if (form.departureDate < today) {
        errs.departureDate = 'La date de départ ne peut pas être antérieure à aujourd\'hui.'
      }
      if (form.depositDeadline) {
        if (form.depositDeadline < today) {
          errs.depositDeadline = 'La date limite de dépôt ne peut pas être dans le passé.'
        } else if (form.depositDeadline > form.departureDate) {
          errs.depositDeadline = 'La date limite de dépôt ne peut pas dépasser la date de départ.'
        }
      }
      if (form.distributionDate) {
        if (form.departureDate && form.distributionDate < form.departureDate) {
          errs.distributionDate =
            'La date de distribution doit être à partir de la date de départ.'
        }
      } else {
        errs.distributionDate = 'Date de distribution / récupération obligatoire.'
      }
    }
    if (n === 2) {
      if (form.acceptedTypes.length === 0) errs.acceptedTypes = 'Sélectionnez au moins un type.'
      if (!form.capacityKg || Number(form.capacityKg) <= 0)
        errs.capacityKg = 'Capacité obligatoire.'
      if (!form.pricePerKg || Number(form.pricePerKg) <= 0) errs.pricePerKg = 'Prix obligatoire.'
    }
    if (n === 3) {
      if (!form.contact.trim()) errs.contact = 'Contact obligatoire.'
      if (!form.travelProofFile)
        errs.travelProofFile = 'Une preuve de voyage est obligatoire (billet, réservation...).'
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
          title: 'Publication entreprise impossible',
          message:
            'Votre entreprise doit être vérifiée par MOXT avant de publier au nom de l’entreprise.',
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
        conditions: `Types acceptés : ${form.acceptedTypes.join(', ')}. ${form.conditions}`,
        travelProofName: travelProofFile.name,
        travelProofType: travelProofFile.type,
        travelProofSize: travelProofFile.size,
        travelProofUrl: travelProofFile.url || null,
      }),
    )
    triggerBurst()
    dispatch(addToast({ title: 'Voyage publié', message: 'Votre voyage est en ligne.', tone: 'success' }))
    setShareModal({ sourceId: action.payload.id, sourceData: action.payload })
  }

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
          Colis
        </Button>
        <h1 className="text-xl font-black">Publier un voyage</h1>
      </div>

      <Card className="px-6 py-5">
        <Stepper step={step} onGoTo={setStep} />
      </Card>

      {/* Étape 1 — Trajet */}
      {step === 1 ? (
        <Card className="grid gap-5">
          <SectionTitle icon={FiMapPin} label="Sens du voyage" />
          <p className="text-sm text-[var(--app-text-muted)]">
            La Russie est toujours le point de départ ou d'arrivée. Votre pays d'origine :{' '}
            <strong className="text-[var(--app-text)]">{originCountry?.name || 'non renseigné'}</strong>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                value: 'RU_TO_AFRICA',
                from: '🇷🇺 Russie',
                to: originCountry?.name || 'Afrique',
                hint: "Je voyage de Russie vers mon pays d'origine",
                color: direction === 'RU_TO_AFRICA'
                  ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-950/40 dark:to-cyan-950/40'
                  : 'border-[var(--app-border)] hover:border-brand-400',
              },
              {
                value: 'AFRICA_TO_RU',
                from: originCountry?.name || 'Afrique',
                to: '🇷🇺 Russie',
                hint: "Je voyage de mon pays d'origine vers la Russie",
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
                    <FiCheck className="text-[10px]" /> Sélectionné
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <Alert variant="info">
            Seules les villes disposant d'un aéroport sont proposées : le transport se fait par
            avion.
          </Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                Départ · {fromCountry.name}
              </p>
              <AirportSelector
                id="parcel-origin"
                label="Ville de départ"
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
                Arrivée · {toCountry.name}
              </p>
              <AirportSelector
                id="parcel-destination"
                label="Ville d'arrivée"
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              id="parcel-date"
              label="Date de départ"
              type="date"
              value={form.departureDate}
              onChange={(e) => set('departureDate', e.target.value)}
              error={errors.departureDate}
            />
            <Input
              id="parcel-deadline"
              label="Date limite de dépôt (optionnel)"
              type="date"
              placeholder="jj/mm/aaaa"
              value={form.depositDeadline}
              onChange={(e) => set('depositDeadline', e.target.value)}
              error={errors.depositDeadline}
            />
            <Input
              id="parcel-distribution"
              label="Date de distribution / récupération"
              type="date"
              value={form.distributionDate}
              onChange={(e) => set('distributionDate', e.target.value)}
              error={errors.distributionDate}
            />
          </div>
          <p className="text-xs text-[var(--app-text-muted)]">
            La date de distribution indique quand les destinataires pourront commencer à récupérer
            leur colis à l&apos;arrivée.
          </p>
        </Card>
      ) : null}

      {/* Étape 2 — Colis acceptés */}
      {step === 2 ? (
        <Card className="grid gap-5">
          <SectionTitle icon={FiPackage} label="Types de colis acceptés" />
          <p className="text-sm text-[var(--app-text-muted)]">
            Sélectionnez tout ce que vous acceptez de transporter. Plusieurs choix possibles.
          </p>
          {errors.acceptedTypes ? <Alert variant="error">{errors.acceptedTypes}</Alert> : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACCEPTED_TYPES.map((t) => {
              const sel = form.acceptedTypes.includes(t.value)
              const Icon = t.icon
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleType(t.value)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                    sel
                      ? `border-transparent ${t.color} ring-2 ring-current shadow-sm`
                      : 'border-[var(--app-border)] hover:border-[var(--app-accent)] hover:shadow-sm'
                  }`}
                >
                  <span className={`grid size-9 place-items-center rounded-xl ${sel ? 'bg-white/50 dark:bg-black/20' : 'bg-[var(--app-surface-muted)]'}`}>
                    <Icon className={`text-base ${sel ? '' : 'text-[var(--app-text-muted)]'}`} />
                  </span>
                  <div>
                    <p className={`text-xs font-black leading-tight ${sel ? '' : 'text-[var(--app-text)]'}`}>{t.label}</p>
                    <p className={`mt-0.5 text-[10px] ${sel ? 'opacity-70' : 'text-[var(--app-text-muted)]'}`}>{t.sub}</p>
                  </div>
                  {sel ? <FiCheck className="text-xs" /> : null}
                </button>
              )
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="parcel-capacity"
              label="Capacité totale (kg)"
              type="number"
              min="1"
              value={form.capacityKg}
              onChange={(e) => set('capacityKg', e.target.value)}
              error={errors.capacityKg}
            />
            <Input
              id="parcel-max-item"
              label="Poids max par colis (kg, optionnel)"
              type="number"
              min="0"
              placeholder="Ex : 5"
              value={form.maxWeightPerItem}
              onChange={(e) => set('maxWeightPerItem', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="parcel-price"
              label="Prix par kg"
              type="number"
              value={form.pricePerKg}
              onChange={(e) => set('pricePerKg', e.target.value)}
              error={errors.pricePerKg}
            />
            <Input id="parcel-currency" label="Devise" value="RUB" disabled />
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Types refusés / restrictions (optionnel)</span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              placeholder="Ex : Pas de liquides, pas de matières dangereuses..."
              value={form.rejectedTypes}
              onChange={(e) => set('rejectedTypes', e.target.value)}
            />
          </label>
        </Card>
      ) : null}

      {/* Étape 3 — Conditions & contact */}
      {step === 3 ? (
        <Card className="grid gap-5">
          <SectionTitle icon={FiBox} label="Conditions et contact" />
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Preuve de voyage (billet, réservation...)</span>
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
                    {Math.ceil(form.travelProofFile.size / 1024)} Ko
                    {form.travelProofFile.uploading ? ' · Envoi…' : ' · Prêt'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set('travelProofFile', null)}
                  aria-label="Retirer le fichier"
                  className="grid size-8 shrink-0 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-border)]"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--app-border)] px-4 text-sm font-bold text-[var(--app-text-muted)] transition hover:border-brand-400 hover:text-brand-700">
                <FiUpload /> Choisir un fichier (PDF ou image)
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
                Visible uniquement par l'équipe MOXT pour vérification, jamais publié publiquement.
                5 Mo max.
              </p>
            )}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Conditions de transport</span>
            <textarea
              className="min-h-28 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              placeholder="Photos demandées, emballage requis, modalités de remise..."
              value={form.conditions}
              onChange={(e) => set('conditions', e.target.value)}
            />
          </label>
          <Input
            id="parcel-contact"
            label="Téléphone de contact (russe)"
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
                label="Publier en tant que"
                value={form.publishAs}
                onChange={(e) => set('publishAs', e.target.value)}
              >
                {canPublishAsBusiness ? (
                  <option value="business">{business.name} (entreprise)</option>
                ) : null}
                <option value="person">Particulier</option>
              </Select>
            </>
          ) : null}
        </Card>
      ) : null}

      {/* Étape 4 — Récapitulatif */}
      {step === 4 ? (
        <div className="grid gap-5">
          <Card className="grid gap-4">
            <SectionTitle icon={FiCheckCircle} label="Récapitulatif" />
            {[
              [
                'Trajet',
                `${form.origin} (${form.originAirportCode}) → ${form.destination} (${form.destinationAirportCode})`,
              ],
              ['Départ', form.departureDate],
              ['Distribution / récupération', form.distributionDate],
              ['Capacité totale', `${form.capacityKg} kg`],
              ['Prix / kg', `${form.pricePerKg} RUB`],
              ['Types acceptés', form.acceptedTypes.map((v) => ACCEPTED_TYPES.find((t) => t.value === v)?.label).join(', ')],
              ['Contact', form.contact],
              ['Preuve de voyage', form.travelProofFile ? `${form.travelProofFile.name} ✓` : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] px-4 py-3">
                <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
                <span className="text-right text-sm font-bold">{value || '—'}</span>
              </div>
            ))}
          </Card>
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Votre voyage sera visible immédiatement dans la section Colis. Les expéditeurs pourront vous contacter directement.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button variant="secondary" icon={FiArrowLeft} onClick={back}>
            Précédent
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length ? (
          <Button icon={FiArrowRight} onClick={next}>
            Continuer
          </Button>
        ) : (
          <Button icon={FiCheckCircle} onClick={publish}>
            Publier le voyage
          </Button>
        )}
      </div>
    </div>
    </>
    </SecurityGatePanel>
  )
}
