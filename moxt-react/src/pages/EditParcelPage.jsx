import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { constrainRussianPhone, phonePlaceholder } from '../config/phone'
import { updateParcel } from '../features/parcels/parcelSlice'
import { useLanguage } from '../contexts/useLanguage'
import { publishText } from '../features/publications/publishI18n'

export function EditParcelPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { parcelId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const parcel = useSelector((state) => state.parcels.items.find((item) => item.id === parcelId))

  const [form, setForm] = useState(null)

  if (!parcel) return <Card>{publishText(t, 'publish.parcel.edit.notFound')}</Card>
  if (parcel.ownerId !== user.id) return <Navigate to={`/parcels/${parcelId}`} replace />

  const values = form ?? {
    origin: parcel.origin || '',
    destination: parcel.destination || '',
    departureDate: parcel.departureDate ? parcel.departureDate.slice(0, 10) : '',
    depositDeadline: parcel.depositDeadline ? parcel.depositDeadline.slice(0, 10) : '',
    distributionDate: parcel.distributionDate ? parcel.distributionDate.slice(0, 10) : '',
    capacityKg: parcel.capacityKg ?? 20,
    pricePerKg: parcel.pricePerKg ?? 900,
    maxWeightPerItem: parcel.maxWeightPerItem || '',
    rejectedTypes: parcel.rejectedTypes || '',
    conditions: parcel.conditions || '',
    contact: parcel.contact || '',
  }

  function set(field, value) {
    setForm((prev) => ({ ...(prev ?? values), [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    dispatch(updateParcel({
      ...values,
      id: parcelId,
      ownerId: user.id,
      capacityKg: Number(values.capacityKg),
      pricePerKg: Number(values.pricePerKg),
    }))
    navigate(`/parcels/${parcelId}`)
  }

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
          <Input
            label={publishText(t, 'publish.parcel.fields.contact')}
            type="tel"
            placeholder={phonePlaceholder('RU')}
            value={values.contact}
            onChange={(e) => set('contact', constrainRussianPhone(e.target.value))}
          />
          <Button type="submit" icon={FiSave}>
            {publishText(t, 'publish.common.saveChanges')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
