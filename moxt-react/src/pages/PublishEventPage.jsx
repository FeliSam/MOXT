import { useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiGlobe,
  FiHeart,
  FiMapPin,
  FiMic,
  FiUsers,
  FiWifi,
  FiBookOpen,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { useActionBurst } from '../components/ui/ActionBurst'
import { CitySelector } from '../components/ui/CitySelector'
import { Input } from '../components/ui/Input'
import { EVENT_CATEGORIES } from '../config/options'
import { createEvent } from '../features/events/eventSlice'
import { isBusinessPublishReady } from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'

/* ─── Steps ─────────────────────────────────────────────────────────────── */
const STEPS = [
  { key: 'basics', label: "L'événement", icon: FiCalendar },
  { key: 'details', label: 'Programme', icon: FiMic },
  { key: 'location', label: 'Lieu & accès', icon: FiMapPin },
  { key: 'review', label: 'Valider', icon: FiCheckCircle },
]

/* ─── Format options ─────────────────────────────────────────────────────── */
const FORMAT_OPTIONS = [
  {
    value: 'in_person',
    label: 'Présentiel',
    sub: 'Lieu physique requis',
    icon: FiMapPin,
    color: 'bg-emerald-50 text-emerald-700 ring-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    value: 'online',
    label: 'En ligne',
    sub: 'Lien de connexion requis',
    icon: FiWifi,
    color: 'bg-blue-50 text-blue-700 ring-blue-500 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'hybrid',
    label: 'Hybride',
    sub: 'Présentiel + streaming',
    icon: FiGlobe,
    color: 'bg-violet-50 text-violet-700 ring-violet-500 dark:bg-violet-950/40 dark:text-violet-300',
  },
]

/* ─── Category icons ────────────────────────────────────────────────────── */
const CAT_ICONS = {
  networking: FiUsers,
  training: FiBookOpen,
  culture: FiMic,
  business: FiBriefcase,
  community: FiHeart,
}

const CAT_COLORS = {
  networking: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  training: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  culture: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  business: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  community: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
}

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

/* ─── Page ───────────────────────────────────────────────────────────────── */
export function PublishEventPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const canPublishAsBusiness = isBusinessPublishReady(business)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [shareModal, setShareModal] = useState(null)
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()
  const [form, setForm] = useState({
    title: '',
    category: '',
    format: 'in_person',
    language: 'fr',
    description: '',
    program: '',
    speakers: '',
    startAt: '',
    endAt: '',
    registrationDeadline: '',
    city: user.city || 'Moscou',
    venue: '',
    address: '',
    onlineLink: '',
    capacity: 50,
    price: 0,
    currency: 'RUB',
    freeEntry: true,
    organizerName: business?.name || `${user.firstName} ${user.lastName}`,
    organizerContact: user.phone || '',
  })

  function set(f, v) {
    setForm((p) => ({ ...p, [f]: v }))
    setErrors((p) => ({ ...p, [f]: undefined }))
  }

  function validate(n) {
    const errs = {}
    if (n === 1) {
      if (!form.title.trim()) errs.title = "Titre de l'événement obligatoire."
      if (!form.category) errs.category = 'Catégorie obligatoire.'
      if (!form.startAt) errs.startAt = 'Date de début obligatoire.'
    }
    if (n === 2) {
      if (!form.description.trim() || form.description.trim().length < 20)
        errs.description = 'Description trop courte.'
    }
    if (n === 3) {
      if (form.format !== 'online' && !form.venue.trim()) errs.venue = 'Lieu obligatoire.'
      if (form.format === 'online' && !form.onlineLink.trim()) errs.onlineLink = 'Lien obligatoire.'
      if (!form.city.trim()) errs.city = 'Ville obligatoire.'
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
    if (!validate(3)) return
    const action = dispatch(
      createEvent({
        ...form,
        ownerId: user.id,
        organizerName: canPublishAsBusiness ? business.name : form.organizerName,
        businessId: canPublishAsBusiness ? business.id : null,
        price: form.freeEntry ? 0 : Number(form.price),
      }),
    )
    triggerBurst()
    dispatch(addToast({ title: 'Événement publié', message: 'Votre événement est en ligne.', tone: 'success' }))
    setShareModal({ sourceId: action.payload.id, sourceData: action.payload })
  }

  const selectedFormat = FORMAT_OPTIONS.find((f) => f.value === form.format)
  const selectedCategory = EVENT_CATEGORIES.find((c) => c.value === form.category)

  return (
    <>
    {burstNode}
    {shareModal && (
      <ShareToFeedModal
        sourceType="event"
        sourceId={shareModal.sourceId}
        sourceData={shareModal.sourceData}
        onClose={() => { setShareModal(null); navigate('/events') }}
        onPublished={triggerBurst}
      />
    )}
    <div className="mx-auto grid max-w-2xl gap-7">
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/events')}>
          Événements
        </Button>
        <h1 className="text-xl font-black">Créer un événement</h1>
      </div>

      <Card className="px-6 py-5">
        <Stepper step={step} onGoTo={setStep} />
      </Card>

      {/* ── Étape 1 ─────────────────────────────────────────────────────── */}
      {step === 1 ? (
        <div className="grid gap-5">
          <Card className="grid gap-5">
            <SectionTitle icon={FiCalendar} label="L'événement" />
            <Input
              id="ev-title"
              label="Titre de l'événement"
              placeholder="Ex : Fête nationale du Bénin à Moscou, Cours de russe…"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
            />

            {/* Category grid */}
            <div>
              <p className="mb-3 text-sm font-bold">Catégorie</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {EVENT_CATEGORIES.map((cat) => {
                  const Icon = CAT_ICONS[cat.value] || FiCalendar
                  const color = CAT_COLORS[cat.value] || ''
                  const active = form.category === cat.value
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => set('category', cat.value)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all ${
                        active
                          ? `border-transparent ${color} ring-2 ring-current shadow-sm`
                          : 'border-[var(--app-border)] hover:border-[var(--app-accent)] hover:shadow-sm'
                      }`}
                    >
                      <span className={`grid size-8 place-items-center rounded-xl ${active ? '' : 'bg-[var(--app-surface-muted)]'}`}>
                        <Icon className={`text-base ${active ? '' : 'text-[var(--app-text-muted)]'}`} />
                      </span>
                      <span className={`text-[10px] font-black leading-tight ${active ? '' : 'text-[var(--app-text-muted)]'}`}>
                        {cat.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              {errors.category ? <p className="mt-2 text-xs text-red-600">{errors.category}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="ev-start"
                label="Début"
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => set('startAt', e.target.value)}
                error={errors.startAt}
              />
              <Input
                id="ev-end"
                label="Fin (optionnel)"
                type="datetime-local"
                placeholder="jj/mm/aaaa hh:mm"
                value={form.endAt}
                onChange={(e) => set('endAt', e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="ev-deadline"
                label="Date limite d'inscription"
                type="date"
                placeholder="jj/mm/aaaa"
                value={form.registrationDeadline}
                onChange={(e) => set('registrationDeadline', e.target.value)}
              />
              <Input
                id="ev-capacity"
                label="Capacité (personnes)"
                type="number"
                min="1"
                placeholder="Ex : 100"
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
              />
            </div>
          </Card>

          {/* Format visual cards */}
          <Card className="grid gap-4">
            <SectionTitle icon={FiGlobe} label="Format de l'événement" />
            <div className="grid grid-cols-3 gap-3">
              {FORMAT_OPTIONS.map((fmt) => {
                const Icon = fmt.icon
                const active = form.format === fmt.value
                return (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => set('format', fmt.value)}
                    className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                      active
                        ? `border-transparent ${fmt.color} ring-2 ring-current shadow-md`
                        : 'border-[var(--app-border)] hover:border-[var(--app-accent)] hover:shadow-sm'
                    }`}
                  >
                    <span className={`grid size-10 place-items-center rounded-xl ${active ? 'bg-white/50 dark:bg-black/20' : 'bg-[var(--app-surface-muted)]'}`}>
                      <Icon className={`text-lg ${active ? '' : 'text-[var(--app-text-muted)]'}`} />
                    </span>
                    <div>
                      <p className={`text-xs font-black ${active ? '' : 'text-[var(--app-text-muted)]'}`}>{fmt.label}</p>
                      <p className={`mt-0.5 text-[10px] leading-tight ${active ? 'opacity-70' : 'text-[var(--app-text-muted)]'}`}>{fmt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {selectedFormat ? (
              <p className="text-xs text-[var(--app-text-muted)]">
                Format choisi : <strong>{selectedFormat.label}</strong> — {selectedFormat.sub}
              </p>
            ) : null}
          </Card>
        </div>
      ) : null}

      {/* ── Étape 2 ─────────────────────────────────────────────────────── */}
      {step === 2 ? (
        <Card className="grid gap-5">
          <SectionTitle icon={FiMic} label="Programme & description" />
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              Description <span className="font-normal text-[var(--app-text-muted)]">(min. 20 car.)</span>
            </span>
            <textarea
              className="min-h-32 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder="Décrivez l'événement, son ambiance, ce que les participants vont vivre…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
            {errors.description ? <span className="text-xs text-red-600">{errors.description}</span> : null}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Programme / déroulé (optionnel)</span>
            <textarea
              className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder="18h00 - Accueil · 18h30 - Discours · 19h00 - Repas…"
              value={form.program}
              onChange={(e) => set('program', e.target.value)}
            />
          </label>
          <Input
            id="ev-speakers"
            label="Intervenants / Artistes (optionnel)"
            placeholder="Ex : DJ Soulful, Conférencier M. Dupont…"
            value={form.speakers}
            onChange={(e) => set('speakers', e.target.value)}
          />
        </Card>
      ) : null}

      {/* ── Étape 3 ─────────────────────────────────────────────────────── */}
      {step === 3 ? (
        <div className="grid gap-5">
          {/* Conditional location block */}
          {form.format !== 'online' ? (
            <Card className="grid gap-5">
              <SectionTitle icon={FiMapPin} label="Lieu physique" />
              <CitySelector
                id="ev-city"
                label="Ville"
                value={form.city}
                onChange={(city) => set('city', city)}
                error={errors.city}
              />
              <Input
                id="ev-venue"
                label="Nom du lieu"
                placeholder="Ex : Maison de la culture africaine, Hôtel Cosmos…"
                value={form.venue}
                onChange={(e) => set('venue', e.target.value)}
                error={errors.venue}
              />
              <Input
                id="ev-address"
                label="Adresse complète"
                placeholder="Ex : Prospekt Mira 150, Moscou"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </Card>
          ) : null}

          {form.format !== 'in_person' ? (
            <Card className="grid gap-5">
              <SectionTitle icon={FiWifi} label="Accès en ligne" />
              <Input
                id="ev-link"
                label="Lien de connexion"
                placeholder="https://zoom.us/j/… ou https://meet.google.com/…"
                value={form.onlineLink}
                onChange={(e) => set('onlineLink', e.target.value)}
                error={errors.onlineLink}
              />
              {form.format === 'online' ? (
                <p className="text-xs text-[var(--app-text-muted)]">
                  Le lien sera partagé aux participants inscrits. Vérifiez qu'il reste valide.
                </p>
              ) : null}
            </Card>
          ) : null}

          {/* Tarif + organisateur */}
          <Card className="grid gap-5">
            <SectionTitle icon={FiUsers} label="Accès et organisateur" />
            <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
              form.freeEntry ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-[var(--app-border)]'
            }`}>
              <input
                type="checkbox"
                checked={form.freeEntry}
                onChange={(e) => set('freeEntry', e.target.checked)}
                className="size-5 accent-brand-700"
              />
              <div>
                <p className="text-sm font-bold">Entrée gratuite</p>
                <p className="text-xs text-[var(--app-text-muted)]">Décochez pour définir un tarif</p>
              </div>
            </label>
            {!form.freeEntry ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="ev-price"
                  label="Tarif d'entrée (RUB)"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
                <Input id="ev-currency" label="Devise" value="RUB" disabled />
              </div>
            ) : null}
            <Input
              id="ev-organizer"
              label="Organisateur (nom affiché)"
              placeholder="Ex : Association MOXT, Club Africain…"
              value={form.organizerName}
              onChange={(e) => set('organizerName', e.target.value)}
            />
            <Input
              id="ev-contact"
              label="Contact de l'organisateur"
              placeholder="Téléphone ou email"
              value={form.organizerContact}
              onChange={(e) => set('organizerContact', e.target.value)}
            />
          </Card>
        </div>
      ) : null}

      {/* ── Étape 4 — Récapitulatif ──────────────────────────────────────── */}
      {step === 4 ? (
        <div className="grid gap-5">
          <Card className="grid gap-4">
            <SectionTitle icon={FiCheckCircle} label="Récapitulatif" />
            {[
              ['Titre', form.title],
              ['Catégorie', selectedCategory?.label],
              ['Format', selectedFormat?.label],
              ['Début', form.startAt ? new Date(form.startAt).toLocaleString('fr-FR') : '—'],
              ['Lieu', form.format === 'online' ? 'En ligne' : `${form.venue}, ${form.city}`],
              ['Capacité', `${form.capacity} personnes`],
              ['Tarif', form.freeEntry ? 'Gratuit' : `${form.price} RUB`],
              ['Organisateur', form.organizerName],
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
              Votre événement sera publié immédiatement et visible dans la section Événements de MOXT.
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
          <Button icon={FiCheckCircle} onClick={publish}>Créer l'événement</Button>
        )}
      </div>
    </div>
    </>
  )
}
