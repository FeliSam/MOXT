import { useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiImage,
  FiMapPin,
  FiPackage,
  FiPercent,
  FiTag,
  FiTrash2,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import {
  CATEGORIES_BY_TYPE,
  DELIVERY_BY_TYPE,
  EXTRA_FIELD_META,
  LISTING_TYPES_META,
  TYPE_RULES,
  sanitizeListingByType,
  validateListingBusinessRules,
} from '../config/listingConfig'
import { LISTING_CONDITIONS } from '../config/options'
import {
  constrainRussianPhone,
  ensurePhoneCountry,
  phoneError,
  phonePlaceholder,
  validatePhone,
} from '../config/phone'
import { CitySelector } from '../components/ui/CitySelector'
import { BusinessPublishNotice } from '../features/businesses/BusinessPublishNotice'
import {
  isBusinessPublishReady,
  resolveBusinessPublishContext,
} from '../features/businesses/businessPublishUtils'
import { publishListing } from '../features/marketplace/marketplaceSlice'
import { useActionBurst } from '../components/ui/ActionBurst'
import { addToast } from '../features/ui/uiSlice'

const STEPS = [
  { key: 'type', label: 'Type', icon: FiTag },
  { key: 'details', label: 'Détails', icon: FiPackage },
  { key: 'photos', label: 'Photos', icon: FiImage },
  { key: 'location', label: 'Localisation', icon: FiMapPin },
]

export function PublishListingPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const canPublishAsBusiness = isBusinessPublishReady(business)
  const [step, setStep] = useState(1)
  const [listingType, setListingType] = useState(null)
  const [category, setCategory] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'used',
    stock: 1,
    brand: '',
    model: '',
    city: user.city || 'Moscou',
    district: '',
    address: '',
    contact: ensurePhoneCountry(user.phone, 'RU'),
    whatsapp: ensurePhoneCountry(user.phone, 'RU'),
    sellerType: canPublishAsBusiness && business ? 'business' : 'person',
    deliveryOptions: [],
    deliveryFee: 0,
    // Réduction
    hasDiscount: false,
    discountPercent: '',
    originalPrice: '',
    // Champs extra (tous initialisés vides)
    weight: '',
    expiryDate: '',
    ingredients: '',
    availability: '',
    duration: '',
    remote: false,
    deposit: '',
    minDuration: '',
    availableFrom: '',
    year: '',
    mileage: '',
    fuel: 'gasoline',
    transmission: 'manual',
    digitalFormat: '',
    fileSize: '',
    reType: 'apartment',
    surface: '',
    rooms: '',
    floor: '',
    furnished: 'no',
    reTransaction: 'rent',
    reState: 'good',
  })
  const [photos, setPhotos] = useState([])
  const [errors, setErrors] = useState({})
  const [shareModal, setShareModal] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const fileInputRef = useRef(null)
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()

  const rules = listingType ? (TYPE_RULES[listingType] ?? TYPE_RULES.other) : null
  const categories = listingType ? (CATEGORIES_BY_TYPE[listingType] ?? []) : []
  const deliveryOptions = listingType ? (DELIVERY_BY_TYPE[listingType] ?? []) : []
  const typeMeta = LISTING_TYPES_META.find((t) => t.value === listingType)

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function selectType(type) {
    setListingType(type)
    setCategory('')
    const defaults = DELIVERY_BY_TYPE[type] ?? []
    const nextRules = TYPE_RULES[type] ?? TYPE_RULES.other
    setForm((previous) =>
      sanitizeListingByType({
        ...previous,
        type,
        category: '',
        condition: nextRules.showCondition ? previous.condition || 'used' : null,
        deliveryOptions: defaults.length ? [defaults[0].value] : [],
      }),
    )
    setErrors({})
  }

  // ── Validation par étape ──────────────────────────────────────────────────
  function validate(n) {
    const errs = {}
    if (n === 1) {
      if (!listingType) errs.listingType = "Choisissez un type d'annonce."
      if (!category) errs.category = 'Choisissez une catégorie.'
      if (!form.title || form.title.trim().length < 4)
        errs.title = 'Titre trop court (4 caractères min).'
    }
    if (n === 2) {
      if (!form.description || form.description.trim().length < 20)
        errs.description = 'Description trop courte (20 caractères min).'
      if (!form.price || Number(form.price) <= 0) errs.price = 'Prix obligatoire.'
      Object.assign(errs, validateListingBusinessRules({ ...form, type: listingType, category }))
    }
    if (n === 3) {
      if (photos.length === 0) errs.photos = 'Ajoutez au moins une photo.'
    }
    if (n === 4) {
      if (!form.city.trim()) errs.city = 'Ville obligatoire.'
      if (!form.district.trim()) errs.district = 'Quartier obligatoire.'
      if (!form.address.trim() || form.address.trim().length < 10)
        errs.address = 'Adresse trop courte.'
      if (!form.contact.trim()) errs.contact = 'Contact obligatoire.'
      else if (!validatePhone(form.contact, 'RU')) errs.contact = phoneError('RU')
      if (form.whatsapp && !validatePhone(form.whatsapp, 'RU')) {
        errs.whatsapp = phoneError('RU')
      }
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

  // ── Photos ────────────────────────────────────────────────────────────────
  function addPhotos(files) {
    const added = Array.from(files)
      .slice(0, 6 - photos.length)
      .map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name }))
    setPhotos((p) => [...p, ...added])
    setErrors((e) => ({ ...e, photos: undefined }))
  }
  function removePhoto(i) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].url)
      return p.filter((_, idx) => idx !== i)
    })
  }
  function movePhoto(from, to) {
    setPhotos((p) => {
      const n = [...p]
      const [m] = n.splice(from, 1)
      n.splice(to, 0, m)
      return n
    })
  }

  // ── Publication ───────────────────────────────────────────────────────────
  async function publish() {
    if (!validate(4)) return
    const publishContext = resolveBusinessPublishContext({
      business,
      publishAsBusiness: form.sellerType === 'business',
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
    setPublishing(true)
    const sanitizedForm = sanitizeListingByType({
      ...form,
      type: listingType,
      category,
    })
    const result = await dispatch(
      publishListing({
        files: photos.map((photo) => photo.file),
        values: {
          ...sanitizedForm,
          ownerId: user.id,
          sellerName: publishContext.useBusiness
            ? business.name
            : `${user.firstName} ${user.lastName}`,
          businessId: publishContext.businessId,
          currency: 'RUB',
          country: 'RU',
        },
      }),
    )
    setPublishing(false)
    if (publishListing.fulfilled.match(result)) {
      triggerBurst()
      dispatch(addToast({ title: 'Annonce publiée', message: 'Votre annonce est en ligne.', tone: 'success' }))
      setShareModal({ sourceId: result.payload?.id, sourceData: result.payload ?? {} })
    }
  }

  // ── Rendu des champs extra dynamiques ─────────────────────────────────────
  function renderExtraFields() {
    if (!rules?.extraFields?.length) return null
    return (
      <div className="grid gap-4">
        <p className="text-sm font-black text-brand-700">
          Informations spécifiques · {typeMeta?.label}
        </p>
        {rules.extraFields.map((key) => {
          const meta = EXTRA_FIELD_META[key]
          if (!meta) return null
          if (meta.type === 'checkbox') {
            return (
              <label key={key} className="flex cursor-pointer items-center gap-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => setField(key, e.target.checked)}
                  className="size-5 rounded"
                />
                {meta.label}
              </label>
            )
          }
          if (meta.type === 'select') {
            return (
              <Select
                key={key}
                id={`extra-${key}`}
                label={meta.label}
                value={form[key] ?? ''}
                onChange={(e) => setField(key, e.target.value)}
                error={errors[key]}
              >
                {meta.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            )
          }
          return (
            <Input
              key={key}
              id={`extra-${key}`}
              label={meta.label}
              type={meta.type ?? 'text'}
              placeholder={meta.placeholder ?? ''}
              value={form[key] ?? ''}
              onChange={(e) => setField(key, e.target.value)}
              error={errors[key]}
            />
          )
        })}
      </div>
    )
  }

  return (
    <>
    {burstNode}
    {shareModal && (
      <ShareToFeedModal
        sourceType="listing"
        sourceId={shareModal.sourceId}
        sourceData={shareModal.sourceData}
        onClose={() => { setShareModal(null); navigate('/publications/mine?type=listing') }}
        onPublished={triggerBurst}
      />
    )}
    <div className="mx-auto grid max-w-3xl gap-7">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/marketplace')}>
          Marketplace
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-black">Publier une annonce</h1>
          {typeMeta ? (
            <p className="text-xs text-[var(--app-text-muted)]">
              {typeMeta.label} · {categories.find((c) => c.value === category)?.label}
            </p>
          ) : null}
        </div>
      </div>

      {/* Stepper */}
      <Card>
        <div className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, index) => {
            const n = index + 1
            const done = step > n
            const active = step === n
            const Icon = s.icon
            return (
              <div key={s.key} className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  disabled={n > step}
                  onClick={() => n < step && setStep(n)}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-black transition sm:text-sm ${
                    active
                      ? 'bg-brand-700 text-white'
                      : done
                        ? 'cursor-pointer bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'cursor-default bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                  }`}
                >
                  {done ? <FiCheck /> : <Icon />}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{n}</span>
                </button>
                {n < STEPS.length ? (
                  <span className="h-px w-3 bg-[var(--app-border)] sm:w-5" />
                ) : null}
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--app-text-muted)]">
          Étape {step}/{STEPS.length} · {STEPS[step - 1].label}
        </p>
      </Card>

      {/* ── Étape 1 : Type → Catégorie → Titre ──────────────────────────── */}
      {step === 1 ? (
        <div className="grid gap-6">
          <Card className="grid gap-4">
            <h2 className="font-black">Quel type d'annonce ?</h2>
            {errors.listingType ? <Alert variant="error">{errors.listingType}</Alert> : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LISTING_TYPES_META.map((t) => {
                const Icon = t.icon
                const selected = listingType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => selectType(t.value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition ${
                      selected
                        ? `border-brand-500 bg-[var(--app-accent-soft)]`
                        : 'border-transparent bg-[var(--app-surface-muted)] hover:border-brand-300'
                    }`}
                  >
                    <span
                      className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white text-xl ${t.color}`}
                    >
                      <Icon />
                    </span>
                    <span className="text-xs font-black">{t.label}</span>
                    <span className="hidden text-[10px] text-[var(--app-text-muted)] sm:block">
                      {t.hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          {listingType ? (
            <Card className="grid gap-4">
              <h2 className="font-black">
                Catégorie{' '}
                <span className="font-normal text-[var(--app-text-muted)]">
                  · {typeMeta?.label}
                </span>
              </h2>
              {errors.category ? <Alert variant="error">{errors.category}</Alert> : null}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                      category === cat.value
                        ? 'border-brand-500 bg-brand-700 text-white'
                        : 'border-[var(--app-border)] hover:border-brand-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {category ? (
                <Input
                  id="pub-title"
                  label="Titre de l'annonce"
                  placeholder={
                    listingType === `real_estate`
                      ? 'Ex : Appartement 2 pièces meublé, Moscou Centre'
                      : listingType === 'vehicle'
                        ? 'Ex : Toyota Camry 2020, 45 000 km, excellent état'
                        : listingType === 'service'
                          ? 'Ex : Cours de français pour russophone — 1h'
                          : listingType === 'food'
                            ? 'Ex : Riz parfumé du Bénin — livraison Moscou'
                            : 'Ex : iPhone 14 Pro 256 Go – Excellent état'
                  }
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  error={errors.title}
                />
              ) : null}
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* ── Étape 2 : Détails dynamiques ─────────────────────────────────── */}
      {step === 2 ? (
        <Card className="grid gap-5">
          <h2 className="font-black">
            Détails de l'annonce{' '}
            <span className="font-normal text-[var(--app-text-muted)]">· {typeMeta?.label}</span>
          </h2>

          {/* Description */}
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              Description{' '}
              <span className="font-normal text-[var(--app-text-muted)]">(20 caractères min)</span>
            </span>
            <textarea
              className="min-h-32 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm outline-none focus:border-brand-400"
              placeholder={
                listingType === 'real_estate'
                  ? 'Surface, nombre de pièces, équipements, proximité des transports, charges…'
                  : listingType === 'vehicle'
                    ? "Historique d'entretien, équipements, points forts, raison de la vente…"
                    : listingType === 'service'
                      ? "Déroulement de la prestation, compétences, expérience, tarif à l'heure…"
                      : listingType === 'food'
                        ? 'Composition, provenance, allergènes, mode de conservation…'
                        : 'Décrivez votre annonce : état, accessoires inclus, raison de la vente…'
              }
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
            {errors.description ? (
              <span className="text-xs text-red-600">{errors.description}</span>
            ) : null}
          </label>

          {/* Prix */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="pub-price"
              label={
                listingType === 'real_estate'
                  ? 'Prix / Loyer mensuel (RUB)'
                  : listingType === 'service'
                    ? 'Tarif (RUB)'
                    : 'Prix (RUB)'
              }
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              error={errors.price}
            />
            <Input id="pub-currency" label="Devise" value="RUB — Marché Russie" disabled />
          </div>

          {/* Réduction */}
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <FiPercent />
                </span>
                <div>
                  <span className="text-sm font-black">Appliquer une réduction</span>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    Le prix réduit sera affiché avec le prix barré
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.hasDiscount}
                onClick={() => {
                  setField('hasDiscount', !form.hasDiscount)
                  if (form.hasDiscount) {
                    setField('discountPercent', '')
                    setField('originalPrice', '')
                  }
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  form.hasDiscount ? 'bg-rose-500' : 'bg-[var(--app-border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    form.hasDiscount ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </label>

            {form.hasDiscount ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-sm font-bold" htmlFor="pub-original-price">
                    Prix original (RUB)
                  </label>
                  <input
                    id="pub-original-price"
                    type="number"
                    min="0"
                    placeholder="Ex : 15 000"
                    className="min-h-12 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-sm outline-none focus:border-brand-400"
                    value={form.originalPrice}
                    onChange={(e) => {
                      const orig = Number(e.target.value)
                      const pct = Number(form.discountPercent)
                      setField('originalPrice', e.target.value)
                      if (orig > 0 && pct > 0) {
                        setField('price', Math.round(orig * (1 - pct / 100)))
                      }
                    }}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-bold" htmlFor="pub-discount-pct">
                    Réduction (%)
                  </label>
                  <input
                    id="pub-discount-pct"
                    type="number"
                    min="1"
                    max="99"
                    placeholder="Ex : 20"
                    className="min-h-12 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-sm outline-none focus:border-brand-400"
                    value={form.discountPercent}
                    onChange={(e) => {
                      const pct = Math.min(99, Math.max(0, Number(e.target.value)))
                      const orig = Number(form.originalPrice)
                      setField('discountPercent', e.target.value)
                      if (orig > 0 && pct > 0) {
                        setField('price', Math.round(orig * (1 - pct / 100)))
                      }
                    }}
                  />
                </div>
                {form.originalPrice && form.discountPercent ? (
                  <div className="col-span-full flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm dark:bg-rose-950/30">
                    <FiPercent className="shrink-0 text-rose-600" />
                    <span className="text-[var(--app-text-muted)] line-through">
                      {Number(form.originalPrice).toLocaleString('fr-FR')} RUB
                    </span>
                    <span className="mx-1 text-[var(--app-text-muted)]">→</span>
                    <strong className="text-rose-600">
                      {Number(form.price).toLocaleString('fr-FR')} RUB
                    </strong>
                    <span className="ml-auto rounded-full bg-rose-600 px-2 py-0.5 text-xs font-black text-white">
                      -{form.discountPercent}%
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* État (conditionnel) */}
          {rules?.showCondition ? (
            <Select
              id="pub-condition"
              label="État du produit"
              value={form.condition}
              onChange={(e) => setField('condition', e.target.value)}
              error={errors.condition}
            >
              {LISTING_CONDITIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          ) : null}

          {/* Marque + modèle (conditionnel) */}
          {rules?.showBrandModel ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="pub-brand"
                label="Marque"
                placeholder="Optionnel"
                value={form.brand}
                onChange={(e) => setField('brand', e.target.value)}
              />
              <Input
                id="pub-model"
                label="Modèle"
                placeholder="Optionnel"
                value={form.model}
                onChange={(e) => setField('model', e.target.value)}
              />
            </div>
          ) : null}

          {/* Quantité (conditionnel) */}
          {rules?.showStock ? (
            <Input
              id="pub-stock"
              label="Quantité disponible"
              type="number"
              min="1"
              value={form.stock}
              onChange={(e) => setField('stock', Number(e.target.value))}
              error={errors.stock}
            />
          ) : null}

          {/* Champs dynamiques selon le type */}
          {renderExtraFields()}
        </Card>
      ) : null}

      {/* ── Étape 3 : Photos ──────────────────────────────────────────────── */}
      {step === 3 ? (
        <Card className="grid gap-5">
          <div>
            <h2 className="font-black">Photos</h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              Maximum 6 photos · la première sera la photo principale · cliquez pour réordonner.
            </p>
          </div>
          {errors.photos ? <Alert variant="error">{errors.photos}</Alert> : null}
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div key={photo.name + i} className="group relative aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="size-full rounded-2xl object-cover"
                  />
                  {i === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-black text-white">
                      Principale
                    </span>
                  ) : null}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    {i > 0 ? (
                      <button
                        type="button"
                        onClick={() => movePhoto(i, i - 1)}
                        className="grid size-8 place-items-center rounded-full bg-white/90 text-slate-800 shadow text-xs font-bold"
                      >
                        ←
                      </button>
                    ) : null}
                    {i < photos.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => movePhoto(i, i + 1)}
                        className="grid size-8 place-items-center rounded-full bg-white/90 text-slate-800 shadow text-xs font-bold"
                      >
                        →
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="grid size-8 place-items-center rounded-full bg-red-600 text-white shadow"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < 6 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--app-border)] text-[var(--app-text-muted)] transition hover:border-brand-400 hover:text-brand-700"
                >
                  <FiImage className="text-2xl" />
                  <span className="text-xs font-bold">Ajouter</span>
                </button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--app-border)] transition hover:border-brand-400"
            >
              <FiImage className="text-4xl text-[var(--app-text-muted)]" />
              <div className="text-center">
                <p className="font-bold">Cliquez ou glissez vos photos ici</p>
                <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                  JPG, PNG, WebP — max 6 photos
                </p>
              </div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => addPhotos(e.target.files)}
          />
          {photos.length > 0 ? (
            <Button
              variant="secondary"
              icon={FiImage}
              onClick={() => fileInputRef.current?.click()}
            >
              Ajouter d'autres photos
            </Button>
          ) : null}
        </Card>
      ) : null}

      {/* ── Étape 4 : Localisation, livraison & récap ─────────────────────── */}
      {step === 4 ? (
        <Card className="grid gap-5">
          <h2 className="font-black">Localisation & contact</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <CitySelector
              id="pub-city"
              label="Ville en Russie"
              value={form.city}
              onChange={(city) => setField('city', city)}
              error={errors.city}
            />
            <Input
              id="pub-district"
              label="Quartier / arrondissement en Russie"
              placeholder="Ex : Tverski, Zamoskvorechye…"
              value={form.district}
              onChange={(e) => setField('district', e.target.value)}
              error={errors.district}
            />
          </div>
          <Input
            id="pub-address"
            label="Adresse complète"
            placeholder="Ex : Tverskaya 12, app. 45, Moscou"
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            error={errors.address}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="pub-contact"
              label="Téléphone russe"
              type="tel"
              placeholder={phonePlaceholder('RU')}
              value={form.contact}
              onChange={(e) => setField('contact', constrainRussianPhone(e.target.value))}
              error={errors.contact}
            />
            <Input
              id="pub-whatsapp"
              label="WhatsApp (optionnel)"
              type="tel"
              placeholder={phonePlaceholder('RU')}
              value={form.whatsapp}
              onChange={(e) => setField('whatsapp', constrainRussianPhone(e.target.value))}
              error={errors.whatsapp}
            />
          </div>

          {/* Options de livraison filtrées par type */}
          {deliveryOptions.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-bold">Options de remise</p>
              <div className="flex flex-wrap gap-2">
                {deliveryOptions.map((opt) => {
                  const selected = form.deliveryOptions.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? form.deliveryOptions.filter((v) => v !== opt.value)
                          : [...form.deliveryOptions, opt.value]
                        setField('deliveryOptions', next)
                      }}
                      className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                        selected
                          ? 'border-brand-500 bg-brand-700 text-white'
                          : 'border-[var(--app-border)] hover:border-brand-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Vendeur pro ou particulier */}
          {business ? (
            <>
              <BusinessPublishNotice business={business} />
              <Select
                id="pub-seller"
                label="Publier en tant que"
                value={form.sellerType}
                onChange={(e) => setField('sellerType', e.target.value)}
              >
                {canPublishAsBusiness ? (
                  <option value="business">{business.name} (entreprise)</option>
                ) : null}
                <option value="person">Particulier</option>
              </Select>
            </>
          ) : null}

          {/* Récapitulatif */}
          <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4">
            <p className="mb-3 text-sm font-black">Récapitulatif</p>
            <div className="grid gap-2 text-sm">
              <RecapRow label="Type" value={typeMeta?.label} />
              <RecapRow
                label="Catégorie"
                value={categories.find((c) => c.value === category)?.label}
              />
              <RecapRow label="Titre" value={form.title} />
              {form.hasDiscount && form.originalPrice ? (
                <>
                  <RecapRow
                    label="Prix original"
                    value={`${Number(form.originalPrice).toLocaleString('fr-FR')} RUB`}
                  />
                  <RecapRow
                    label="Réduction"
                    value={`−${form.discountPercent}% → ${Number(form.price).toLocaleString('fr-FR')} RUB`}
                  />
                </>
              ) : (
                <RecapRow label="Prix" value={`${Number(form.price).toLocaleString('fr-FR')} RUB`} />
              )}
              <RecapRow label="Photos" value={`${photos.length}`} />
              <RecapRow label="Ville" value={form.city} />
            </div>
          </div>
        </Card>
      ) : null}

      {/* Navigation */}
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
          <Button
            icon={FiCheckCircle}
            loading={publishing}
            disabled={publishing}
            onClick={publish}
          >
            {publishing ? 'Publication...' : "Publier l'annonce"}
          </Button>
        )}
      </div>
    </div>
    </>
  )
}

function RecapRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[var(--app-text-muted)]">{label}</span>
      <span className="text-right font-bold">{value || `—`}</span>
    </div>
  )
}
