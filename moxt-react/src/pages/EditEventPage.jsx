import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { CitySelector } from '../components/ui/CitySelector'
import { PageHeader } from '../components/ui/PageHeader'
import { PosterUploader } from '../components/ui/PosterUploader'
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_PUBLISH_CATEGORIES,
} from '../features/events/eventPublishConfig'
import { updateEvent } from '../features/events/eventSlice'
import { useLanguage } from '../contexts/useLanguage'
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

export function EditEventPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { eventId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const event = useSelector((state) => state.events.items.find((item) => item.id === eventId))

  const [form, setForm] = useState(null)
  const [gallery, setGallery] = useState({ entityId: null, photos: [] })
  const [saving, setSaving] = useState(false)

  if (!event) return <Card>{publishText(t, 'publish.event.edit.notFound')}</Card>
  if (event.ownerId !== user.id) return <Navigate to={`/events/${eventId}`} replace />

  const photos =
    gallery.entityId === event.id ? gallery.photos : mapExistingImages(event.images)

  function updatePhotos(updater) {
    const current =
      gallery.entityId === event.id ? gallery.photos : mapExistingImages(event.images)
    setGallery({
      entityId: event.id,
      photos: typeof updater === 'function' ? updater(current) : updater,
    })
  }

  const values = form ?? {
    title: event.title || '',
    category: event.category || '',
    format: event.format || 'in_person',
    language: event.language || 'fr',
    description: event.description || '',
    program: event.program || '',
    speakers: event.speakers || '',
    startAt: event.startAt ? event.startAt.slice(0, 16) : '',
    endAt: event.endAt ? event.endAt.slice(0, 16) : '',
    registrationDeadline: event.registrationDeadline
      ? event.registrationDeadline.slice(0, 10)
      : '',
    city: event.city || '',
    venue: event.venue || '',
    address: event.address || '',
    onlineLink: event.onlineLink || '',
    capacity: event.capacity ?? 50,
    price: event.price ?? 0,
    freeEntry: Number(event.price || 0) === 0,
    organizerName: event.organizerName || '',
    organizerContact: event.organizerContact || '',
  }

  function set(field, value) {
    setForm((prev) => ({ ...(prev ?? values), [field]: value }))
  }

  function addPhotos(files) {
    const added = Array.from(files)
      .slice(0, 5 - photos.length)
      .filter((file) => file.type.startsWith('image/'))
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
        ? await storageService.uploadEventImages(
            user.id,
            eventId,
            newPhotos.map((photo) => photo.file),
            { version: Date.now().toString(36) },
          )
        : []
      let uploadIndex = 0
      const images = photos.map((photo) => (photo.existing ? photo.url : uploaded[uploadIndex++]))
      dispatch(
        updateEvent({
          ...values,
          id: eventId,
          ownerId: user.id,
          images,
          price: values.freeEntry ? 0 : Number(values.price),
          capacity: Number(values.capacity),
        }),
      )
      navigate(`/events/${eventId}`)
    } catch (error) {
      dispatch(
        addToast({
          title: publishText(t, 'publish.common.toasts.imagesFailedTitle'),
          message: error.message || publishText(t, 'publish.common.toasts.retry'),
          tone: 'error',
        }),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={publishText(t, 'publish.event.edit.eyebrow')}
        title={publishText(t, 'publish.event.edit.title')}
        description={publishText(t, 'publish.event.edit.description')}
        actions={
          <Link to={`/events/${eventId}`}>
            <Button variant="secondary" icon={FiArrowLeft}>
              {t('common.cancel')}
            </Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-3xl">
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <Input
            label={publishText(t, 'publish.event.fields.title')}
            required
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={publishText(t, 'publish.event.fields.category')}
              value={values.category}
              onChange={(e) => set('category', e.target.value)}
            >
              <option value="">{publishText(t, 'publish.event.fields.selectCategory')}</option>
              {EVENT_PUBLISH_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {publishOptionLabel(t, cat)}
                </option>
              ))}
            </Select>
            <Select
              label={publishText(t, 'publish.event.fields.format')}
              value={values.format}
              onChange={(e) => set('format', e.target.value)}
            >
              {EVENT_FORMAT_OPTIONS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>
                  {publishOptionLabel(t, fmt)}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={publishText(t, 'publish.event.fields.start')}
              type="datetime-local"
              value={values.startAt}
              onChange={(e) => set('startAt', e.target.value)}
            />
            <Input
              label={publishText(t, 'publish.event.fields.end')}
              type="datetime-local"
              value={values.endAt}
              onChange={(e) => set('endAt', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={publishText(t, 'publish.event.fields.registrationDeadline')}
              type="date"
              value={values.registrationDeadline}
              onChange={(e) => set('registrationDeadline', e.target.value)}
            />
            <Input
              label={publishText(t, 'publish.event.fields.capacity')}
              type="number"
              min="1"
              value={values.capacity}
              onChange={(e) => set('capacity', e.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.event.fields.description')}
            </span>
            <textarea
              className="min-h-32 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.event.fields.program')}
            </span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5 text-sm"
              value={values.program}
              onChange={(e) => set('program', e.target.value)}
            />
          </label>
          <Input
            label={publishText(t, 'publish.event.fields.speakers')}
            value={values.speakers}
            onChange={(e) => set('speakers', e.target.value)}
          />
          <PosterUploader
            photos={photos}
            onAdd={addPhotos}
            onRemove={removePhoto}
            label={publishText(t, 'publish.event.fields.posters')}
            hint={publishText(t, 'publish.event.fields.postersHint')}
          />
          {values.format !== 'online' ? (
            <>
              <CitySelector
                label={publishText(t, 'publish.event.fields.city')}
                value={values.city}
                onChange={(city) => set('city', city)}
              />
              <Input
                label={publishText(t, 'publish.event.fields.venue')}
                value={values.venue}
                onChange={(e) => set('venue', e.target.value)}
              />
              <Input
                label={publishText(t, 'publish.event.fields.address')}
                value={values.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </>
          ) : null}
          {values.format !== 'in_person' ? (
            <Input
              label={publishText(t, 'publish.event.fields.onlineLink')}
              value={values.onlineLink}
              onChange={(e) => set('onlineLink', e.target.value)}
            />
          ) : null}
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
              values.freeEntry
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-[var(--app-border)]'
            }`}
          >
            <input
              type="checkbox"
              checked={values.freeEntry}
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
          {!values.freeEntry ? (
            <Input
              label={publishText(t, 'publish.event.fields.price')}
              type="number"
              min="0"
              value={values.price}
              onChange={(e) => set('price', e.target.value)}
            />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={publishText(t, 'publish.event.fields.organizerName')}
              value={values.organizerName}
              onChange={(e) => set('organizerName', e.target.value)}
            />
            <Input
              label={publishText(t, 'publish.event.fields.organizerContact')}
              value={values.organizerContact}
              onChange={(e) => set('organizerContact', e.target.value)}
            />
          </div>
          <Button type="submit" icon={FiSave} loading={saving} disabled={saving}>
            {publishText(t, 'publish.common.saveChanges')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
