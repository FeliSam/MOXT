import { useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { FiEdit2, FiHeart, FiPlus, FiRepeat, FiShoppingBag, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import * as Yup from 'yup'
import { Badge, PillBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { phoneError, phonePlaceholder, phonePrefix, validatePhone } from '../config/phone'
import { useLanguage } from '../contexts/useLanguage'
import { PAYMENT_METHODS } from '../features/transfers/transferConfig'
import { FavoriteCategorySection } from '../features/account/FavoriteContentCards'
import {
  FAVORITE_CATEGORIES,
  groupFavoritesByCategory,
  mergeUserFavorites,
} from '../features/account/favoriteUtils'
import {
  removeTransferProfile,
  saveTransferProfile,
  toggleAccountFavorite,
} from '../features/account/accountSlice'
import { phase3Text } from '../i18n/phase3I18n'

function createProfileSchema(p3) {
  return Yup.object({
    firstName: Yup.string().trim().required(p3('favorites.validation.firstName')),
    lastName: Yup.string().trim().required(p3('favorites.validation.lastName')),
    phone: Yup.string()
      .trim()
      .test('favorite-phone-country', function (value) {
        const country = this.parent.country || 'BJ'
        return validatePhone(value, country) || this.createError({ message: phoneError(country) })
      })
      .required(p3('favorites.validation.phone')),
    country: Yup.string().oneOf(['BJ', 'RU']).required(),
    method: Yup.string().required(p3('favorites.validation.method')),
  })
}

export function FavoritesPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [categoryTab, setCategoryTab] = useState(FAVORITE_CATEGORIES[0].id)
  const user = useSelector((state) => state.auth.user)
  const appState = useSelector((state) => state)
  const transferProfiles = useSelector((state) =>
    (state.account.transferProfiles || []).filter((item) => item.userId === user.id),
  )
  const favorites = useMemo(() => mergeUserFavorites(appState, user.id), [appState, user.id])
  const favoriteCategories = useMemo(() => groupFavoritesByCategory(favorites), [favorites])
  const visibleCategories = useMemo(() => {
    if (categoryTab === 'all') return favoriteCategories
    const match = favoriteCategories.find((category) => category.id === categoryTab)
    return match ? [match] : []
  }, [categoryTab, favoriteCategories])

  const profileSchema = createProfileSchema(p3)
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

  function handleRemoveFavorite(item) {
    dispatch(
      toggleAccountFavorite({
        userId: user.id,
        relatedType: item.relatedType,
        relatedId: item.relatedId,
        title: item.title,
        path: item.path,
        snapshot: item.snapshot,
      }),
    )
  }

  const categoryTabs = FAVORITE_CATEGORIES.map((category) => ({
    key: category.id,
    label: p3(category.labelKey),
    count: favoriteCategories.find((entry) => entry.id === category.id)?.items.length || 0,
  }))

  return (
    <div className="grid gap-7">
      <PageHeader
        title={p3('favorites.title')}
        stats={[{ label: p3('favorites.stats.items'), value: favorites.length }]}
        actions={
          <>
            <Link to="/marketplace">
              <Button variant="secondary" icon={FiShoppingBag}>
                Marketplace
              </Button>
            </Link>
            <Button
              variant="secondary"
              icon={FiPlus}
              onClick={() => {
                setEditingProfile(null)
                formik.resetForm()
                setProfileOpen(true)
              }}
            >
              {p3('favorites.actions.transferProfile')}
            </Button>
          </>
        }
      />

      <section className="grid gap-6">
        <div className="scrollbar-hidden -mx-1 flex touch-pan-x gap-2 overflow-x-auto px-1 pb-1">
          {categoryTabs.map((tab) => (
            <PillBadge
              key={tab.key}
              active={categoryTab === tab.key}
              onClick={() => setCategoryTab((current) => (current === tab.key ? 'all' : tab.key))}
              className="shrink-0 whitespace-nowrap"
            >
              {tab.label} ({tab.count})
            </PillBadge>
          ))}
        </div>
        {visibleCategories.length ? (
          visibleCategories.map((category) => (
            <FavoriteCategorySection
              key={category.id}
              category={category}
              items={category.items}
              onRemove={handleRemoveFavorite}
            />
          ))
        ) : (
          <EmptyState
            icon={FiHeart}
            title={p3('favorites.empty.title')}
            description={p3('favorites.empty.description')}
            action={
              <Link to="/marketplace">
                <Button icon={FiShoppingBag}>{p3('favorites.empty.cta')}</Button>
              </Link>
            }
          />
        )}
      </section>

      <section className="grid gap-4 rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface-muted)]/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{p3('favorites.profiles.title')}</h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              {p3('favorites.profiles.description')}
            </p>
          </div>
          <Button
            icon={FiPlus}
            variant="secondary"
            onClick={() => {
              setEditingProfile(null)
              formik.resetForm()
              setProfileOpen(true)
            }}
          >
            {p3('favorites.profiles.add')}
          </Button>
        </div>
        {transferProfiles.length ? (
          <div className="scrollbar-hidden -mx-1 flex touch-pan-x gap-3 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0 xl:grid-cols-3">
            {transferProfiles.map((profile) => (
              <Card
                key={profile.id}
                className="w-[clamp(16rem,74vw,19rem)] shrink-0 !border-transparent p-4 sm:p-5 lg:w-auto lg:min-w-0 lg:shrink"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                    <FiRepeat />
                  </span>
                  <Badge tone={profile.country === 'BJ' ? 'success' : 'info'}>
                    {profile.country === 'BJ' ? p3('common.benin') : p3('common.russia')}
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
                    {p3('common.edit')}
                  </Button>
                  <Button
                    className="min-w-0 px-2"
                    variant="danger"
                    icon={FiTrash2}
                    onClick={() =>
                      dispatch(removeTransferProfile({ id: profile.id, userId: user.id }))
                    }
                  >
                    {p3('common.delete')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiRepeat}
            title={p3('favorites.profiles.empty.title')}
            description={p3('favorites.profiles.empty.description')}
            action={
              <Button
                icon={FiPlus}
                onClick={() => {
                  setEditingProfile(null)
                  formik.resetForm()
                  setProfileOpen(true)
                }}
              >
                {p3('favorites.profiles.add')}
              </Button>
            }
          />
        )}
      </section>

      <Modal
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false)
          setEditingProfile(null)
        }}
        title={
          editingProfile
            ? p3('favorites.profiles.modal.edit')
            : p3('favorites.profiles.modal.create')
        }
      >
        <form className="grid gap-4" onSubmit={formik.handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="favorite-firstName"
              label={p3('common.firstName')}
              {...formik.getFieldProps('firstName')}
              error={errorFor('firstName')}
            />
            <Input
              id="favorite-lastName"
              label={p3('common.lastName')}
              {...formik.getFieldProps('lastName')}
              error={errorFor('lastName')}
            />
          </div>
          <Input
            id="favorite-phone"
            label={p3('common.phone')}
            type="tel"
            placeholder={phonePlaceholder(formik.values.country)}
            {...formik.getFieldProps('phone')}
            error={errorFor('phone')}
          />
          <Select
            id="favorite-country"
            label={p3('common.country')}
            {...formik.getFieldProps('country')}
            onChange={(event) => {
              formik.handleChange(event)
              formik.setFieldValue('method', '')
              formik.setFieldValue('phone', phonePrefix(event.target.value))
            }}
          >
            <option value="BJ">{p3('common.benin')}</option>
            <option value="RU">{p3('common.russia')}</option>
          </Select>
          <Select
            id="favorite-method"
            label={
              formik.values.country === 'BJ'
                ? p3('favorites.profiles.method.network')
                : p3('favorites.profiles.method.bank')
            }
            {...formik.getFieldProps('method')}
            error={errorFor('method')}
          >
            <option value="">{p3('common.select')}</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          <Button type="submit">
            {editingProfile
              ? p3('favorites.profiles.submit.edit')
              : p3('favorites.profiles.submit.create')}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
