import { useFormik } from 'formik'
import React, { useRef } from 'react'
import { FiCamera, FiCheckCircle, FiFlag, FiMapPin, FiUser } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Alert } from '../components/ui/Alert'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { VerifiedDisplayName } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { CitySelector } from '../components/ui/CitySelector'
import { Select } from '../components/ui/Select'
import { flagEmoji } from '../config/flags'
import { constrainPhone, phonePrefixForCallingCode } from '../config/phone'
import { useLanguage } from '../contexts/useLanguage'
import { profileSchema } from '../features/auth/authSchemas'
import { updateProfile } from '../features/auth/authSlice'
import { addToast } from '../features/ui/uiSlice'
import { useGeographyOptions } from '../hooks/useGeographyOptions'
import { storageService } from '../services/storageService'

function SectionTitle({ icon: Icon, label }) {
  const I = Icon
  return (
    <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
      <span className="grid size-8 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
        <I className="text-sm" />
      </span>
      <h2 className="text-sm font-black uppercase tracking-wide text-[var(--app-text-muted)]">
        {label}
      </h2>
    </div>
  )
}

export function PersonalInformationPage() {
  const dispatch = useDispatch()
  const { language } = useLanguage()
  const { error, status, user } = useSelector((state) => state.auth)
  const { countries } = useGeographyOptions()
  const avatarInputRef = useRef(null)
  const [avatarUploading, setAvatarUploading] = React.useState(false)

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      avatarUrl: user.avatarUrl || '',
      phone: user.phone || '+7',
      secondaryPhone: user.secondaryPhone || '',
      country: 'RU',
      originCountry: user.originCountry || 'BJ',
      city: user.city || 'Moscou',
    },
    validationSchema: profileSchema,
    onSubmit: async (values, helpers) => {
      const result = await dispatch(updateProfile(values))
      if (updateProfile.fulfilled.match(result)) {
        helpers.resetForm({ values })
        dispatch(
          addToast({
            title: 'Profil mis à jour',
            message: 'Vos informations personnelles ont été enregistrées.',
            tone: 'success',
          }),
        )
      }
    },
  })

  const origin = countries.find((item) => item.code === formik.values.originCountry)
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)
  const canEditOrigin = ['admin', 'superadmin'].includes(user.role)

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

  async function handleAvatarFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    formik.setFieldValue('avatarUrl', URL.createObjectURL(file)) // prévisualisation immédiate
    setAvatarUploading(true)
    try {
      const url = await storageService.uploadAvatar(user.id, file)
      formik.setFieldValue('avatarUrl', url)
      dispatch(
        addToast({
          title: 'Photo ajoutée',
          message: 'Votre nouvelle photo de profil est prête à être enregistrée.',
          tone: 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: 'Échec de l’envoi',
          message: err.message || "La photo n'a pas pu être envoyée.",
          tone: 'error',
        }),
      )
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Mon profil"
        title="Informations personnelles"
        description="Gérez votre identité, votre résidence en Russie et vos coordonnées d'origine."
        actions={<BackButton appearance="link" />}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
          {/* Colonne gauche — photo de profil */}
          <div className="grid content-start gap-4">
            <Card className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="relative">
                {formik.values.avatarUrl ? (
                  <img
                    src={formik.values.avatarUrl}
                    alt="Photo de profil"
                    className="size-28 rounded-full object-cover shadow-lg ring-4 ring-[var(--app-accent-soft)]"
                  />
                ) : (
                  <div className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-cyan-600 text-3xl font-black text-white shadow-lg ring-4 ring-[var(--app-accent-soft)]">
                    {initials || <FiUser />}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full bg-brand-700 text-white shadow-md transition hover:bg-brand-800"
                  aria-label="Changer la photo"
                >
                  <FiCamera className="text-sm" />
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarFile}
              />
              <div>
                <VerifiedDisplayName
                  name={`${user.firstName} ${user.lastName}`.trim()}
                  verified={Boolean(user.verified)}
                  className="font-black"
                  iconSize="sm"
                />
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">{user.email}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                icon={FiCamera}
                loading={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarUploading ? 'Envoi...' : 'Choisir une photo'}
              </Button>
              {formik.values.avatarUrl ? (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => formik.setFieldValue('avatarUrl', '')}
                >
                  Supprimer la photo
                </button>
              ) : null}
            </Card>

            <Card className="p-4">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
                Compte
              </p>
              <p className="mt-3 text-sm text-[var(--app-text-muted)]">
                <span className="font-bold text-[var(--app-text)]">E-mail</span>
                <br />
                {user.email}
              </p>
              <p className="mt-3 text-xs text-[var(--app-text-muted)]">
                L'adresse e-mail ne peut pas être modifiée ici. Contactez le support.
              </p>
            </Card>
          </div>

          {/* Colonne droite — formulaire par catégories */}
          <div className="grid content-start gap-6">
            {/* Identité */}
            <Card className="grid gap-5">
              <SectionTitle icon={FiUser} label="Identité" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="profile-firstName"
                  label="Prénom"
                  {...formik.getFieldProps('firstName')}
                  error={errorFor('firstName')}
                />
                <Input
                  id="profile-lastName"
                  label="Nom de famille"
                  {...formik.getFieldProps('lastName')}
                  error={errorFor('lastName')}
                />
              </div>
              <Input
                id="profile-email"
                label="Adresse e-mail"
                value={user.email}
                disabled
                hint="Non modifiable — contactez le support."
              />
            </Card>

            {/* Résidence en Russie */}
            <Card className="grid gap-5">
              <SectionTitle icon={FiMapPin} label="Résidence en Russie" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="profile-country"
                  label="Pays de résidence"
                  value="Russie"
                  disabled
                  hint="Fixé lors de l'inscription."
                />
                <CitySelector
                  id="profile-city"
                  label="Ville en Russie"
                  value={formik.values.city}
                  onChange={(city) => formik.setFieldValue('city', city)}
                  error={errorFor('city')}
                />
              </div>
              <Input
                id="profile-phone"
                label="Numéro russe"
                type="tel"
                placeholder="+7XXXXXXXXXX"
                hint="Format : +7 suivi de 10 chiffres. Requis pour les transferts."
                {...formik.getFieldProps('phone')}
                onChange={(event) =>
                  formik.setFieldValue('phone', constrainPhone(event.target.value, '+7', 10))
                }
                error={errorFor('phone')}
              />
            </Card>

            {/* Pays d'origine */}
            <Card className="grid gap-5">
              <SectionTitle icon={FiFlag} label="Pays d'origine" />
              {canEditOrigin ? (
                <>
                  <Select
                    id="profile-origin-country"
                    label="Pays de provenance"
                    {...formik.getFieldProps('originCountry')}
                    onChange={(event) => {
                      const country = countries.find((item) => item.code === event.target.value)
                      formik.setFieldValue('originCountry', event.target.value)
                      formik.setFieldValue(
                        'secondaryPhone',
                        phonePrefixForCallingCode(country?.callingCode || ''),
                      )
                    }}
                    error={errorFor('originCountry')}
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {flagEmoji(country.code)} {language === 'en' ? country.englishName : country.name}
                      </option>
                    ))}
                  </Select>
                  <Alert variant="info">
                    En tant qu'administrateur, vous pouvez modifier le pays de provenance de ce
                    compte. Pour les autres membres, ce champ reste fixé après l'inscription.
                  </Alert>
                </>
              ) : (
                <Input
                  id="profile-origin-country"
                  label="Pays de provenance"
                  value={`${flagEmoji(formik.values.originCountry)} ${origin?.name || ''}`.trim()}
                  disabled
                  hint="Fixé à la création du compte. Contactez le support pour le modifier."
                />
              )}
              <Input
                id="profile-secondary-phone"
                label={`Téléphone ${origin?.name || "d'origine"} (optionnel)`}
                type="tel"
                placeholder={`${origin?.callingCode || ''}...`}
                hint={`Optionnel : ${origin?.callingCode || ''} suivi de 7 à 12 chiffres.`}
                {...formik.getFieldProps('secondaryPhone')}
                onChange={(event) =>
                  formik.setFieldValue(
                    'secondaryPhone',
                    constrainPhone(event.target.value, origin?.callingCode || '', 12),
                  )
                }
                error={errorFor('secondaryPhone')}
              />
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!formik.dirty || status === 'loading'}
                icon={FiCheckCircle}
              >
                {status === 'loading' ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
