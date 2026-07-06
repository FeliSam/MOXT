import { useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { FALLBACK_AFRICAN_COUNTRIES, RUSSIA } from '../../config/geography'
import { updateBusinessTransferAccounts } from '../../features/businesses/businessSlice'
import { paymentMethodsForCountry } from '../../features/transfers/transferConfig'
import { addToast } from '../../features/ui/uiSlice'

const emptyTransferAccount = {
  country: 'RU',
  label: '',
  method: '',
  recipientName: '',
  phone: '',
  accountNumber: '',
  bankName: '',
  instructions: '',
  active: true,
}

const inputSurface = 'bg-white dark:bg-slate-950'

export function TransferAccountsPanel({ business, dispatch, user }) {
  const [form, setForm] = useState(emptyTransferAccount)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const accounts = business.transferAccounts || []
  const originCountry = user.originCountry || 'BJ'
  const countries = [
    RUSSIA,
    ...FALLBACK_AFRICAN_COUNTRIES.filter((country) => country.code === originCountry),
  ]
  const selectedCountry = countries.find((country) => country.code === form.country) || RUSSIA
  const methodOptions = paymentMethodsForCountry(form.country)

  function save(accountsToSave) {
    dispatch(
      updateBusinessTransferAccounts({
        businessId: business.id,
        ownerId: business.ownerId,
        accounts: accountsToSave,
      }),
    )
    dispatch(
      addToast({
        title: 'Coordonnées de transfert mises à jour',
        message: 'Les prochains clients verront ces informations dans la création de transfert.',
        tone: 'success',
      }),
    )
  }

  function submit(event) {
    event.preventDefault()
    if (!form.recipientName.trim() || (!form.phone.trim() && !form.accountNumber.trim())) return
    if (editingId) {
      save(
        accounts.map((account) => (account.id === editingId ? { ...account, ...form } : account)),
      )
    } else {
      save([{ ...form }, ...accounts])
    }
    setForm(emptyTransferAccount)
    setEditingId(null)
    setModalOpen(false)
  }

  function updateAccount(accountId, patch) {
    save(accounts.map((account) => (account.id === accountId ? { ...account, ...patch } : account)))
  }

  function removeAccount(accountId) {
    save(accounts.filter((account) => account.id !== accountId))
  }

  function openCreateModal() {
    setForm({
      ...emptyTransferAccount,
      country: 'RU',
      method: paymentMethodsForCountry('RU')[0] || '',
    })
    setEditingId(null)
    setModalOpen(true)
  }

  function openEditModal(account) {
    setForm({
      country: account.country || 'RU',
      label: account.label || '',
      method: account.method || '',
      recipientName: account.recipientName || '',
      phone: account.phone || '',
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      instructions: account.instructions || '',
      active: account.active !== false,
    })
    setEditingId(account.id)
    setModalOpen(true)
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Button icon={FiPlus} onClick={openCreateModal}>
            Ajouter
          </Button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">
              Paramètres de paiement client
            </p>
            <h2 className="mt-1 text-xl font-black">Coordonnées de réception</h2>
          </div>
        </div>
        <div className="lg:max-w-xl">
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--app-text-muted)]">
            Ces informations indiquent au client où envoyer l’argent avant déclaration du paiement.
            Elles sont copiées dans le transfert au moment de sa création.
          </p>
        </div>
        <Badge tone={accounts.some((account) => account.active !== false) ? 'success' : 'warning'}>
          {accounts.some((account) => account.active !== false) ? 'Prêt' : 'À compléter'}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {accounts.length ? (
          accounts.map((account) => (
            <div
              key={account.id}
              className="grid gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-4 lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{account.label || account.method || 'Compte de réception'}</strong>
                  <Badge tone={account.active === false ? 'warning' : 'success'}>
                    {account.active === false ? 'Masqué' : 'Actif'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                  {account.country || 'RU'} ·{' '}
                  {account.recipientName || 'Bénéficiaire non renseigné'} ·{' '}
                  {account.phone || account.accountNumber || 'Coordonnée manquante'} ·{' '}
                  {account.method || account.bankName || 'Méthode non renseignée'}
                </p>
                {account.instructions ? (
                  <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                    {account.instructions}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button variant="secondary" onClick={() => openEditModal(account)}>
                  Modifier
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => updateAccount(account.id, { active: account.active === false })}
                >
                  {account.active === false ? 'Activer' : 'Masquer'}
                </Button>
                <Button variant="danger" icon={FiTrash2} onClick={() => removeAccount(account.id)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-[var(--app-surface-muted)] p-5 text-sm text-[var(--app-text-muted)]">
            Aucun compte de réception configuré. Ajoutez au moins un numéro, compte ou carte pour
            guider les clients.
          </p>
        )}
      </div>
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setForm(emptyTransferAccount)
          setEditingId(null)
        }}
        title={editingId ? 'Modifier les coordonnées' : 'Ajouter des coordonnées'}
      >
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="transfer-account-country"
              label="Pays du numéro"
              className={inputSurface}
              value={form.country}
              onChange={(event) => {
                const country = event.target.value
                const methods = paymentMethodsForCountry(country)
                setForm((current) => ({ ...current, country, method: methods[0] || '' }))
              }}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
            <Select
              id="transfer-account-method"
              label={form.country === 'RU' ? 'Banque russe' : 'Réseau de transfert'}
              className={inputSurface}
              value={form.method}
              onChange={(event) =>
                setForm((current) => ({ ...current, method: event.target.value }))
              }
            >
              {methodOptions.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="transfer-account-label"
              label="Libellé"
              className={inputSurface}
              placeholder="Ex : Sberbank principal"
              value={form.label}
              onChange={(event) =>
                setForm((current) => ({ ...current, label: event.target.value }))
              }
            />
            <Input
              id="transfer-account-recipient"
              label="Nom du bénéficiaire"
              className={inputSurface}
              placeholder="Nom exact du compte"
              value={form.recipientName}
              onChange={(event) =>
                setForm((current) => ({ ...current, recipientName: event.target.value }))
              }
            />
            <Input
              id="transfer-account-phone"
              label="Numéro de réception"
              className={inputSurface}
              placeholder={
                form.country === 'RU'
                  ? `${RUSSIA.callingCode} 900 000 00 00`
                  : `${selectedCountry.callingCode} numéro mobile money`
              }
              type="tel"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
            <Input
              id="transfer-account-number"
              label="Compte, carte ou identifiant"
              className={inputSurface}
              placeholder="Numéro de carte, compte ou ID client"
              value={form.accountNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, accountNumber: event.target.value }))
              }
            />
            <Input
              id="transfer-account-bank"
              label="Banque ou détail"
              className={inputSurface}
              placeholder="Agence, banque, ville ou précision"
              value={form.bankName}
              onChange={(event) =>
                setForm((current) => ({ ...current, bankName: event.target.value }))
              }
            />
            <Input
              id="transfer-account-instructions"
              label="Informations supplémentaires"
              className={inputSurface}
              placeholder="Référence à mettre, horaires, confirmation attendue..."
              value={form.instructions}
              onChange={(event) =>
                setForm((current) => ({ ...current, instructions: event.target.value }))
              }
            />
          </div>
          <Button type="submit" className="w-full">
            {editingId ? 'Enregistrer les modifications' : 'Ajouter ces coordonnées'}
          </Button>
        </form>
      </Modal>
    </Card>
  )
}
