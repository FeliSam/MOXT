import { useMemo, useState } from 'react'
import { FiEdit3, FiPlus, FiStar, FiTrash2 } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { CatalogArchiveTabs } from '../../components/ui/CatalogArchiveTabs'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { updateBusinessTransferAccounts } from '../../features/businesses/businessSlice'
import { paymentMethodsForCountry } from '../../features/transfers/transferConfig'
import {
  accountsForSlot,
  addTransferAccount,
  setDefaultTransferAccount,
  TRANSFER_ACCOUNT_SLOTS,
  transferAccountSlotMeta,
  upsertTransferAccountForSlot,
} from '../../features/transfers/transferAccountUtils'
import { directionLabel } from '../../features/transfers/transferUtils'
import { addToast } from '../../features/ui/uiSlice'

const inputSurface = 'bg-white dark:bg-slate-950'

const emptyForm = {
  label: '',
  method: '',
  recipientName: '',
  phone: '',
  accountNumber: '',
  bankName: '',
  instructions: '',
  active: true,
}

export function TransferAccountsPanel({ business, dispatch, user }) {
  const originCountry = user.originCountry || 'BJ'
  const accounts = business.transferAccounts || []
  const [panelTab, setPanelTab] = useState('defaults')
  const [modalMode, setModalMode] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const slots = useMemo(
    () => [
      transferAccountSlotMeta(TRANSFER_ACCOUNT_SLOTS.RU, originCountry),
      transferAccountSlotMeta(TRANSFER_ACCOUNT_SLOTS.ORIGIN, originCountry),
    ],
    [originCountry],
  )

  const extraCount = accounts.length

  function defaultAccountForSlot(slot) {
    const slotAccounts = accountsForSlot(accounts, slot, originCountry).filter(
      (account) => account.active !== false,
    )
    return slotAccounts.find((account) => account.isDefault) || slotAccounts[0] || null
  }

  function persistAccounts(nextAccounts, message) {
    dispatch(
      updateBusinessTransferAccounts({
        businessId: business.id,
        ownerId: business.ownerId,
        originCountry,
        accounts: nextAccounts,
      }),
    )
    dispatch(
      addToast({
        title: 'Coordonnées mises à jour',
        message: message || 'Les clients verront le compte par défaut selon le sens du transfert.',
        tone: 'success',
      }),
    )
  }

  function openSlotModal(slot) {
    const existing = defaultAccountForSlot(slot)
    const meta = transferAccountSlotMeta(slot, originCountry)
    setModalMode({ type: 'slot', slot })
    setForm(
      existing
        ? { ...pickForm(existing) }
        : { ...emptyForm, method: paymentMethodsForCountry(meta.country)[0] || '' },
    )
  }

  function openExtraModal(slot, account = null) {
    const meta = transferAccountSlotMeta(slot, originCountry)
    setModalMode({ type: 'extra', slot, accountId: account?.id || null })
    setForm(
      account
        ? { ...pickForm(account) }
        : { ...emptyForm, method: paymentMethodsForCountry(meta.country)[0] || '' },
    )
  }

  function closeModal() {
    setModalMode(null)
    setForm(emptyForm)
  }

  function submit(event) {
    event.preventDefault()
    if (!modalMode) return
    if (!form.recipientName.trim() || (!form.phone.trim() && !form.accountNumber.trim())) return

    if (modalMode.type === 'slot') {
      persistAccounts(
        upsertTransferAccountForSlot(
          accounts,
          modalMode.slot,
          { ...form, id: defaultAccountForSlot(modalMode.slot)?.id },
          originCountry,
        ),
      )
    } else {
      const existing = accounts.find((account) => account.id === modalMode.accountId)
      if (existing) {
        persistAccounts(
          accounts.map((account) =>
            account.id === existing.id
              ? {
                  ...account,
                  ...form,
                  slot: modalMode.slot,
                  country: modalMeta.country,
                }
              : account,
          ),
          'Profil modifié.',
        )
      } else {
        persistAccounts(
          addTransferAccount(accounts, { ...form, slot: modalMode.slot, isDefault: false }, originCountry),
          'Profil ajouté à la liste.',
        )
      }
    }
    closeModal()
  }

  function removeAccount(accountId) {
    persistAccounts(accounts.filter((account) => account.id !== accountId), 'Profil supprimé.')
  }

  function makeDefault(accountId) {
    persistAccounts(
      setDefaultTransferAccount(accounts, accountId, originCountry),
      'Ce profil est maintenant utilisé par défaut pour ce sens.',
    )
  }

  const modalMeta = modalMode ? transferAccountSlotMeta(modalMode.slot, originCountry) : null
  const methodOptions = paymentMethodsForCountry(modalMeta?.country || 'RU')

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">
            Paramètres de paiement client
          </p>
          <h2 className="mt-1 text-xl font-black">Coordonnées de réception</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--app-text-muted)]">
            Deux comptes par défaut selon le sens du transfert, plus une liste de profils
            supplémentaires avec sélection du compte actif.
          </p>
        </div>
        <Badge tone={slots.every((slot) => defaultAccountForSlot(slot.slot)) ? 'success' : 'warning'}>
          {slots.every((slot) => defaultAccountForSlot(slot.slot)) ? 'Prêt' : 'À compléter'}
        </Badge>
      </div>

      <div className="mt-5">
        <CatalogArchiveTabs
          active={panelTab}
          onChange={setPanelTab}
          variant="section"
          tabs={[
            { key: 'defaults', label: 'Comptes par défaut' },
            { key: 'extra', label: 'Autres profils', count: extraCount },
          ]}
        />
      </div>

      {panelTab === 'defaults' ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {slots.map((slot) => {
            const account = defaultAccountForSlot(slot.slot)
            return (
              <SlotCard
                key={slot.slot}
                slot={slot}
                account={account}
                onConfigure={() => openSlotModal(slot.slot)}
              />
            )
          })}
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {slots.map((slot) => {
            const slotAccounts = accountsForSlot(accounts, slot.slot, originCountry)
            return (
              <div key={slot.slot} className="grid gap-3 rounded-[1.5rem] border border-[var(--app-border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black">{slot.title}</h3>
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {directionLabel(slot.activeForDirection)}
                    </p>
                  </div>
                  <Button variant="secondary" icon={FiPlus} onClick={() => openExtraModal(slot.slot)}>
                    Ajouter un profil
                  </Button>
                </div>
                {slotAccounts.length ? (
                  slotAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={`grid gap-3 rounded-2xl p-4 lg:grid-cols-[1fr_auto] lg:items-center ${
                        account.isDefault
                          ? 'bg-brand-50/70 ring-1 ring-brand-200 dark:bg-brand-950/20 dark:ring-brand-800'
                          : 'bg-[var(--app-surface-muted)]'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong>{account.label || account.method || 'Profil'}</strong>
                          {account.isDefault ? (
                            <Badge tone="success">
                              <FiStar className="mr-1 inline text-xs" />
                              Par défaut
                            </Badge>
                          ) : null}
                          {account.active === false ? <Badge tone="warning">Masqué</Badge> : null}
                        </div>
                        <p className="mt-2 text-sm text-[var(--app-text-muted)]">
                          {account.recipientName} · {account.phone || account.accountNumber} ·{' '}
                          {account.method || account.bankName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!account.isDefault ? (
                          <Button variant="secondary" onClick={() => makeDefault(account.id)}>
                            Définir par défaut
                          </Button>
                        ) : null}
                        <Button variant="secondary" icon={FiEdit3} onClick={() => openExtraModal(slot.slot, account)}>
                          Modifier
                        </Button>
                        <Button variant="danger" icon={FiTrash2} onClick={() => removeAccount(account.id)}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--app-text-muted)]">Aucun profil pour ce sens.</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={Boolean(modalMode)}
        onClose={closeModal}
        title={
          modalMeta
            ? `${modalMode?.accountId || defaultAccountForSlot(modalMode?.slot) ? 'Modifier' : 'Ajouter'} · ${modalMeta.title}`
            : 'Profil de réception'
        }
      >
        {modalMeta ? (
          <form className="grid gap-4" onSubmit={submit}>
            <p className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm text-[var(--app-text-muted)]">
              Profil pour <strong>{directionLabel(modalMeta.activeForDirection)}</strong>.
              {modalMode?.type === 'extra'
                ? ' Vous pourrez le définir comme compte par défaut dans la liste.'
                : ' Ce compte sera utilisé par défaut pour ce sens.'}
            </p>
            <AccountFormFields
              form={form}
              setForm={setForm}
              methodOptions={methodOptions}
              modalMeta={modalMeta}
            />
            <Button type="submit" className="w-full">
              Enregistrer
            </Button>
          </form>
        ) : null}
      </Modal>
    </Card>
  )
}

function SlotCard({ account, onConfigure, slot }) {
  return (
    <div
      className={`grid gap-4 rounded-[1.5rem] border p-5 ${
        account
          ? 'border-brand-300 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-950/20'
          : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-700">{slot.title}</p>
          <h3 className="mt-1 font-black">{directionLabel(slot.activeForDirection)}</h3>
        </div>
        <Badge tone={account ? 'success' : 'warning'}>{account ? 'Actif' : 'Manquant'}</Badge>
      </div>
      {account ? (
        <div className="rounded-2xl bg-[var(--app-surface)] p-4 text-sm text-[var(--app-text-muted)]">
          <strong className="block text-[var(--app-text)]">
            {account.label || account.method || 'Compte configuré'}
          </strong>
          <p className="mt-2">
            {account.recipientName} · {account.phone || account.accountNumber}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--app-text-muted)]">Configurez le compte par défaut pour ce sens.</p>
      )}
      <Button variant="secondary" icon={account ? FiEdit3 : FiPlus} onClick={onConfigure}>
        {account ? 'Modifier le défaut' : 'Configurer'}
      </Button>
    </div>
  )
}

function AccountFormFields({ form, methodOptions, modalMeta, setForm }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        id="transfer-account-method"
        label={modalMeta.country === 'RU' ? 'Banque russe' : 'Réseau de transfert'}
        className={inputSurface}
        value={form.method}
        onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
      >
        {methodOptions.map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </Select>
      <Input
        id="transfer-account-label"
        label="Libellé"
        className={inputSurface}
        value={form.label}
        onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
      />
      <Input
        id="transfer-account-recipient"
        label="Nom du bénéficiaire"
        className={inputSurface}
        value={form.recipientName}
        onChange={(event) => setForm((current) => ({ ...current, recipientName: event.target.value }))}
      />
      <Input
        id="transfer-account-phone"
        label="Numéro de réception"
        className={inputSurface}
        type="tel"
        value={form.phone}
        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
      />
      <Input
        id="transfer-account-number"
        label="Compte ou identifiant"
        className={inputSurface}
        value={form.accountNumber}
        onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))}
      />
      <Input
        id="transfer-account-bank"
        label="Banque ou détail"
        className={inputSurface}
        value={form.bankName}
        onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
      />
      <Input
        id="transfer-account-instructions"
        label="Instructions"
        className={inputSurface}
        value={form.instructions}
        onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
      />
    </div>
  )
}

function pickForm(account) {
  return {
    label: account.label || '',
    method: account.method || '',
    recipientName: account.recipientName || '',
    phone: account.phone || '',
    accountNumber: account.accountNumber || '',
    bankName: account.bankName || '',
    instructions: account.instructions || '',
    active: account.active !== false,
  }
}
