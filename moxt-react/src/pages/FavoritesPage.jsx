import { useFormik } from 'formik'
import { useState } from 'react'
import { FiArrowLeft, FiEdit2, FiHeart, FiPlus, FiRepeat, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import * as Yup from 'yup'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CatalogGrid } from '../components/ui/CatalogGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { phoneError, phonePlaceholder, phonePrefix, validatePhone } from '../config/phone'
import { PAYMENT_METHODS } from '../features/transfers/transferConfig'
import {
  removeTransferProfile,
  saveTransferProfile,
  toggleAccountFavorite,
} from '../features/account/accountSlice'

const profileSchema = Yup.object({
  firstName: Yup.string().trim().required('Prénom obligatoire.'),
  lastName: Yup.string().trim().required('Nom obligatoire.'),
  phone: Yup.string()
    .trim()
    .test('favorite-phone-country', function (value) {
      const country = this.parent.country || 'BJ'
      return validatePhone(value, country) || this.createError({ message: phoneError(country) })
    })
    .required('Numéro obligatoire.'),
  country: Yup.string().oneOf(['BJ', 'RU']).required(),
  method: Yup.string().required('Réseau ou banque obligatoire.'),
})

export function FavoritesPage() {
  const dispatch = useDispatch()
  const [profileOpen, setProfileOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const user = useSelector((state) => state.auth.user)
  const transferProfiles = useSelector((state) =>
    (state.account.transferProfiles || []).filter((item) => item.userId === user.id),
  )
  const accountFavorites = useSelector((state) =>
    state.account.favorites.filter((item) => item.userId === user.id),
  )
  const listingFavorites = useSelector((state) =>
    state.marketplace.items
      .filter((item) => item.favorites?.includes(user.id))
      .map((item) => ({
        id: `listing-${item.id}`,
        relatedId: item.id,
        relatedType: 'listing',
        title: item.title,
        path: `/marketplace/${item.id}`,
        legacy: true,
      })),
  )
  const favorites = [...accountFavorites, ...listingFavorites]
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      phone: phonePrefix('BJ'),
      country: 'BJ',
      method: '',
    },
    validationSchema: profileSchema,
    onSubmit: (values, helpers) => {
      dispatch(saveTransferProfile({ ...values, id: editingProfile?.id, userId: user.id }))
      helpers.resetForm()
      setEditingProfile(null)
      setProfileOpen(false)
    },
  })
  const methods = PAYMENT_METHODS[formik.values.country]
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Mes favoris"
        description="Contenus enregistrés et profils réutilisables pour vos transferts."
        actions={
          <>
            <Link
              to="/profile"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm hover:bg-[var(--app-surface-muted)]"
            >
              <FiArrowLeft /> Retour
            </Link>
            <Button
              icon={FiPlus}
              onClick={() => {
                setEditingProfile(null)
                formik.resetForm()
                setProfileOpen(true)
              }}
            >
              Ajouter un profil de transfert
            </Button>
          </>
        }
      />

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-black">Profils de transfert</h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            MOXT affichera uniquement les profils correspondant au pays de départ ou d’arrivée.
          </p>
        </div>
        {transferProfiles.length ? (
          <CatalogGrid lazy={false}>
            {transferProfiles.map((profile) => (
              <Card key={profile.id} className="min-w-0 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                    <FiRepeat />
                  </span>
                  <Badge tone={profile.country === 'BJ' ? 'success' : 'info'}>
                    {profile.country === 'BJ' ? 'Bénin' : 'Russie'}
                  </Badge>
                </div>
                <h3 className="mt-4 font-black">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">{profile.phone}</p>
                <p className="mt-1 text-sm font-bold text-brand-700">{profile.method}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    className="min-w-0 px-2"
                    variant="secondary"
                    icon={FiEdit2}
                    onClick={() => {
                      setEditingProfile(profile)
                      formik.setValues({
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        phone: profile.phone,
                        country: profile.country,
                        method: profile.method,
                      })
                      setProfileOpen(true)
                    }}
                  >
                    Modifier
                  </Button>
                  <Button
                    className="min-w-0 px-2"
                    variant="danger"
                    icon={FiTrash2}
                    onClick={() =>
                      dispatch(removeTransferProfile({ id: profile.id, userId: user.id }))
                    }
                  >
                    Supprimer
                  </Button>
                </div>
              </Card>
            ))}
          </CatalogGrid>
        ) : (
          <EmptyState
            icon={FiRepeat}
            title="Aucun profil de transfert"
            description="Ajoutez vos contacts et comptes habituels pour remplir les transferts plus rapidement."
          />
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-black">Contenus favoris</h2>
        {favorites.length ? (
          <CatalogGrid lazy={false}>
            {favorites.map((item) => (
              <Card key={item.id} className="grid min-w-0 content-start gap-3 p-4 sm:p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                  <FiHeart />
                </span>
                <div className="min-w-0">
                  <strong className="block truncate">{item.title}</strong>
                  <Badge
                    tone={
                      item.relatedType === 'listing'
                        ? 'warning'
                        : item.relatedType === 'business'
                          ? 'success'
                          : 'info'
                    }
                  >
                    {item.relatedType}
                  </Badge>
                </div>
                <Link className="min-w-0" to={item.path}>
                  <Button className="w-full min-w-0" variant="secondary">
                    Ouvrir
                  </Button>
                </Link>
                {!item.legacy ? (
                  <Button
                    className="w-full min-w-0"
                    variant="ghost"
                    onClick={() =>
                      dispatch(
                        toggleAccountFavorite({
                          userId: user.id,
                          relatedType: item.relatedType,
                          relatedId: item.relatedId,
                          title: item.title,
                          path: item.path,
                        }),
                      )
                    }
                  >
                    Retirer
                  </Button>
                ) : null}
              </Card>
            ))}
          </CatalogGrid>
        ) : (
          <EmptyState
            icon={FiHeart}
            title="Aucun contenu favori"
            description="Enregistrez des contenus depuis leurs fiches."
          />
        )}
      </section>

      <Modal
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false)
          setEditingProfile(null)
        }}
        title={editingProfile ? 'Modifier le profil' : 'Nouveau profil'}
      >
        <form className="grid gap-4" onSubmit={formik.handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="favorite-firstName"
              label="Prénom"
              {...formik.getFieldProps('firstName')}
              error={errorFor('firstName')}
            />
            <Input
              id="favorite-lastName"
              label="Nom"
              {...formik.getFieldProps('lastName')}
              error={errorFor('lastName')}
            />
          </div>
          <Input
            id="favorite-phone"
            label="Numéro de téléphone"
            type="tel"
            placeholder={phonePlaceholder(formik.values.country)}
            {...formik.getFieldProps('phone')}
            error={errorFor('phone')}
          />
          <Select
            id="favorite-country"
            label="Pays"
            {...formik.getFieldProps('country')}
            onChange={(event) => {
              formik.handleChange(event)
              formik.setFieldValue('method', '')
              formik.setFieldValue('phone', phonePrefix(event.target.value))
            }}
          >
            <option value="BJ">Bénin</option>
            <option value="RU">Russie</option>
          </Select>
          <Select
            id="favorite-method"
            label={formik.values.country === 'BJ' ? 'Réseau mobile' : 'Banque'}
            {...formik.getFieldProps('method')}
            error={errorFor('method')}
          >
            <option value="">Sélectionner</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          <Button type="submit">
            {editingProfile ? 'Enregistrer les modifications' : 'Enregistrer le profil'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
