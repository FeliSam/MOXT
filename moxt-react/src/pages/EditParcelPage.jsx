import { FiArrowLeft, FiCheck, FiFileText, FiSave, FiUpload, FiX } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { constrainRussianPhone, phonePlaceholder } from '../config/phone'
import { updateParcel } from '../features/parcels/parcelSlice'
import { PARCEL_ACCEPTED_TYPES } from '../features/parcels/parcelPublishConfig'
import { useLanguage } from '../contexts/useLanguage'
import { publishOptionLabel, publishOptionSub, publishText } from '../features/publications/publishI18n'
import { storageService } from '../services/storageService'
import { addToast } from '../features/ui/uiSlice'
import { createId } from '../services/createId'

export function EditParcelPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { parcelId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const parcel = useSelector((state) => state.parcels.items.find((item) => item.id === parcelId))

  const [form, setForm] = useState(null)
  const [proofError, setProofError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!parcel) return <Card>{publishText(t, 'publish.parcel.edit.notFound')}</Card>
  if (parcel.ownerId !== user.id) return <Navigate to={`/parcels/${parcelId}`} replace />

  const values = form ?? {
    origin: parcel.origin || '',
    destination: parcel.destination || '',
    originAirportCode: parcel.originAirportCode || '',
    destinationAirportCode: parcel.destinationAirportCode || '',
    departureDate: parcel.departureDate ? parcel.departureDate.slice(0, 10) : '',
    depositDeadline: parcel.depositDeadline ? parcel.depositDeadline.slice(0, 10) : '',
    distributionDate: parcel.distributionDate ? parcel.distributionDate.slice(0, 10) : '',
    capacityKg: parcel.capacityKg ?? 20,
    pricePerKg: parcel.pricePerKg ?? 900,
    maxWeightPerItem: parcel.maxWeightPerItem || '',
    acceptedTypes: Array.isArray(parcel.acceptedTypes) ? parcel.acceptedTypes : [],
    rejectedTypes: parcel.rejectedTypes || '',
    conditions: parcel.conditions || '',
    contact: parcel.contact || '',
    travelProofFile: parcel.travelProofUrl
      ? {
          name: parcel.travelProofName || 'preuve-voyage',
          size: parcel.travelProofSize || 0,
          type: parcel.travelProofType || '',
          url: parcel.travelProofUrl,
          existing: true,
        }
      : null,
  }

  function set(field, value) {
    setForm((prev) => ({ ...(prev ?? values), [field]: value }))
  }

  function toggleType(value) {
    set(
      'acceptedTypes',
      values.acceptedTypes.includes(value)
        ? values.acceptedTypes.filter((item) => item !== value)
        : [...values.acceptedTypes, value],
    )
  }

  async function handleProofFile(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setProofError(publishText(t, 'publish.parcel.toasts.fileTooLarge.inline'))
      return
    }
    setProofError('')
    set('travelProofFile', { name: file.name, size: file.size, type: file.type, uploading: true })
    try {
      const url = await storageService.uploadParcelProof(user.id, parcelId || createId('DRAFT'), file)
      set('travelProofFile', { name: file.name, size: file.size, type: file.type, url })
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const { travelProofFile, ...rest } = values
      dispatch(
        updateParcel({
          ...rest,
          id: parcelId,
          ownerId: user.id,
          capacityKg: Number(values.capacityKg),
          pricePerKg: Number(values.pricePerKg),
          travelProofName: travelProofFile?.name || null,
          travelProofType: travelProofFile?.type || null,
          travelProofSize: travelProofFile?.size || null,
          travelProofUrl: travelProofFile?.url || null,
        }),
      )
      navigate(`/parcels/${parcelId}`)
    } finally {
      setSaving(false)
    }
  }

  const proofIsImage =
    values.travelProofFile?.url &&
    (values.travelProofFile.type?.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i.test(values.travelProofFile.name || ''))

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={publishText(t, 'publish.parcel.edit.eyebrow')}
        title={publishText(t, 'publish.parcel.edit.title')}
        description={publishText(t, 'publish.parcel.edit.description')}
        actions={
          <Link to={`/parcels/${parcelId}`}>
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
              label={publishText(t, 'publish.parcel.fields.originCity')}
              value={values.origin}
              onChange={(e) => set('origin', e.target.value)}
            />
            <Input
              label={publishText(t, 'publish.parcel.fields.destinationCity')}
              value={values.destination}
              onChange={(e) => set('destination', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label={publishText(t, 'publish.parcel.fields.departureDate')}
              type="date"
              value={values.departureDate}
              onChange={(e) => set('departureDate', e.target.value)}
            />
            <Input
              label={publishText(t, 'publish.parcel.fields.depositDeadline')}
              type="date"
              value={values.depositDeadline}
              onChange={(e) => set('depositDeadline', e.target.value)}
            />
            <Input
              label={publishText(t, 'publish.parcel.fields.distributionDate')}
              type="date"
              value={values.distributionDate}
              onChange={(e) => set('distributionDate', e.target.value)}
            />
          </div>
          <div>
            <p className="mb-3 text-sm font-bold">
              {publishText(t, 'publish.parcel.fields.acceptedTypesTitle')}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PARCEL_ACCEPTED_TYPES.map((typeItem) => {
                const sel = values.acceptedTypes.includes(typeItem.value)
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
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${
                        sel ? 'bg-white/50 dark:bg-black/20' : 'bg-[var(--app-surface-muted)]'
                      }`}
                    >
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={publishText(t, 'publish.parcel.fields.capacityKg')}
              type="number"
              min="1"
              value={values.capacityKg}
              onChange={(e) => set('capacityKg', e.target.value)}
            />
            <Input
              label={publishText(t, 'publish.parcel.fields.maxWeightPerItem')}
              type="number"
              min="0"
              value={values.maxWeightPerItem}
              onChange={(e) => set('maxWeightPerItem', e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={publishText(t, 'publish.parcel.fields.pricePerKgRub')}
              type="number"
              min="0"
              value={values.pricePerKg}
              onChange={(e) => set('pricePerKg', e.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.parcel.fields.rejectedTypes')}
            </span>
            <textarea
              className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              value={values.rejectedTypes}
              onChange={(e) => set('rejectedTypes', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.parcel.fields.conditions')}
            </span>
            <textarea
              className="min-h-28 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              value={values.conditions}
              onChange={(e) => set('conditions', e.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">
              {publishText(t, 'publish.parcel.fields.travelProof')}
            </span>
            {values.travelProofFile ? (
              <div className="grid gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                {proofIsImage ? (
                  <img
                    src={values.travelProofFile.url}
                    alt={values.travelProofFile.name}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ) : null}
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40">
                    <FiFileText className="text-lg" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{values.travelProofFile.name}</p>
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {values.travelProofFile.uploading
                        ? publishText(t, 'publish.parcel.fields.travelProofUploading')
                        : publishText(t, 'publish.parcel.fields.travelProofReady')}
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
                <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--app-border)] px-3 text-sm font-bold text-[var(--app-text-muted)] transition hover:border-brand-400 hover:text-brand-700">
                  <FiUpload /> {publishText(t, 'publish.parcel.fields.travelProofChoose')}
                  <input
                    className="sr-only"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleProofFile(e.target.files?.[0])}
                  />
                </label>
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
            {proofError ? <p className="text-xs font-bold text-red-600">{proofError}</p> : null}
          </label>
          <Input
            label={publishText(t, 'publish.parcel.fields.contact')}
            type="tel"
            placeholder={phonePlaceholder('RU')}
            value={values.contact}
            onChange={(e) => set('contact', constrainRussianPhone(e.target.value))}
          />
          <Button type="submit" icon={FiSave} loading={saving} disabled={saving}>
            {publishText(t, 'publish.common.saveChanges')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
