import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { IdentityCarousel } from './IdentityCarousel'
import {
  IDENTITY_TYPE_LABELS,
  IDENTITY_TYPES,
  OWNER_TYPE_LABELS,
  OWNER_TYPES,
} from '../../types/identityEnums'
import { validateRecipientAddressForm } from '../../types/carrierAddressValidation'

function emptyIdentity() {
  return {
    firstNames: '',
    lastName: '',
    companyName: '',
    contactName: '',
    idType: 'PASSEPORT',
    passportNumber: '',
    issuedBy: '',
    issuedAt: '',
    expiresAt: '',
    scanMeta: null,
  }
}

function emptyForm() {
  return {
    label: '',
    ownerType: 'PERSON',
    country: '',
    city: '',
    addressLine: '',
    phone: '',
    email: '',
    identityProfileId: null,
    identity: emptyIdentity(),
  }
}

function identityFromProfile(profile) {
  if (!profile) return emptyIdentity()
  return { ...emptyIdentity(), ...profile.identity }
}

export function RecipientAddressFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  identityProfiles = [],
}) {
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [selectedProfileId, setSelectedProfileId] = useState(null)

  const filteredProfiles = useMemo(
    () => identityProfiles.filter((p) => p.ownerType === form.ownerType),
    [identityProfiles, form.ownerType],
  )

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        ...emptyForm(),
        ...initial,
        identity: { ...emptyIdentity(), ...(initial.identity || {}) },
      })
      setSelectedProfileId(initial.identityProfileId || null)
    } else {
      setForm(emptyForm())
      setSelectedProfileId(null)
    }
    setErrors({})
  }, [open, initial])

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function setIdentity(patch) {
    setForm((prev) => ({
      ...prev,
      identityProfileId: null,
      identity: { ...prev.identity, ...patch },
    }))
    setSelectedProfileId(null)
  }

  function applyProfile(profile) {
    if (!profile) return
    setSelectedProfileId(profile.id)
    setForm((prev) => ({
      ...prev,
      ownerType: profile.ownerType,
      identityProfileId: profile.id,
      identity: identityFromProfile(profile),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const fieldErrors = validateRecipientAddressForm(form)
    const identityErrors = Object.fromEntries(
      Object.entries(fieldErrors).filter(([key]) =>
        [
          'firstNames',
          'lastName',
          'companyName',
          'idType',
          'passportNumber',
          'issuedBy',
          'issuedAt',
          'expiresAt',
        ].includes(key),
      ),
    )
    const topErrors = Object.fromEntries(
      Object.entries(fieldErrors).filter(([key]) => !Object.keys(identityErrors).includes(key)),
    )
    if (Object.keys(fieldErrors).length) {
      setErrors({ ...topErrors, identity: identityErrors })
      return
    }
    onSubmit({
      ...form,
      id: initial?.id,
      identityProfileId: selectedProfileId,
    })
    onClose()
  }

  const variant = form.ownerType === 'COMPANY' ? 'company' : 'person'
  const identityFieldErrors = errors.identity || {}

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier adresse destinataire' : 'Nouvelle adresse destinataire'}
      size="large"
    >
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="rcp-label"
          label="Libellé"
          value={form.label}
          onChange={(e) => setField('label', e.target.value)}
          error={errors.label}
        />
        <Select
          id="rcp-ownerType"
          label="Type de titulaire"
          value={form.ownerType}
          onChange={(e) => {
            const ownerType = e.target.value
            setField('ownerType', ownerType)
            setSelectedProfileId(null)
            setForm((prev) => ({
              ...prev,
              ownerType,
              identityProfileId: null,
              identity: emptyIdentity(),
            }))
          }}
        >
          {OWNER_TYPES.map((t) => (
            <option key={t} value={t}>
              {OWNER_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>

        {filteredProfiles.length ? (
          <div className="grid gap-2">
            <p className="text-xs font-bold uppercase text-[var(--app-text-muted)]">
              Profil enregistré (optionnel)
            </p>
            <IdentityCarousel
              items={filteredProfiles}
              selectedId={selectedProfileId}
              onSelect={applyProfile}
            />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="rcp-country"
            label="Pays"
            value={form.country}
            onChange={(e) => setField('country', e.target.value)}
            error={errors.country}
          />
          <Input
            id="rcp-city"
            label="Ville"
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            error={errors.city}
          />
        </div>
        <Input
          id="rcp-address"
          label="Adresse"
          value={form.addressLine}
          onChange={(e) => setField('addressLine', e.target.value)}
          error={errors.addressLine}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="rcp-phone"
            label="Téléphone"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            error={errors.phone}
          />
          <Input
            id="rcp-email"
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={errors.email}
          />
        </div>

        <fieldset className="grid gap-3 rounded-2xl border border-[var(--app-border)] p-4">
          <legend className="px-1 text-sm font-black">Identité du destinataire</legend>
          {variant === 'person' ? (
            <>
              <Input
                label="Prénoms"
                value={form.identity.firstNames}
                onChange={(e) => setIdentity({ firstNames: e.target.value })}
                error={identityFieldErrors.firstNames}
              />
              <Input
                label="Nom"
                value={form.identity.lastName}
                onChange={(e) => setIdentity({ lastName: e.target.value })}
                error={identityFieldErrors.lastName}
              />
            </>
          ) : (
            <Input
              label="Raison sociale"
              value={form.identity.companyName}
              onChange={(e) => setIdentity({ companyName: e.target.value })}
              error={identityFieldErrors.companyName}
            />
          )}
          <Select
            label="Type de pièce"
            value={form.identity.idType}
            onChange={(e) => setIdentity({ idType: e.target.value })}
            error={identityFieldErrors.idType}
          >
            {IDENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {IDENTITY_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Input
            label="N° pièce"
            value={form.identity.passportNumber}
            onChange={(e) => setIdentity({ passportNumber: e.target.value.toUpperCase() })}
            error={identityFieldErrors.passportNumber}
          />
          <Input
            label="Délivré par"
            value={form.identity.issuedBy}
            onChange={(e) => setIdentity({ issuedBy: e.target.value })}
            error={identityFieldErrors.issuedBy}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Délivrance"
              type="date"
              value={form.identity.issuedAt}
              onChange={(e) => setIdentity({ issuedAt: e.target.value })}
              error={identityFieldErrors.issuedAt}
            />
            <Input
              label="Expiration"
              type="date"
              value={form.identity.expiresAt}
              onChange={(e) => setIdentity({ expiresAt: e.target.value })}
              error={identityFieldErrors.expiresAt}
            />
          </div>
        </fieldset>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}
