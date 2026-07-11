import { useState } from 'react'
import { PosterUploader } from '../components/ui/PosterUploader'
import { storageService } from '../services/storageService'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiBook,
  FiCheck,
  FiCheckCircle,
  FiCode,
  FiCoffee,
  FiDollarSign,
  FiGlobe,
  FiHeart,
  FiHome,
  FiMapPin,
  FiMic,
  FiShoppingBag,
  FiTrendingUp,
  FiTruck,
  FiTool,
  FiUsers,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { useActionBurst } from '../components/ui/ActionBurst'
import { CitySelector } from '../components/ui/CitySelector'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { JOB_CONTRACTS } from '../config/options'
import { createJob } from '../features/jobs/jobSlice'
import { useScrollToTopOnStep } from '../hooks/useScrollToTopOnStep'
import { BusinessPublishNotice } from '../features/businesses/BusinessPublishNotice'
import { isBusinessPublishReady } from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'

/* ─── Steps ─────────────────────────────────────────────────────────────── */
const STEPS = [
  { key: 'basics', label: "L'offre", icon: FiBriefcase },
  { key: 'details', label: 'Détails', icon: FiDollarSign },
  { key: 'location', label: 'Lieu', icon: FiMapPin },
  { key: 'review', label: 'Valider', icon: FiCheckCircle },
]

/* ─── Sectors with icons + colors ───────────────────────────────────────── */
const SECTORS = [
  { value: 'Technologie & informatique', label: 'Technologie', icon: FiCode, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  { value: 'Commerce & vente', label: 'Commerce', icon: FiShoppingBag, color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
  { value: 'Transport & logistique', label: 'Transport', icon: FiTruck, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  { value: 'Restauration & hôtellerie', label: 'Restauration', icon: FiCoffee, color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  { value: 'Enseignement & formation', label: 'Enseignement', icon: FiBook, color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  { value: 'Santé & bien-être', label: 'Santé', icon: FiHeart, color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
  { value: 'Bâtiment & travaux', label: 'Bâtiment', icon: FiTool, color: 'bg-stone-100 text-stone-700 dark:bg-stone-800/60 dark:text-stone-300' },
  { value: 'Services à la personne', label: 'Services', icon: FiUsers, color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' },
  { value: 'Finance & comptabilité', label: 'Finance', icon: FiTrendingUp, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { value: 'Arts & communication', label: 'Arts & Comm.', icon: FiMic, color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' },
  { value: 'Immobilier', label: 'Immobilier', icon: FiHome, color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300' },
  { value: 'Autre', label: 'Autre', icon: FiGlobe, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300' },
]

/* ─── Experience levels ──────────────────────────────────────────────────── */
const EXPERIENCE_LEVELS = [
  { value: 'none', label: 'Sans expérience', sub: 'Débutant bienvenu', dot: 'bg-emerald-500' },
  { value: 'junior', label: '1–2 ans', sub: 'Junior', dot: 'bg-blue-500' },
  { value: 'mid', label: '3–5 ans', sub: 'Confirmé', dot: 'bg-violet-500' },
  { value: 'senior', label: '5+ ans', sub: 'Expert', dot: 'bg-amber-500' },
]

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'ru', label: 'Russe' },
  { value: 'en', label: 'Anglais' },
  { value: 'fr_ru', label: 'Français + Russe' },
]

/* ─── Visual Stepper ────────────────────────────────────────────────────── */
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
            <span
              className={`text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'}`}
            >
              {s.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export function PublishJobPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const eligibleBusiness =
    isBusinessPublishReady(business) && business?.services?.includes('Jobs')

  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const [errors, setErrors] = useState({})
  const [shareModal, setShareModal] = useState(null)
  const [photos, setPhotos] = useState([])
  const [publishing, setPublishing] = useState(false)

  function addPhotos(files) {
    const added = Array.from(files)
      .slice(0, 5 - photos.length)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ file, url: URL.createObjectURL(file), name: file.name }))
    setPhotos((current) => [...current, ...added])
  }
  function removePhoto(index) {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].url)
      return current.filter((_, idx) => idx !== index)
    })
  }
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()
  const [form, setForm] = useState({
    title: '',
    sector: '',
    contractType: 'full_time',
    experienceLevel: 'none',
    language: 'fr_ru',
    salary: '',
    salaryPeriod: 'month',
    description: '',
    requirements: '',
    benefits: '',
    location: user.city || 'Moscou',
    remote: false,
    startDate: '',
    applicationDeadline: '',
    publisherType: 'personal',
    publisherName: `${user.firstName} ${user.lastName}`,
  })

  function set(f, v) {
    setForm((p) => ({ ...p, [f]: v }))
    setErrors((p) => ({ ...p, [f]: undefined }))
  }

  function validate(n) {
    const errs = {}
    if (n === 1) {
      if (!form.title.trim()) errs.title = 'Intitulé du poste obligatoire.'
      if (!form.sector) errs.sector = 'Secteur obligatoire.'
    }
    if (n === 2) {
      if (!form.description.trim() || form.description.trim().length < 30)
        errs.description = 'Description trop courte (30 caractères min).'
      if (!form.salary.trim()) errs.salary = 'Rémunération obligatoire.'
    }
    if (n === 3) {
      if (!form.location.trim()) errs.location = 'Lieu obligatoire.'
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

  async function publish() {
    if (!validate(3)) return
    if (form.publisherType === 'business' && !eligibleBusiness) {
      dispatch(
        addToast({
          title: 'Publication entreprise impossible',
          message:
            'Votre entreprise doit être vérifiée et disposer du module Jobs avant publication.',
          tone: 'error',
        }),
      )
      return
    }
    const publishAsBusiness = form.publisherType === 'business' && eligibleBusiness
    setPublishing(true)
    let images = []
    try {
      if (photos.length) {
        images = await storageService.uploadJobImages(
          user.id,
          Date.now().toString(36),
          photos.map((photo) => photo.file),
        )
      }
    } catch (error) {
      setPublishing(false)
      dispatch(
        addToast({ title: 'Images non envoyées', message: error.message || 'Réessayez.', tone: 'error' }),
      )
      return
    }
    const action = dispatch(
      createJob({
        ...form,
        images,
        salary: form.salary.toUpperCase().includes('RUB') ? form.salary : `${form.salary} RUB`,
        ownerId: user.id,
        publisherName: publishAsBusiness ? business.name : `${user.firstName} ${user.lastName}`,
        businessId: publishAsBusiness ? business.id : null,
      }),
    )
    setPublishing(false)
    triggerBurst()
    dispatch(addToast({ title: 'Offre publiée', message: 'Votre offre est en ligne.', tone: 'success' }))
    setShareModal({ sourceId: action.payload.id, sourceData: action.payload })
  }

  const selectedSector = SECTORS.find((s) => s.value === form.sector)

  return (
    <>
    {burstNode}
    {shareModal && (
      <ShareToFeedModal
        sourceType="job"
        sourceId={shareModal.sourceId}
        sourceData={shareModal.sourceData}
        onClose={() => { setShareModal(null); navigate('/jobs') }}
        onPublished={triggerBurst}
      />
    )}
    <div className="mx-auto grid max-w-2xl gap-7">
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/jobs')}>
          Jobs
        </Button>
        <h1 className="text-xl font-black">Publier une offre d'emploi</h1>
      </div>

      <Card className="px-6 py-5">
        <Stepper step={step} onGoTo={setStep} />
      </Card>

      {/* ── Étape 1 ─────────────────────────────────────────────────────── */}
      {step === 1 ? (
        <div className="grid gap-5">
          <Card className="grid gap-5">
            <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <FiBriefcase />
              </span>
              <h2 className="font-black">Poste et domaine</h2>
            </div>
            <Input
              id="job-title"
              label="Intitulé du poste"
              placeholder="Ex : Développeur web, Professeur de français, Cuisinier…"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
            />

            {/* Sector visual grid */}
            <div>
              <p className="mb-3 text-sm font-bold">Secteur d'activité</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {SECTORS.map((sector) => {
                  const Icon = sector.icon
                  const active = form.sector === sector.value
                  return (
                    <button
                      key={sector.value}
                      type="button"
                      onClick={() => set('sector', sector.value)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all duration-200 ${
                        active
                          ? `border-transparent ${sector.color} ring-2 ring-current shadow-sm`
                          : 'border-[var(--app-border)] hover:border-[var(--app-accent)] hover:shadow-sm'
                      }`}
                    >
                      <span className={`grid size-8 place-items-center rounded-xl ${active ? '' : 'bg-[var(--app-surface-muted)]'}`}>
                        <Icon className={`text-base ${active ? '' : 'text-[var(--app-text-muted)]'}`} />
                      </span>
                      <span className={`text-[10px] font-black leading-tight ${active ? '' : 'text-[var(--app-text-muted)]'}`}>
                        {sector.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              {errors.sector ? <p className="mt-2 text-xs text-red-600">{errors.sector}</p> : null}
              {selectedSector ? (
                <p className="mt-2 text-xs text-[var(--app-text-muted)]">
                  Secteur sélectionné : <strong>{selectedSector.value}</strong>
                </p>
              ) : null}
            </div>
          </Card>

          {/* Contract type pills */}
          <Card className="grid gap-5">
            <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <FiUsers />
              </span>
              <h2 className="font-black">Type de contrat et langue</h2>
            </div>
            <div>
              <p className="mb-3 text-sm font-bold">Type de contrat</p>
              <div className="flex flex-wrap gap-2">
                {JOB_CONTRACTS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('contractType', c.value)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      form.contractType === c.value
                        ? 'bg-brand-700 text-white shadow-sm'
                        : 'bg-[var(--app-surface-muted)] text-[var(--app-text)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience scale */}
            <div>
              <p className="mb-3 text-sm font-bold">Expérience requise</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => set('experienceLevel', level.value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all ${
                      form.experienceLevel === level.value
                        ? 'border-brand-500 bg-[var(--app-accent-soft)]'
                        : 'border-[var(--app-border)] hover:border-brand-300'
                    }`}
                  >
                    <span className={`size-3 rounded-full ${level.dot}`} />
                    <span className="text-xs font-black">{level.label}</span>
                    <span className="text-[10px] text-[var(--app-text-muted)]">{level.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <Select
              id="job-lang"
              label="Langue de travail"
              value={form.language}
              onChange={(e) => set('language', e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </Select>
          </Card>
        </div>
      ) : null}

      {/* ── Étape 2 ─────────────────────────────────────────────────────── */}
      {step === 2 ? (
        <Card className="grid gap-5">
          <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiDollarSign />
            </span>
            <h2 className="font-black">Détails du poste</h2>
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              Description <span className="font-normal text-[var(--app-text-muted)]">(min. 30 car.)</span>
            </span>
            <textarea
              className="min-h-32 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder="Missions, responsabilités, contexte de l'équipe…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
            {errors.description ? <span className="text-xs text-red-600">{errors.description}</span> : null}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Profil recherché</span>
            <textarea
              className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder="Compétences, diplômes, qualités attendues…"
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Avantages (optionnel)</span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder="Logement, repas, transport, prime…"
              value={form.benefits}
              onChange={(e) => set('benefits', e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="job-salary"
              label="Rémunération"
              placeholder="Ex : 95 000 RUB"
              value={form.salary}
              onChange={(e) => set('salary', e.target.value)}
              error={errors.salary}
            />
            <Select
              id="job-salary-period"
              label="Période"
              value={form.salaryPeriod}
              onChange={(e) => set('salaryPeriod', e.target.value)}
            >
              <option value="hour">Par heure</option>
              <option value="day">Par jour</option>
              <option value="month">Par mois</option>
              <option value="project">Par projet</option>
            </Select>
          </div>
        </Card>
      ) : null}

      {/* ── Étape 3 ─────────────────────────────────────────────────────── */}
      {step === 3 ? (
        <Card className="grid gap-5">
          <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiMapPin />
            </span>
            <h2 className="font-black">Lieu et modalités</h2>
          </div>
          <CitySelector
            id="job-location"
            label="Ville / Lieu"
            value={form.location}
            onChange={(city) => set('location', city)}
            error={errors.location}
          />
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--app-border)] p-4 transition hover:border-brand-400">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => set('remote', e.target.checked)}
              className="size-5 accent-brand-700"
            />
            <div>
              <p className="text-sm font-bold">Télétravail possible</p>
              <p className="text-xs text-[var(--app-text-muted)]">Le poste peut être exercé à distance</p>
            </div>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="job-start"
              label="Date de début (optionnel)"
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
            <Input
              id="job-deadline"
              label="Date limite candidature"
              type="date"
              value={form.applicationDeadline}
              onChange={(e) => set('applicationDeadline', e.target.value)}
            />
          </div>
          <PosterUploader
            photos={photos}
            onAdd={addPhotos}
            onRemove={removePhoto}
            label="Affiches de l’offre (optionnel)"
            hint="Ajoutez une ou plusieurs images (logo, affiche, visuel). La première sert d’image principale."
          />
          {business ? <BusinessPublishNotice business={business} className="mb-1" /> : null}
          <Select
            id="job-publisher"
            label="Profil de publication"
            value={form.publisherType}
            onChange={(event) => {
              const publisherType = event.target.value
              set('publisherType', publisherType)
              set(
                'publisherName',
                publisherType === 'business'
                  ? business.name
                  : `${user.firstName} ${user.lastName}`,
              )
            }}
          >
            <option value="personal">
              Profil personnel · {user.firstName} {user.lastName}
            </option>
            {eligibleBusiness ? (
              <option value="business">Entreprise · {business.name}</option>
            ) : null}
          </Select>
          <p className="text-xs leading-5 text-[var(--app-text-muted)]">
            Toute personne peut publier une offre. L’association à une entreprise est facultative.
          </p>
        </Card>
      ) : null}

      {/* ── Étape 4 — Récapitulatif ──────────────────────────────────────── */}
      {step === 4 ? (
        <div className="grid gap-5">
          <Card className="grid gap-4">
            <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <FiCheckCircle />
              </span>
              <h2 className="font-black">Récapitulatif</h2>
            </div>
            {[
              ['Poste', form.title],
              ['Secteur', form.sector],
              ['Contrat', JOB_CONTRACTS.find((c) => c.value === form.contractType)?.label],
              ['Rémunération', `${form.salary} / ${form.salaryPeriod}`],
              ['Lieu', form.location + (form.remote ? ' · Télétravail possible' : '')],
              ['Publié par', form.publisherName],
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
              Votre offre sera visible immédiatement dans la section Jobs. Vous pourrez la modifier depuis votre espace professionnel.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button variant="secondary" icon={FiArrowLeft} onClick={back}>Précédent</Button>
        ) : (
          <span />
        )}
        {step < STEPS.length ? (
          <Button icon={FiArrowRight} onClick={next}>Continuer</Button>
        ) : (
          <Button icon={FiCheckCircle} onClick={publish} loading={publishing} disabled={publishing}>Publier l'offre</Button>
        )}
      </div>
    </div>
    </>
  )
}
