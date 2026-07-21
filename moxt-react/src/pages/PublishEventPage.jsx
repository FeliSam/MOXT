import { useState } from 'react'
import { PosterUploader } from '../components/ui/PosterUploader'
import { storageService } from '../services/storageService'
import { useUploadProgress } from '../hooks/useUploadProgress'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiGlobe,
  FiMapPin,
  FiMic,
  FiUsers,
  FiWifi,
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
import { createEvent } from '../features/events/eventSlice'
import { BusinessPublishNotice } from '../features/businesses/BusinessPublishNotice'
import {
  EVENT_CAT_COLORS,
  EVENT_CAT_ICONS,
  EVENT_FORMAT_OPTIONS,
  EVENT_PUBLISH_CATEGORIES,
  EVENT_PUBLISH_STEPS,
} from '../features/events/eventPublishConfig'
import { useScrollToTopOnStep } from '../hooks/useScrollToTopOnStep'
import {
  canPublishAsBusinessFor,
  resolveBusinessPublishContext,
} from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'
import { SecurityGatePanel } from '../features/security/SecurityGatePanel'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { initialCatalogStatus } from '@moxt/shared/auth/userSecurity.js'
import { useLanguage } from '../contexts/useLanguage'
import {
  publishOptionLabel,
  publishOptionSub,
  publishText,
} from '../features/publications/publishI18n'

const STEPS = EVENT_PUBLISH_STEPS

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
            <span
              className={`text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'}`}
            >
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

export function PublishEventPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { requirePublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const canPublishAsBusiness = canPublishAsBusinessFor(business, 'event')
  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const [errors, setErrors] = useState({})
  const [shareModal, setShareModal] = useState(null)
  const [photos, setPhotos] = useState([])
  const [publishing, setPublishing] = useState(false)
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()

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
    publishAs: 'person',
    organizerName: `${user.firstName} ${user.lastName}`,
    organizerContact: user.phone || '',
  })

  function set(f, v) {
    setForm((p) => ({ ...p, [f]: v }))
    setErrors((p) => ({ ...p, [f]: undefined }))
  }

  function validate(n) {
    const errs = {}
    if (n === 1) {
      if (!form.title.trim())
        errs.title = publishText(t, 'publish.event.validation.titleRequired')
      if (!form.category)
        errs.category = publishText(t, 'publish.event.validation.categoryRequired')
      if (!form.startAt)
        errs.startAt = publishText(t, 'publish.event.validation.startRequired')
    }
    if (n === 2) {
      if (!form.description.trim() || form.description.trim().length < 20)
        errs.description = publishText(t, 'publish.event.validation.descriptionMin')
    }
    if (n === 3) {
      if (form.format !== 'online' && !form.venue.trim())
        errs.venue = publishText(t, 'publish.event.validation.venueRequired')
      if (form.format === 'online' && !form.onlineLink.trim())
        errs.onlineLink = publishText(t, 'publish.event.validation.onlineLinkRequired')
      if (!form.city.trim())
        errs.city = publishText(t, 'publish.event.validation.cityRequired')
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
    if (!requirePublish()) return
    if (!validate(3)) return
    const publishContext = resolveBusinessPublishContext({
      business,
      publishAsBusiness: form.publishAs === 'business',
      contentType: 'event',
    })
    if (publishContext.blocked) {
      dispatch(
        addToast({
          title: publishText(t, 'publish.common.toasts.businessBlockedTitle'),
          message: publishText(t, 'publish.event.toasts.businessBlockedMessage'),
          tone: 'error',
        }),
      )
      return
    }
    setPublishing(true)
    let images = []
    try {
      if (photos.length) {
        images = await trackUpload((onProgress) =>
          storageService.uploadEventImages(
            user.id,
            Date.now().toString(36),
            photos.map((photo) => photo.file),
            { onProgress },
          ),
        )
      }
    } catch (error) {
      setPublishing(false)
      dispatch(
        addToast({
          title: publishText(t, 'publish.common.toasts.imagesFailedTitle'),
          message: error.message || publishText(t, 'publish.common.toasts.retry'),
          tone: 'error',
        }),
      )
      return
    }
    const { publishAs: _publishAs, ...eventFields } = form
    const action = dispatch(
      createEvent({
        ...eventFields,
        images,
        ownerId: user.id,
        organizerName: publishContext.useBusiness ? business.name : form.organizerName,
        businessId: publishContext.businessId,
        price: form.freeEntry ? 0 : Number(form.price),
        status: initialCatalogStatus(user, { live: 'published', pending: 'pending_review' }),
      }),
    )
    setPublishing(false)
    triggerBurst()
    const live = action.payload?.status === 'published'
    dispatch(
      addToast({
        title: live
          ? publishText(t, 'publish.event.toasts.publishedTitle')
          : publishText(t, 'publish.event.toasts.pendingTitle'),
        message: live
          ? publishText(t, 'publish.event.toasts.publishedMessage')
          : publishText(t, 'publish.event.toasts.pendingMessage'),
        tone: 'success',
      }),
    )
    setShareModal({ sourceId: action.payload.id, sourceData: action.payload })
  }

  const selectedFormat = EVENT_FORMAT_OPTIONS.find((f) => f.value === form.format)
  const selectedCategory = EVENT_PUBLISH_CATEGORIES.find((c) => c.value === form.category)

  return (
    <SecurityGatePanel kind="publish" backTo="/events">
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
          {publishText(t, 'publish.event.back')}
        </Button>
        <h1 className="text-xl font-black">{publishText(t, 'publish.event.title')}</h1>
      </div>

      <Card className="px-6 py-5">
        <Stepper step={step} onGoTo={setStep} t={t} />
      </Card>

      {step === 1 ? (
        <div className="grid gap-5">
          <Card className="grid gap-5">
            <SectionTitle
              icon={FiCalendar}
              label={publishText(t, 'publish.event.sections.basics')}
            />
            <Input
              id="ev-title"
              label={publishText(t, 'publish.event.fields.title')}
              placeholder={publishText(t, 'publish.event.fields.titlePlaceholder')}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
            />

            <div>
              <p className="mb-3 text-sm font-bold">
                {publishText(t, 'publish.event.fields.category')}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {EVENT_PUBLISH_CATEGORIES.map((cat) => {
                  const Icon = EVENT_CAT_ICONS[cat.value] || FiCalendar
                  const color = EVENT_CAT_COLORS[cat.value] || ''
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
                        {publishOptionLabel(t, cat)}
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
                label={publishText(t, 'publish.event.fields.start')}
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => set('startAt', e.target.value)}
                error={errors.startAt}
              />
              <Input
                id="ev-end"
                label={publishText(t, 'publish.event.fields.end')}
                type="datetime-local"
                placeholder="jj/mm/aaaa hh:mm"
                value={form.endAt}
                onChange={(e) => set('endAt', e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="ev-deadline"
                label={publishText(t, 'publish.event.fields.registrationDeadline')}
                type="date"
                placeholder="jj/mm/aaaa"
                value={form.registrationDeadline}
                onChange={(e) => set('registrationDeadline', e.target.value)}
              />
              <Input
                id="ev-capacity"
                label={publishText(t, 'publish.event.fields.capacity')}
                type="number"
                min="1"
                placeholder={publishText(t, 'publish.event.fields.capacityPlaceholder')}
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
              />
            </div>
          </Card>

          <Card className="grid gap-4">
            <SectionTitle
              icon={FiGlobe}
              label={publishText(t, 'publish.event.sections.format')}
            />
            <div className="grid grid-cols-3 gap-3">
              {EVENT_FORMAT_OPTIONS.map((fmt) => {
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
                      <p className={`text-xs font-black ${active ? '' : 'text-[var(--app-text-muted)]'}`}>
                        {publishOptionLabel(t, fmt)}
                      </p>
                      <p className={`mt-0.5 text-[10px] leading-tight ${active ? 'opacity-70' : 'text-[var(--app-text-muted)]'}`}>
                        {publishOptionSub(t, fmt)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            {selectedFormat ? (
              <p className="text-xs text-[var(--app-text-muted)]">
                {publishText(t, 'publish.event.fields.formatChosen')}{' '}
                <strong>{publishOptionLabel(t, selectedFormat)}</strong> —{' '}
                {publishOptionSub(t, selectedFormat)}
              </p>
            ) : null}
          </Card>
        </div>
      ) : null}

      {step === 2 ? (
        <Card className="grid gap-5">
          <SectionTitle
            icon={FiMic}
            label={publishText(t, 'publish.event.sections.program')}
          />
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.event.fields.description')}{' '}
              <span className="font-normal text-[var(--app-text-muted)]">
                {publishText(t, 'publish.event.fields.descriptionMin')}
              </span>
            </span>
            <textarea
              className="min-h-32 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder={publishText(t, 'publish.event.fields.descriptionPlaceholder')}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
            {errors.description ? <span className="text-xs text-red-600">{errors.description}</span> : null}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.event.fields.program')}
            </span>
            <textarea
              className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder={publishText(t, 'publish.event.fields.programPlaceholder')}
              value={form.program}
              onChange={(e) => set('program', e.target.value)}
            />
          </label>
          <Input
            id="ev-speakers"
            label={publishText(t, 'publish.event.fields.speakers')}
            placeholder={publishText(t, 'publish.event.fields.speakersPlaceholder')}
            value={form.speakers}
            onChange={(e) => set('speakers', e.target.value)}
          />
        </Card>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-5">
          <Card className="grid gap-4">
            <SectionTitle
              icon={FiMapPin}
              label={publishText(t, 'publish.event.sections.posters')}
            />
            <PosterUploader
              photos={photos}
              onAdd={addPhotos}
              onRemove={removePhoto}
              label={publishText(t, 'publish.event.fields.posters')}
              hint={publishText(t, 'publish.event.fields.postersHint')}
              progress={uploadProgress}
            />
          </Card>
          {form.format !== 'online' ? (
            <Card className="grid gap-5">
              <SectionTitle
                icon={FiMapPin}
                label={publishText(t, 'publish.event.sections.venue')}
              />
              <CitySelector
                id="ev-city"
                label={publishText(t, 'publish.event.fields.city')}
                value={form.city}
                onChange={(city) => set('city', city)}
                error={errors.city}
              />
              <Input
                id="ev-venue"
                label={publishText(t, 'publish.event.fields.venue')}
                placeholder={publishText(t, 'publish.event.fields.venuePlaceholder')}
                value={form.venue}
                onChange={(e) => set('venue', e.target.value)}
                error={errors.venue}
              />
              <Input
                id="ev-address"
                label={publishText(t, 'publish.event.fields.address')}
                placeholder={publishText(t, 'publish.event.fields.addressPlaceholder')}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </Card>
          ) : null}

          {form.format !== 'in_person' ? (
            <Card className="grid gap-5">
              <SectionTitle
                icon={FiWifi}
                label={publishText(t, 'publish.event.sections.online')}
              />
              <Input
                id="ev-link"
                label={publishText(t, 'publish.event.fields.onlineLink')}
                placeholder={publishText(t, 'publish.event.fields.onlineLinkPlaceholder')}
                value={form.onlineLink}
                onChange={(e) => set('onlineLink', e.target.value)}
                error={errors.onlineLink}
              />
              {form.format === 'online' ? (
                <p className="text-xs text-[var(--app-text-muted)]">
                  {publishText(t, 'publish.event.fields.onlineLinkHint')}
                </p>
              ) : null}
            </Card>
          ) : null}

          <Card className="grid gap-5">
            <SectionTitle
              icon={FiUsers}
              label={publishText(t, 'publish.event.sections.access')}
            />
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
                <p className="text-sm font-bold">
                  {publishText(t, 'publish.event.fields.freeEntry')}
                </p>
                <p className="text-xs text-[var(--app-text-muted)]">
                  {publishText(t, 'publish.event.fields.freeEntryHint')}
                </p>
              </div>
            </label>
            {!form.freeEntry ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="ev-price"
                  label={publishText(t, 'publish.event.fields.price')}
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
                <Input
                  id="ev-currency"
                  label={publishText(t, 'publish.event.fields.currency')}
                  value="RUB"
                  disabled
                />
              </div>
            ) : null}
            {business ? (
              <>
                <BusinessPublishNotice business={business} contentType="event" />
                <Select
                  id="ev-publisher"
                  label={publishText(t, 'publish.event.fields.publishAs')}
                  value={form.publishAs}
                  onChange={(e) => {
                    const publishAs = e.target.value
                    set('publishAs', publishAs)
                    set(
                      'organizerName',
                      publishAs === 'business'
                        ? business.name
                        : `${user.firstName} ${user.lastName}`,
                    )
                  }}
                >
                  <option value="person">
                    {publishText(t, 'publish.event.fields.publishAsPerson')}
                  </option>
                  {canPublishAsBusiness ? (
                    <option value="business">
                      {publishText(t, 'publish.event.fields.publishAsBusiness', {
                        name: business.name,
                      })}
                    </option>
                  ) : null}
                </Select>
                {!canPublishAsBusiness ? (
                  <p className="text-xs leading-5 text-[var(--app-text-muted)]">
                    {publishText(t, 'publish.event.fields.publishAsHint')}
                  </p>
                ) : null}
              </>
            ) : null}
            <Input
              id="ev-organizer"
              label={publishText(t, 'publish.event.fields.organizerName')}
              placeholder={publishText(t, 'publish.event.fields.organizerNamePlaceholder')}
              value={form.organizerName}
              onChange={(e) => set('organizerName', e.target.value)}
              disabled={form.publishAs === 'business' && canPublishAsBusiness}
            />
            <Input
              id="ev-contact"
              label={publishText(t, 'publish.event.fields.organizerContact')}
              placeholder={publishText(t, 'publish.event.fields.organizerContactPlaceholder')}
              value={form.organizerContact}
              onChange={(e) => set('organizerContact', e.target.value)}
            />
          </Card>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-5">
          <Card className="grid gap-4">
            <SectionTitle
              icon={FiCheckCircle}
              label={publishText(t, 'publish.event.sections.review')}
            />
            {[
              [publishText(t, 'publish.event.review.titleLabel'), form.title],
              [
                publishText(t, 'publish.event.review.category'),
                publishOptionLabel(t, selectedCategory),
              ],
              [
                publishText(t, 'publish.event.review.format'),
                publishOptionLabel(t, selectedFormat),
              ],
              [
                publishText(t, 'publish.event.review.start'),
                form.startAt
                  ? new Date(form.startAt).toLocaleString('fr-FR')
                  : publishText(t, 'publish.common.emDash'),
              ],
              [
                publishText(t, 'publish.event.review.location'),
                form.format === 'online'
                  ? publishText(t, 'publish.event.review.onlineLocation')
                  : publishText(t, 'publish.event.review.venueCity', {
                      venue: form.venue,
                      city: form.city,
                    }),
              ],
              [
                publishText(t, 'publish.event.review.capacity'),
                publishText(t, 'publish.event.review.capacityValue', {
                  count: form.capacity,
                }),
              ],
              [
                publishText(t, 'publish.event.review.price'),
                form.freeEntry
                  ? publishText(t, 'publish.event.review.free')
                  : publishText(t, 'publish.event.review.priceValue', {
                      price: form.price,
                    }),
              ],
              [publishText(t, 'publish.event.review.organizer'), form.organizerName],
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
              {publishText(t, 'publish.event.review.successHint')}
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
          <Button
            icon={FiCheckCircle}
            onClick={publish}
            loading={publishing}
            disabled={publishing}
          >
            {publishText(t, 'publish.event.nav.publish')}
          </Button>
        )}
      </div>
    </div>
    </>
    </SecurityGatePanel>
  )
}
