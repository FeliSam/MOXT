import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PageHeader } from '../components/ui/PageHeader'
import { Tabs } from '../components/ui/Tabs'
import { IdentityProfileSection } from '../components/identity/IdentityProfileSection'
import { RecipientAddressCarousel } from '../components/addresses/RecipientAddressCarousel'
import { RecipientAddressFormModal } from '../components/addresses/RecipientAddressFormModal'
import { useLanguage } from '../contexts/useLanguage'
import {
  addRecipientAddress,
  removeRecipientAddress,
  updateRecipientAddress,
} from '../features/addresses/recipientAddressesSlice'
import {
  selectIdentityProfilesByUser,
  selectRecipientAddressesByUser,
} from '../features/addresses/addressesSelectors'
import { phase3Text } from '../i18n/phase3I18n'

const TAB_KEYS = ['identity', 'recipient', 'carrier']

export function AddressesPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const [tab, setTab] = useState('identity')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedRecipientId, setSelectedRecipientId] = useState(null)

  const recipients = useSelector((state) => selectRecipientAddressesByUser(state, user?.id))
  const identityProfiles = useSelector((state) => selectIdentityProfilesByUser(state, user?.id))

  const tabs = TAB_KEYS.map((value) => ({
    value,
    label: p3(`addresses.tabs.${value}`),
  }))

  const selectedRecipient = useMemo(
    () => recipients.find((r) => r.id === selectedRecipientId) || recipients[0] || null,
    [recipients, selectedRecipientId],
  )

  function handleRecipientSubmit(payload) {
    if (!user?.id) return
    if (payload.id) {
      dispatch(updateRecipientAddress({ ...payload, userId: user.id }))
      setSelectedRecipientId(payload.id)
    } else {
      const action = dispatch(addRecipientAddress({ ...payload, userId: user.id }))
      setSelectedRecipientId(action.payload.id)
    }
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('addresses.eyebrow')}
        title={p3('addresses.title')}
        description={p3('addresses.description')}
      />

      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === 'identity' ? <IdentityProfileSection userId={user?.id} /> : null}

      {tab === 'recipient' ? (
        <div className="grid gap-4">
          <RecipientAddressCarousel
            items={recipients}
            selectedId={selectedRecipient?.id}
            onSelect={(item) => setSelectedRecipientId(item.id)}
            onAdd={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            onEdit={(item) => {
              setEditing(item)
              setModalOpen(true)
            }}
            onDelete={(id) => {
              dispatch(removeRecipientAddress(id))
              if (selectedRecipientId === id) setSelectedRecipientId(null)
            }}
          />
          <RecipientAddressFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            initial={editing}
            identityProfiles={identityProfiles}
            onSubmit={handleRecipientSubmit}
          />
        </div>
      ) : null}

      {tab === 'carrier' ? (
        <p className="rounded-2xl border border-dashed border-[var(--app-border)] p-6 text-sm text-[var(--app-text-muted)]">
          {p3('addresses.carrierSoon')}
        </p>
      ) : null}
    </div>
  )
}
