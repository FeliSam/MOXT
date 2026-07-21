import { useFormik } from 'formik'
import { useState } from 'react'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { PosterUploader } from '../components/ui/PosterUploader'
import { Select } from '../components/ui/Select'
import { useUploadProgress } from '../hooks/useUploadProgress'
import {
  EXTRA_FIELD_META,
  LISTING_TYPES_META,
  categoriesForType,
  listingRulesFor,
} from '../config/listingConfig'
import { LISTING_CONDITIONS } from '../config/options'
import { constrainRussianPhone, ensurePhoneCountry, phonePlaceholder } from '../config/phone'
import { listingSchemaFor } from '../features/marketplace/marketplaceSchemas'
import {
  listingOptionLabel,
  marketplaceText,
} from '../features/marketplace/marketplaceI18n'
import { useGeographyOptions } from '../hooks/useGeographyOptions'
import { updateListing } from '../features/marketplace/marketplaceSlice'
import { useLanguage } from '../contexts/useLanguage'
import { storageService } from '../services/storageService'
import { addToast } from '../features/ui/uiSlice'

function mapExistingImages(images = []) {
  return images.map((url, index) => ({
    url,
    name: `image-${index + 1}`,
    existing: true,
  }))
}

export function EditListingPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const mt = (key, vars) => marketplaceText(t, key, vars)
  const { listingId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const { cities } = useGeographyOptions()
  const listing = useSelector((state) =>
    state.marketplace.items.find((item) => item.id === listingId),
  )
  const [gallery, setGallery] = useState({ entityId: null, photos: [] })
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()
  const [saving, setSaving] = useState(false)

  const photos =
    listing && gallery.entityId === listing.id
      ? gallery.photos
      : mapExistingImages(listing?.images)

  function updatePhotos(updater) {
    if (!listing) return
    const current =
      gallery.entityId === listing.id ? gallery.photos : mapExistingImages(listing.images)
    setGallery({
      entityId: listing.id,
      photos: typeof updater === 'function' ? updater(current) : updater,
    })
  }

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      type: listing?.type || 'product',
      category: listing?.category || '',
      title: listing?.title || '',
      description: listing?.description || '',
      price: listing?.price || 0,
      currency: 'RUB',
      country: 'RU',
      city: listing?.city || 'Moscou',
      district: listing?.district || '',
      address: listing?.address || '',
      contact: ensurePhoneCountry(listing?.contact || user.phone, 'RU'),
      whatsapp: ensurePhoneCountry(listing?.whatsapp || user.phone, 'RU'),
      condition: listing?.condition || 'used',
      brand: listing?.brand || '',
      model: listing?.model || '',
      color: listing?.color || '',
      stock: listing?.stock ?? 1,
      deliveryFee: listing?.deliveryFee || 0,
      deliveryDelay: listing?.deliveryDelay || '',
      deliveryOptions: Array.isArray(listing?.deliveryOptions) ? listing.deliveryOptions : [],
      warranty: listing?.warranty || '',
      returnPolicy: listing?.returnPolicy || '',
      hasDiscount: Boolean(listing?.originalPrice && listing?.discountPercent),
      originalPrice: listing?.originalPrice || '',
      discountPercent: listing?.discountPercent || '',
      weight: listing?.weight || '',
      expiryDate: listing?.expiryDate || '',
      ingredients: listing?.ingredients || '',
      availability: listing?.availability || '',
      duration: listing?.duration || '',
      remote: listing?.remote || false,
      deposit: listing?.deposit || '',
      minDuration: listing?.minDuration || '',
      availableFrom: listing?.availableFrom || '',
      year: listing?.year || '',
      mileage: listing?.mileage || '',
      fuel: listing?.fuel || 'gasoline',
      transmission: listing?.transmission || 'manual',
      digitalFormat: listing?.digitalFormat || '',
      fileSize: listing?.fileSize || '',
      reType: listing?.reType || 'apartment',
      surface: listing?.surface || '',
      rooms: listing?.rooms || '',
      floor: listing?.floor || '',
      furnished: listing?.furnished || 'no',
      reTransaction: listing?.reTransaction || 'rent',
      reState: listing?.reState || 'good',
    },
    validationSchema: listingSchemaFor('RU', t),
    onSubmit: async (values) => {
      if (saving) return
      setSaving(true)
      try {
        const newPhotos = photos.filter((photo) => photo.file)
        const uploaded = newPhotos.length
          ? await trackUpload((onProgress) =>
              storageService.uploadListingImages(
                user.id,
                listingId,
                newPhotos.map((photo) => photo.file),
                { version: Date.now().toString(36), onProgress },
              ),
            )
          : []
        let uploadIndex = 0
        const images = photos
          .map((photo) => (photo.existing ? photo.url : uploaded[uploadIndex++]))
          .filter(Boolean)
          .slice(0, 6)
        dispatch(
          updateListing({
            id: listingId,
            ownerId: user.id,
            changes: {
              ...values,
              images,
              originalPrice: values.hasDiscount ? Number(values.originalPrice) || null : null,
              discountPercent: values.hasDiscount ? Number(values.discountPercent) || null : null,
            },
          }),
        )
        navigate(`/marketplace/${listingId}`)
      } catch (error) {
        dispatch(
          addToast({
            title: t('common.error'),
            message: error.message || t('common.retryLater'),
            tone: 'error',
          }),
        )
      } finally {
        setSaving(false)
      }
    },
  })

  if (!listing) return <Card>{mt('marketplace.edit.notFound')}</Card>
  if (listing.ownerId !== user.id) return <Navigate to={`/marketplace/${listing.id}`} replace />
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)
  const rules = listingRulesFor(formik.values.type)
  const categories = categoriesForType(formik.values.type)

  function addPhotos(files) {
    const added = Array.from(files)
      .slice(0, 6 - photos.length)
      .map((file) => ({ file, url: URL.createObjectURL(file), name: file.name }))
    updatePhotos((current) => [...current, ...added])
  }

  function removePhoto(index) {
    updatePhotos((current) => {
      if (current[index]?.file) URL.revokeObjectURL(current[index].url)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={mt('marketplace.common.name')}
        title={mt('marketplace.edit.title')}
        description={mt('marketplace.edit.description')}
        actions={
          <Link to={`/marketplace/${listing.id}`}>
            <Button variant="secondary" icon={FiArrowLeft}>
              {mt('marketplace.common.cancel')}
            </Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-3xl">
        <form className="grid gap-4" onSubmit={formik.handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={mt('marketplace.common.type')}
              name="type"
              value={formik.values.type}
              onBlur={formik.handleBlur}
              onChange={(event) => {
                formik.setFieldValue('type', event.target.value)
                formik.setFieldValue('category', '')
              }}
            >
              {LISTING_TYPES_META.map((option) => (
                <option key={option.value} value={option.value}>
                  {listingOptionLabel(t, option)}
                </option>
              ))}
            </Select>
            <Select
              label={mt('marketplace.common.category')}
              {...formik.getFieldProps('category')}
              error={errorFor('category')}
            >
              <option value="">{mt('marketplace.common.select')}</option>
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {listingOptionLabel(t, option)}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label={mt('marketplace.common.title')}
            placeholder={mt('marketplace.edit.titlePlaceholder')}
            {...formik.getFieldProps('title')}
            error={errorFor('title')}
          />
          {rules.showCondition ? (
            <Select
              label={mt('marketplace.common.condition')}
              {...formik.getFieldProps('condition')}
              error={errorFor('condition')}
            >
              {LISTING_CONDITIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {listingOptionLabel(t, option)}
                </option>
              ))}
            </Select>
          ) : null}
          {rules.showStock ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={mt('marketplace.common.stock')}
                type="number"
                min="0"
                placeholder={mt('marketplace.edit.stockPlaceholder')}
                {...formik.getFieldProps('stock')}
              />
            </div>
          ) : null}
          {rules.showBrandModel ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label={mt('marketplace.common.brand')}
                placeholder={mt('marketplace.edit.brandPlaceholder')}
                {...formik.getFieldProps('brand')}
              />
              <Input
                label={mt('marketplace.common.model')}
                placeholder={mt('marketplace.edit.modelPlaceholder')}
                {...formik.getFieldProps('model')}
              />
              <Input
                label={mt('marketplace.common.color')}
                placeholder={mt('marketplace.edit.colorPlaceholder')}
                {...formik.getFieldProps('color')}
              />
            </div>
          ) : null}
          {rules.extraFields.length ? (
            <section className="grid gap-4 rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <h2 className="font-black">{mt('marketplace.edit.specificInfo')}</h2>
              {rules.extraFields.map((field) => (
                <DynamicField key={field} field={field} formik={formik} error={errorFor(field)} t={t} mt={mt} />
              ))}
            </section>
          ) : null}
          <FieldArea
            label={mt('marketplace.common.description')}
            field="description"
            formik={formik}
            error={errorFor('description')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={mt('marketplace.edit.priceInRub')}
              type="number"
              {...formik.getFieldProps('price')}
              error={errorFor('price')}
            />
            <Input label={mt('marketplace.common.currency')} value="RUB" disabled />
          </div>
          <Input label={mt('marketplace.common.country')} value={mt('marketplace.common.russia')} disabled />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={mt('marketplace.edit.cityInRussia')}
              placeholder={mt('marketplace.edit.cityPlaceholder')}
              list="edit-marketplace-russian-cities"
              {...formik.getFieldProps('city')}
              error={errorFor('city')}
            />
            <datalist id="edit-marketplace-russian-cities">
              {cities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
            <Input
              label={mt('marketplace.common.district')}
              placeholder={mt('marketplace.edit.districtPlaceholder')}
              {...formik.getFieldProps('district')}
              error={errorFor('district')}
            />
          </div>
          <Input
            label={mt('marketplace.edit.fullAddress')}
            placeholder={mt('marketplace.edit.addressPlaceholder')}
            {...formik.getFieldProps('address')}
            error={errorFor('address')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={mt('marketplace.common.contact')}
              type="tel"
              placeholder={phonePlaceholder('RU')}
              {...formik.getFieldProps('contact')}
              onChange={(event) =>
                formik.setFieldValue('contact', constrainRussianPhone(event.target.value))
              }
              error={errorFor('contact')}
            />
            <Input
              label={mt('marketplace.common.whatsapp')}
              type="tel"
              placeholder={phonePlaceholder('RU')}
              {...formik.getFieldProps('whatsapp')}
              onChange={(event) =>
                formik.setFieldValue('whatsapp', constrainRussianPhone(event.target.value))
              }
              error={errorFor('whatsapp')}
            />
          </div>
          <PosterUploader
            photos={photos}
            onAdd={addPhotos}
            onRemove={removePhoto}
            max={6}
            label={mt('marketplace.common.photos')}
            hint={mt('marketplace.edit.imagesMax')}
            progress={uploadProgress}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={mt('marketplace.edit.deliveryFee')}
              type="number"
              placeholder={mt('marketplace.edit.deliveryFeePlaceholder')}
              {...formik.getFieldProps('deliveryFee')}
            />
            <Input
              label={mt('marketplace.edit.deliveryDelay')}
              placeholder={mt('marketplace.edit.deliveryDelayPlaceholder')}
              {...formik.getFieldProps('deliveryDelay')}
            />
          </div>
          <Input
            label={mt('marketplace.common.warranty')}
            placeholder={mt('marketplace.edit.warrantyPlaceholder')}
            {...formik.getFieldProps('warranty')}
          />
          <Input
            label={mt('marketplace.common.returnPolicy')}
            placeholder={mt('marketplace.edit.returnPolicyPlaceholder')}
            {...formik.getFieldProps('returnPolicy')}
          />
          <Button type="submit" icon={FiSave} loading={saving} disabled={saving}>
            {mt('marketplace.common.save')}
          </Button>
        </form>
      </Card>
    </div>
  )
}

function DynamicField({ error, field, formik, mt, t }) {
  const meta = EXTRA_FIELD_META[field]
  if (!meta) return null
  const label = meta.labelKey ? mt(meta.labelKey) : meta.label
  const placeholder = meta.placeholderKey ? mt(meta.placeholderKey) : meta.placeholder
  if (meta.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" {...formik.getFieldProps(field)} checked={formik.values[field]} />
        {label}
      </label>
    )
  }
  if (meta.type === 'select') {
    return (
      <Select label={label} {...formik.getFieldProps(field)} error={error}>
        {meta.options.map((option) => (
          <option key={option.value} value={option.value}>
            {listingOptionLabel(t, option)}
          </option>
        ))}
      </Select>
    )
  }
  return (
    <Input
      label={label}
      type={meta.type || 'text'}
      placeholder={placeholder}
      {...formik.getFieldProps(field)}
      error={error}
    />
  )
}

function FieldArea({ error, field, formik, label }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <textarea
        className="min-h-28 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3.5"
        {...formik.getFieldProps(field)}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
