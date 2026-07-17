import { useMemo, useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2, FiUser } from 'react-icons/fi'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { useLanguage } from '../../contexts/useLanguage'
import { useIdentityProfile } from '../../hooks/useIdentityProfile'
import { phase3Text } from '../../i18n/phase3I18n'
import {
  IDENTITY_TYPES,
  OWNER_TYPES,
} from '../../types/identityEnums'

const DOC_LABEL_KEYS = {
  PASSEPORT: 'addresses.doc.passport',
  CNI: 'addresses.doc.idCard',
  PERMIS: 'addresses.doc.license',
  AUTRE: 'addresses.doc.other',
}

const HOLDER_LABEL_KEYS = {
  PERSON: 'addresses.holder.person',
  COMPANY: 'addresses.holder.company',
}

function IdentityFormFields({ variant, values, onChange, errors, p3 }) {
  return (
    <div className="grid gap-3">
      {variant === 'person' ? (
        <>
          <Input
            id="id-firstNames"
            label={p3('addresses.identity.firstNames')}
            value={values.firstNames}
            onChange={(e) => onChange({ firstNames: e.target.value })}
            error={errors.firstNames}
          />
          <Input
            id="id-lastName"
            label={p3('addresses.identity.lastName')}
            value={values.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            error={errors.lastName}
          />
        </>
      ) : (
        <>
          <Input
            id="id-companyName"
            label={p3('addresses.identity.companyName')}
            value={values.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            error={errors.companyName}
          />
          <Input
            id="id-contactName"
            label={p3('addresses.identity.contact')}
            value={values.contactName}
            onChange={(e) => onChange({ contactName: e.target.value })}
          />
        </>
      )}
      <Select
        id="id-type"
        label={p3('addresses.identity.docType')}
        value={values.idType}
        onChange={(e) => onChange({ idType: e.target.value })}
        error={errors.idType}
      >
        {IDENTITY_TYPES.map((type) => (
          <option key={type} value={type}>
            {p3(DOC_LABEL_KEYS[type])}
          </option>
        ))}
      </Select>
      <Input
        id="id-passport"
        label={p3('addresses.identity.docNumber')}
        value={values.passportNumber}
        onChange={(e) => onChange({ passportNumber: e.target.value.toUpperCase() })}
        error={errors.passportNumber}
      />
      <Input
        id="id-issuedBy"
        label={p3('addresses.identity.issuedBy')}
        value={values.issuedBy}
        onChange={(e) => onChange({ issuedBy: e.target.value })}
        error={errors.issuedBy}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="id-issuedAt"
          label={p3('addresses.identity.issuedAt')}
          type="date"
          value={values.issuedAt}
          onChange={(e) => onChange({ issuedAt: e.target.value })}
          error={errors.issuedAt}
        />
        <Input
          id="id-expiresAt"
          label={p3('addresses.identity.expiresAt')}
          type="date"
          value={values.expiresAt}
          onChange={(e) => onChange({ expiresAt: e.target.value })}
          error={errors.expiresAt}
        />
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-bold">{p3('addresses.identity.scan')}</span>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            onChange({
              scanMeta: { name: file.name, size: file.size, type: file.type },
            })
          }}
        />
        {values.scanMeta ? (
          <span className="text-xs text-[var(--app-text-muted)]">{values.scanMeta.name}</span>
        ) : null}
      </label>
    </div>
  )
}

export function IdentityProfileSection({ userId }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const { profiles, emptyIdentity, saveProfile, deleteProfile } = useIdentityProfile(userId)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [ownerType, setOwnerType] = useState('PERSON')
  const [identity, setIdentity] = useState(emptyIdentity())
  const [formErrors, setFormErrors] = useState({})

  const variant = ownerType === 'COMPANY' ? 'company' : 'person'

  function openCreate() {
    setEditing(null)
    setOwnerType('PERSON')
    setIdentity(emptyIdentity())
    setFormErrors({})
    setOpen(true)
  }

  function openEdit(profile) {
    setEditing(profile)
    setOwnerType(profile.ownerType)
    setIdentity({ ...emptyIdentity(), ...profile.identity })
    setFormErrors({})
    setOpen(true)
  }

  function handleSave() {
    const result = saveProfile({
      id: editing?.id,
      ownerType,
      identity,
    })
    if (!result.ok) {
      setFormErrors(result.errors || {})
      return
    }
    setOpen(false)
  }

  const sorted = useMemo(
    () => [...profiles].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [profiles],
  )

  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black">{p3('addresses.identity.title')}</h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            {p3('addresses.identity.description')}
          </p>
        </div>
        <Button type="button" icon={FiPlus} variant="secondary" onClick={openCreate}>
          {p3('addresses.identity.new')}
        </Button>
      </div>

      {sorted.length ? (
        <ul className="grid gap-2">
          {sorted.map((profile) => (
            <li
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--app-border)] p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                  <FiUser />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">
                    {profile.ownerType === 'COMPANY'
                      ? profile.identity.companyName || p3('addresses.identity.company')
                      : `${profile.identity.firstNames} ${profile.identity.lastName}`.trim()}
                  </p>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {p3(HOLDER_LABEL_KEYS[profile.ownerType])} · {profile.identity.passportNumber}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" icon={FiEdit2} onClick={() => openEdit(profile)}>
                  {p3('common.edit')}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={FiTrash2}
                  onClick={() => {
                    if (window.confirm(p3('addresses.identity.deleteConfirm'))) deleteProfile(profile.id)
                  }}
                >
                  {p3('common.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--app-text-muted)]">{p3('addresses.identity.empty')}</p>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? p3('addresses.identity.edit') : p3('addresses.identity.new')}
      >
        <div className="grid gap-4">
          <Select
            id="profile-ownerType"
            label={p3('addresses.identity.holderType')}
            value={ownerType}
            onChange={(e) => setOwnerType(e.target.value)}
          >
            {OWNER_TYPES.map((type) => (
              <option key={type} value={type}>
                {p3(HOLDER_LABEL_KEYS[type])}
              </option>
            ))}
          </Select>
          <IdentityFormFields
            variant={variant}
            values={identity}
            onChange={(patch) => setIdentity((prev) => ({ ...prev, ...patch }))}
            errors={formErrors}
            p3={p3}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {p3('common.cancel')}
            </Button>
            <Button type="button" onClick={handleSave}>
              {p3('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
