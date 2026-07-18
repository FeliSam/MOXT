import { useState } from 'react'
import { PosterUploader } from '../components/ui/PosterUploader'
import { storageService } from '../services/storageService'
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiMapPin,
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
import { createJob } from '../features/jobs/jobSlice'
import {
  JOB_CONTRACT_OPTIONS,
  JOB_EXPERIENCE_OPTIONS,
  JOB_LANGUAGE_OPTIONS,
  JOB_PUBLISH_STEPS,
  JOB_SALARY_PERIOD_OPTIONS,
  JOB_SECTOR_OPTIONS,
} from '../features/jobs/jobPublishConfig'
import { useScrollToTopOnStep } from '../hooks/useScrollToTopOnStep'
import { BusinessPublishNotice } from '../features/businesses/BusinessPublishNotice'
import { canPublishAsBusinessFor } from '../features/businesses/businessPublishUtils'
import { addToast } from '../features/ui/uiSlice'
import { SecurityGatePanel } from '../features/security/SecurityGatePanel'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { initialCatalogStatus } from '@moxt/shared/auth/userSecurity.js'
import { useLanguage } from '../contexts/useLanguage'
import { jobContractLabel, jobSectorLabel } from '../features/jobs/jobDisplayUtils'
import {
  publishOptionLabel,
  publishOptionSub,
  publishText,
} from '../features/publications/publishI18n'

const STEPS = JOB_PUBLISH_STEPS

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

export function PublishJobPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { requirePublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const eligibleBusiness = canPublishAsBusinessFor(business, 'job')

  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const [errors, setErrors] = useState({})
  const [shareModal, setShareModal] = useState(null)
  const [photos, setPhotos] = useState([])
  const [publishing, setPublishing] = useState(false)

  function addPhotos(files) {
    const added = Array.from(files)
      .slice(0, 5 - photos.length)
      .filter(
        (file) =>
          !file.type ||
          file.type.startsWith('image/') ||
          /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i.test(file.name),
      )
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
      if (!form.title.trim())
        errs.title = publishText(t, 'publish.job.validation.titleRequired')
      if (!form.sector) errs.sector = publishText(t, 'publish.job.validation.sectorRequired')
    }
    if (n === 2) {
      if (!form.description.trim() || form.description.trim().length < 30)
        errs.description = publishText(t, 'publish.job.validation.descriptionMin')
      if (!form.salary.trim())
        errs.salary = publishText(t, 'publish.job.validation.salaryRequired')
    }
    if (n === 3) {
      if (!form.location.trim())
        errs.location = publishText(t, 'publish.job.validation.locationRequired')
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
    if (form.publisherType === 'business' && !eligibleBusiness) {
      dispatch(
        addToast({
          title: publishText(t, 'publish.common.toasts.businessBlockedTitle'),
          message: publishText(t, 'publish.job.toasts.businessBlockedMessage'),
          tone: 'error',
        }),
      )
      return
    }
    const publishAsBusiness = form.publisherType === 'business' && eligibleBusiness
    const jobId = `JOB-${Date.now().toString(36).toUpperCase()}`
    setPublishing(true)
    let images = []
    try {
      if (photos.length) {
        images = await storageService.uploadJobImages(
          user.id,
          jobId,
          photos.map((photo) => photo.file),
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
    const action = dispatch(
      createJob({
        ...form,
        id: jobId,
        images,
        salary: form.salary.toUpperCase().includes('RUB') ? form.salary : `${form.salary} RUB`,
        ownerId: user.id,
        publisherName: publishAsBusiness ? business.name : `${user.firstName} ${user.lastName}`,
        businessId: publishAsBusiness ? business.id : null,
        status: initialCatalogStatus(user),
      }),
    )
    setPublishing(false)
    triggerBurst()
    const live = action.payload?.status === 'active'
    dispatch(
      addToast({
        title: live
          ? publishText(t, 'publish.job.toasts.publishedTitle')
          : publishText(t, 'publish.job.toasts.pendingTitle'),
        message: live
          ? publishText(t, 'publish.job.toasts.publishedMessage')
          : publishText(t, 'publish.job.toasts.pendingMessage'),
        tone: 'success',
      }),
    )
    setShareModal({ sourceId: action.payload.id, sourceData: action.payload })
  }

  const selectedSector = JOB_SECTOR_OPTIONS.find((s) => s.value === form.sector)

  return (
    <SecurityGatePanel kind="publish" backTo="/jobs">
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
          {publishText(t, 'publish.job.back')}
        </Button>
        <h1 className="text-xl font-black">{publishText(t, 'publish.job.title')}</h1>
      </div>

      <Card className="px-6 py-5">
        <Stepper step={step} onGoTo={setStep} t={t} />
      </Card>

      {step === 1 ? (
        <div className="grid gap-5">
          <Card className="grid gap-5">
            <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <FiBriefcase />
              </span>
              <h2 className="font-black">{publishText(t, 'publish.job.sections.role')}</h2>
            </div>
            <Input
              id="job-title"
              label={publishText(t, 'publish.job.fields.title')}
              placeholder={publishText(t, 'publish.job.fields.titlePlaceholder')}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
            />

            <div>
              <p className="mb-3 text-sm font-bold">{publishText(t, 'publish.job.fields.sector')}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {JOB_SECTOR_OPTIONS.map((sector) => {
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
                        {jobSectorLabel(t, sector.value)}
                      </span>
                    </button>
                  )
                })}
              </div>
              {errors.sector ? <p className="mt-2 text-xs text-red-600">{errors.sector}</p> : null}
              {selectedSector ? (
                <p className="mt-2 text-xs text-[var(--app-text-muted)]">
                  {publishText(t, 'publish.job.fields.sectorSelected')}{' '}
                  <strong>{jobSectorLabel(t, selectedSector.value)}</strong>
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="grid gap-5">
            <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                <FiUsers />
              </span>
              <h2 className="font-black">{publishText(t, 'publish.job.sections.contract')}</h2>
            </div>
            <div>
              <p className="mb-3 text-sm font-bold">
                {publishText(t, 'publish.job.fields.contractType')}
              </p>
              <div className="flex flex-wrap gap-2">
                {JOB_CONTRACT_OPTIONS.map((c) => (
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
                    {jobContractLabel(t, c.value)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">
                {publishText(t, 'publish.job.fields.experience')}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {JOB_EXPERIENCE_OPTIONS.map((level) => (
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
                    <span className="text-xs font-black">{publishOptionLabel(t, level)}</span>
                    <span className="text-[10px] text-[var(--app-text-muted)]">
                      {publishOptionSub(t, level)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Select
              id="job-lang"
              label={publishText(t, 'publish.job.fields.language')}
              value={form.language}
              onChange={(e) => set('language', e.target.value)}
            >
              {JOB_LANGUAGE_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {publishOptionLabel(t, l)}
                </option>
              ))}
            </Select>
          </Card>
        </div>
      ) : null}

      {step === 2 ? (
        <Card className="grid gap-5">
          <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiDollarSign />
            </span>
            <h2 className="font-black">{publishText(t, 'publish.job.sections.details')}</h2>
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.job.fields.description')}{' '}
              <span className="font-normal text-[var(--app-text-muted)]">
                {publishText(t, 'publish.job.fields.descriptionMin')}
              </span>
            </span>
            <textarea
              className="min-h-32 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder={publishText(t, 'publish.job.fields.descriptionPlaceholder')}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
            {errors.description ? <span className="text-xs text-red-600">{errors.description}</span> : null}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.job.fields.requirements')}
            </span>
            <textarea
              className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder={publishText(t, 'publish.job.fields.requirementsPlaceholder')}
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.job.fields.benefits')}
            </span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              placeholder={publishText(t, 'publish.job.fields.benefitsPlaceholder')}
              value={form.benefits}
              onChange={(e) => set('benefits', e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="job-salary"
              label={publishText(t, 'publish.job.fields.salary')}
              placeholder={publishText(t, 'publish.job.fields.salaryPlaceholder')}
              value={form.salary}
              onChange={(e) => set('salary', e.target.value)}
              error={errors.salary}
            />
            <Select
              id="job-salary-period"
              label={publishText(t, 'publish.job.fields.salaryPeriod')}
              value={form.salaryPeriod}
              onChange={(e) => set('salaryPeriod', e.target.value)}
            >
              {JOB_SALARY_PERIOD_OPTIONS.map((period) => (
                <option key={period.value} value={period.value}>
                  {publishOptionLabel(t, period)}
                </option>
              ))}
            </Select>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="grid gap-5">
          <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <FiMapPin />
            </span>
            <h2 className="font-black">{publishText(t, 'publish.job.sections.location')}</h2>
          </div>
          <CitySelector
            id="job-location"
            label={publishText(t, 'publish.job.fields.location')}
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
              <p className="text-sm font-bold">{publishText(t, 'publish.job.fields.remote')}</p>
              <p className="text-xs text-[var(--app-text-muted)]">
                {publishText(t, 'publish.job.fields.remoteHint')}
              </p>
            </div>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="job-start"
              label={publishText(t, 'publish.job.fields.startDate')}
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
            <Input
              id="job-deadline"
              label={publishText(t, 'publish.job.fields.deadline')}
              type="date"
              value={form.applicationDeadline}
              onChange={(e) => set('applicationDeadline', e.target.value)}
            />
          </div>
          <PosterUploader
            photos={photos}
            onAdd={addPhotos}
            onRemove={removePhoto}
            label={publishText(t, 'publish.job.fields.posters')}
            hint={publishText(t, 'publish.job.fields.postersHint')}
          />
          {business ? (
            <BusinessPublishNotice business={business} contentType="job" className="mb-1" />
          ) : null}
          <Select
            id="job-publisher"
            label={publishText(t, 'publish.job.fields.publisherProfile')}
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
              {publishText(t, 'publish.job.fields.publisherPersonal', {
                name: `${user.firstName} ${user.lastName}`,
              })}
            </option>
            {eligibleBusiness ? (
              <option value="business">
                {publishText(t, 'publish.job.fields.publisherBusiness', {
                  name: business.name,
                })}
              </option>
            ) : null}
          </Select>
          <p className="text-xs leading-5 text-[var(--app-text-muted)]">
            {publishText(t, 'publish.job.fields.publisherHint')}
          </p>
        </Card>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-5">
          <Card className="grid gap-4">
            <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <FiCheckCircle />
              </span>
              <h2 className="font-black">{publishText(t, 'publish.job.sections.review')}</h2>
            </div>
            {[
              [publishText(t, 'publish.job.review.role'), form.title],
              [publishText(t, 'publish.job.review.sector'), jobSectorLabel(t, form.sector)],
              [
                publishText(t, 'publish.job.review.contract'),
                jobContractLabel(t, form.contractType),
              ],
              [
                publishText(t, 'publish.job.review.salary'),
                publishText(t, 'publish.job.review.salaryValue', {
                  salary: form.salary,
                  period: form.salaryPeriod,
                }),
              ],
              [
                publishText(t, 'publish.job.review.location'),
                form.remote
                  ? publishText(t, 'publish.job.review.locationRemote', {
                      location: form.location,
                    })
                  : form.location,
              ],
              [publishText(t, 'publish.job.review.publisher'), form.publisherName],
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
              {publishText(t, 'publish.job.review.successHint')}
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
            {publishText(t, 'publish.job.nav.publish')}
          </Button>
        )}
      </div>
    </div>
    </>
    </SecurityGatePanel>
  )
}
