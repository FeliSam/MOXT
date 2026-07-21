import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { CitySelector } from '../components/ui/CitySelector'
import { PosterUploader } from '../components/ui/PosterUploader'
import { PageHeader } from '../components/ui/PageHeader'
import { useUploadProgress } from '../hooks/useUploadProgress'
import {
  JOB_CONTRACT_OPTIONS,
  JOB_EXPERIENCE_OPTIONS,
  JOB_LANGUAGE_OPTIONS,
  JOB_SALARY_PERIOD_OPTIONS,
  JOB_SECTOR_OPTIONS,
} from '../features/jobs/jobPublishConfig'
import { updateJob } from '../features/jobs/jobSlice'
import { useState } from 'react'
import { useLanguage } from '../contexts/useLanguage'
import { jobContractLabel, jobSectorLabel } from '../features/jobs/jobDisplayUtils'
import { publishOptionLabel, publishText } from '../features/publications/publishI18n'
import { storageService } from '../services/storageService'
import { addToast } from '../features/ui/uiSlice'

function mapExistingImages(images = []) {
  return images.map((url, index) => ({
    url,
    name: `image-${index + 1}`,
    existing: true,
  }))
}

export function EditJobPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { jobId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const job = useSelector((state) => state.jobs.items.find((item) => item.id === jobId))

  const [form, setForm] = useState(null)
  const [gallery, setGallery] = useState({ entityId: null, photos: [] })
  const [saving, setSaving] = useState(false)
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()

  if (!job) return <Card>{publishText(t, 'publish.job.edit.notFound')}</Card>
  if (job.ownerId !== user.id) return <Navigate to={`/jobs/${jobId}`} replace />

  const photos =
    gallery.entityId === job.id ? gallery.photos : mapExistingImages(job.images)

  function updatePhotos(updater) {
    const current = gallery.entityId === job.id ? gallery.photos : mapExistingImages(job.images)
    setGallery({
      entityId: job.id,
      photos: typeof updater === 'function' ? updater(current) : updater,
    })
  }

  const values = form ?? {
    title: job.title || '',
    sector: job.sector || '',
    contractType: job.contractType || 'full_time',
    experienceLevel: job.experienceLevel || 'none',
    language: job.language || 'fr_ru',
    salary: job.salary || '',
    salaryPeriod: job.salaryPeriod || 'month',
    description: job.description || '',
    requirements: job.requirements || '',
    benefits: job.benefits || '',
    location: job.location || '',
    remote: job.remote || false,
    startDate: job.startDate || '',
    applicationDeadline: job.applicationDeadline || '',
    publisherName: job.publisherName || '',
    publisherType: job.publisherType || (job.businessId ? 'business' : 'personal'),
  }

  function set(field, value) {
    setForm((prev) => ({ ...(prev ?? values), [field]: value }))
  }

  function addPhotos(files) {
    const added = Array.from(files)
      .slice(0, 5 - photos.length)
      .map((file) => ({ file, url: URL.createObjectURL(file), name: file.name }))
    updatePhotos((current) => [...current, ...added])
  }

  function removePhoto(index) {
    updatePhotos((current) => {
      if (current[index]?.file) URL.revokeObjectURL(current[index].url)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const newPhotos = photos.filter((photo) => photo.file)
      const uploaded = newPhotos.length
        ? await trackUpload((onProgress) =>
            storageService.uploadJobImages(
              user.id,
              jobId,
              newPhotos.map((photo) => photo.file),
              { version: Date.now().toString(36), onProgress },
            ),
          )
        : []
      let uploadIndex = 0
      const images = photos.map((photo) => photo.existing ? photo.url : uploaded[uploadIndex++])
      dispatch(updateJob({ ...values, images, id: jobId, ownerId: user.id }))
      navigate(`/jobs/${jobId}`)
    } catch (error) {
      dispatch(addToast({
        title: publishText(t, 'publish.common.toasts.imagesFailedTitle'),
        message: error.message || publishText(t, 'publish.common.toasts.retry'),
        tone: 'error',
      }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={publishText(t, 'publish.job.edit.eyebrow')}
        title={publishText(t, 'publish.job.edit.title')}
        description={publishText(t, 'publish.job.edit.description')}
        actions={
          <Link to={`/jobs/${jobId}`}>
            <Button variant="secondary" icon={FiArrowLeft}>
              {t('common.cancel')}
            </Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-3xl">
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={publishText(t, 'publish.job.fields.title')}
              required
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
            />
            <Select
              label={publishText(t, 'publish.job.fields.sector')}
              value={values.sector}
              onChange={(e) => set('sector', e.target.value)}
            >
              {!JOB_SECTOR_OPTIONS.some((s) => s.value === values.sector) && values.sector ? (
                <option value={values.sector}>{jobSectorLabel(t, values.sector)}</option>
              ) : null}
              {JOB_SECTOR_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {jobSectorLabel(t, s.value)}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label={publishText(t, 'publish.job.fields.language')}
            value={values.language}
            onChange={(e) => set('language', e.target.value)}
          >
            {JOB_LANGUAGE_OPTIONS.map((language) => (
              <option key={language.value} value={language.value}>
                {publishOptionLabel(t, language)}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={publishText(t, 'publish.job.fields.contractType')}
              value={values.contractType}
              onChange={(e) => set('contractType', e.target.value)}
            >
              {JOB_CONTRACT_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {jobContractLabel(t, c.value)}
                </option>
              ))}
            </Select>
            <Select
              label={publishText(t, 'publish.job.fields.experience')}
              value={values.experienceLevel}
              onChange={(e) => set('experienceLevel', e.target.value)}
            >
              {JOB_EXPERIENCE_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {publishText(t, level.optionKey)}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={publishText(t, 'publish.job.fields.salary')}
              placeholder={publishText(t, 'publish.job.fields.salaryPlaceholder')}
              value={values.salary}
              onChange={(e) => set('salary', e.target.value)}
            />
            <Select
              label={publishText(t, 'publish.job.fields.salaryPeriod')}
              value={values.salaryPeriod}
              onChange={(e) => set('salaryPeriod', e.target.value)}
            >
              {JOB_SALARY_PERIOD_OPTIONS.map((period) => (
                <option key={period.value} value={period.value}>
                  {publishOptionLabel(t, period)}
                </option>
              ))}
            </Select>
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.job.fields.description')}
            </span>
            <textarea
              className="min-h-32 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.job.fields.requirements')}
            </span>
            <textarea
              className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.requirements}
              onChange={(e) => set('requirements', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.job.fields.benefits')}
            </span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.benefits}
              onChange={(e) => set('benefits', e.target.value)}
            />
          </label>
          <CitySelector
            label={publishText(t, 'publish.job.fields.locationShort')}
            value={values.location}
            onChange={(city) => set('location', city)}
          />
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--app-border)] p-4 transition hover:border-brand-400">
            <input
              type="checkbox"
              checked={values.remote}
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
              label={publishText(t, 'publish.job.fields.startDate')}
              type="date"
              value={values.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
            <Input
              label={publishText(t, 'publish.job.fields.deadline')}
              type="date"
              value={values.applicationDeadline}
              onChange={(e) => set('applicationDeadline', e.target.value)}
            />
          </div>
          <Input
            label={publishText(t, 'publish.job.fields.publisherName')}
            value={values.publisherName}
            onChange={(e) => set('publisherName', e.target.value)}
          />
          <PosterUploader
            photos={photos}
            onAdd={addPhotos}
            onRemove={removePhoto}
            label={publishText(t, 'publish.job.fields.posters')}
            hint={publishText(t, 'publish.job.fields.postersHint')}
            progress={uploadProgress}
          />
          <Button type="submit" icon={FiSave} loading={saving} disabled={saving}>
            {publishText(t, 'publish.common.saveChanges')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
