import { useFormik } from 'formik'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import {
  EXTRA_FIELD_META,
  LISTING_TYPES_META,
  categoriesForType,
  listingRulesFor,
} from '../config/listingConfig'
import { LISTING_CONDITIONS } from '../config/options'
import { constrainRussianPhone, ensurePhoneCountry, phonePlaceholder } from '../config/phone'
import { listingSchemaFor } from '../features/marketplace/marketplaceSchemas'
import { useGeographyOptions } from '../hooks/useGeographyOptions'
import { updateListing } from '../features/marketplace/marketplaceSlice'

export function EditListingPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { listingId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const { cities } = useGeographyOptions()
  const listing = useSelector((state) =>
    state.marketplace.items.find((item) => item.id === listingId),
  )
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
      imageUrls: listing?.images?.join('\n') || '',
      condition: listing?.condition || 'used',
      brand: listing?.brand || '',
      model: listing?.model || '',
      color: listing?.color || '',
      stock: listing?.stock ?? 1,
      deliveryFee: listing?.deliveryFee || 0,
      deliveryDelay: listing?.deliveryDelay || '',
      warranty: listing?.warranty || '',
      returnPolicy: listing?.returnPolicy || '',
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
    validationSchema: listingSchemaFor('RU'),
    onSubmit: (values) => {
      dispatch(
        updateListing({
          id: listingId,
          ownerId: user.id,
          changes: {
            ...values,
            images: values.imageUrls
              .split(/[\n,]/)
              .map((url) => url.trim())
              .filter(Boolean)
              .slice(0, 3),
          },
        }),
      )
      navigate(`/marketplace/${listingId}`)
    },
  })

  if (!listing) return <Card>Annonce introuvable.</Card>
  if (listing.ownerId !== user.id) return <Navigate to={`/marketplace/${listing.id}`} replace />
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)
  const rules = listingRulesFor(formik.values.type)
  const categories = categoriesForType(formik.values.type)

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Marketplace"
        title="Modifier l'annonce"
        description="Mettez à jour les informations, le prix et la galerie."
        actions={
          <Link to={`/marketplace/${listing.id}`}>
            <Button variant="secondary" icon={FiArrowLeft}>
              Annuler
            </Button>
          </Link>
        }
      />
      <Card className="mx-auto w-full max-w-3xl">
        <form className="grid gap-4" onSubmit={formik.handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Type"
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
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Catégorie"
              {...formik.getFieldProps('category')}
              error={errorFor('category')}
            >
              <option value="">Sélectionner</option>
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <Input label="Titre" placeholder="Ex : iPhone 14 Pro 256 Go Noir" {...formik.getFieldProps('title')} error={errorFor('title')} />
          {rules.showCondition ? (
            <Select
              label="État"
              {...formik.getFieldProps('condition')}
              error={errorFor('condition')}
            >
              {LISTING_CONDITIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : null}
          {rules.showStock ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Stock" type="number" min="0" placeholder="Ex : 10" {...formik.getFieldProps('stock')} />
            </div>
          ) : null}
          {rules.showBrandModel ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Marque" placeholder="Ex : Samsung, Nike…" {...formik.getFieldProps('brand')} />
              <Input label="Modèle" placeholder="Ex : Galaxy S23, Air Max…" {...formik.getFieldProps('model')} />
              <Input label="Couleur" placeholder="Ex : Noir, Blanc…" {...formik.getFieldProps('color')} />
            </div>
          ) : null}
          {rules.extraFields.length ? (
            <section className="grid gap-4 rounded-2xl bg-[var(--app-surface-muted)] p-4">
              <h2 className="font-black">Informations spécifiques</h2>
              {rules.extraFields.map((field) => (
                <DynamicField key={field} field={field} formik={formik} error={errorFor(field)} />
              ))}
            </section>
          ) : null}
          <FieldArea
            label="Description"
            field="description"
            formik={formik}
            error={errorFor('description')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prix en RUB"
              type="number"
              {...formik.getFieldProps('price')}
              error={errorFor('price')}
            />
            <Input label="Devise" value="RUB" disabled />
          </div>
          <Input label="Pays" value="Russie" disabled />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Ville en Russie"
              placeholder="Ex : Moscou, Saint-Pétersbourg…"
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
              label="Quartier"
              placeholder="Ex : Tverski, Arbat…"
              {...formik.getFieldProps('district')}
              error={errorFor('district')}
            />
          </div>
          <Input
            label="Adresse complète en Russie"
            placeholder="Ex : Tverskaya 12, appartement 45, Moscou"
            {...formik.getFieldProps('address')}
            error={errorFor('address')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contact"
              type="tel"
              placeholder={phonePlaceholder('RU')}
              {...formik.getFieldProps('contact')}
              onChange={(event) =>
                formik.setFieldValue('contact', constrainRussianPhone(event.target.value))
              }
              error={errorFor('contact')}
            />
            <Input
              label="WhatsApp"
              type="tel"
              placeholder={phonePlaceholder('RU')}
              {...formik.getFieldProps('whatsapp')}
              onChange={(event) =>
                formik.setFieldValue('whatsapp', constrainRussianPhone(event.target.value))
              }
              error={errorFor('whatsapp')}
            />
          </div>
          <FieldArea label="Images, maximum 3" field="imageUrls" formik={formik} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Frais de livraison"
              type="number"
              placeholder="Ex : 300 (en RUB)"
              {...formik.getFieldProps('deliveryFee')}
            />
            <Input label="Délai de livraison" placeholder="Ex : 2-3 jours" {...formik.getFieldProps('deliveryDelay')} />
          </div>
          <Input label="Garantie" placeholder="Ex : 12 mois constructeur" {...formik.getFieldProps('warranty')} />
          <Input label="Politique de retour" placeholder="Ex : Retour sous 7 jours, état neuf" {...formik.getFieldProps('returnPolicy')} />
          <Button type="submit" icon={FiSave}>
            Enregistrer
          </Button>
        </form>
      </Card>
    </div>
  )
}

function DynamicField({ error, field, formik }) {
  const meta = EXTRA_FIELD_META[field]
  if (!meta) return null
  if (meta.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" {...formik.getFieldProps(field)} checked={formik.values[field]} />
        {meta.label}
      </label>
    )
  }
  if (meta.type === 'select') {
    return (
      <Select label={meta.label} {...formik.getFieldProps(field)} error={error}>
        {meta.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    )
  }
  return (
    <Input
      label={meta.label}
      type={meta.type || 'text'}
      placeholder={meta.placeholder}
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
