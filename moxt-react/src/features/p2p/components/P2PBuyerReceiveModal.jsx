import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { useLanguage } from '../../../contexts/useLanguage'
import { saveTransferProfile } from '../../account/accountSlice'
import { currencyForCountry } from '../../transfers/transferConfig'
import { updateOrderReceiveDetails } from '../p2pSlice'
import { addToast } from '../../ui/uiSlice'

/**
 * Après validation du paiement P2P : l’acheteur indique où recevoir la devise cible
 * (profil, favori transfert, ou saisie manuelle).
 */
export function P2PBuyerReceiveModal({ open, onClose, order, user }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const transferProfiles = useSelector((state) =>
    (state.account.transferProfiles || []).filter((item) => item.userId === user?.id),
  )

  const targetCountry = useMemo(() => {
    if (!order) return user?.originCountry || user?.country || 'BJ'
    const to = order.toCurrency
    if (to === 'RUB') return 'RU'
    return user?.originCountry || (user?.country !== 'RU' ? user.country : 'BJ')
  }, [order, user])

  const relevantFavorites = useMemo(
    () =>
      transferProfiles.filter(
        (profile) =>
          !profile.country ||
          profile.country === targetCountry ||
          currencyForCountry(profile.country) === order?.toCurrency,
      ),
    [order?.toCurrency, targetCountry, transferProfiles],
  )

  const [source, setSource] = useState('profile')
  const [favoriteId, setFavoriteId] = useState('')
  const [name, setName] = useState(
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
  )
  const [phone, setPhone] = useState(user?.phone || '')
  const [method, setMethod] = useState(order?.method || '')
  const [saveFavorite, setSaveFavorite] = useState(true)

  if (!open || !order || !user) return null

  function applyProfile() {
    setSource('profile')
    setName(`${user.firstName || ''} ${user.lastName || ''}`.trim())
    setPhone(user.phone || '')
  }

  function applyFavorite(id) {
    setSource('favorite')
    setFavoriteId(id)
    const profile = relevantFavorites.find((item) => item.id === id)
    if (!profile) return
    setName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim())
    setPhone(profile.phone || '')
    setMethod(profile.method || method)
  }

  function handleSave() {
    const receiveName = name.trim()
    const receivePhone = phone.trim()
    if (!receivePhone) {
      dispatch(
        addToast({
          tone: 'warning',
          title: t('p2p.order.buyerReceive.missingPhoneTitle'),
          message: t('p2p.order.buyerReceive.missingPhoneBody'),
        }),
      )
      return
    }

    dispatch(
      updateOrderReceiveDetails({
        id: order.id,
        buyerReceiveName: receiveName,
        buyerReceivePhone: receivePhone,
        buyerReceiveMethod: method.trim(),
      }),
    )

    if (saveFavorite && source !== 'favorite') {
      const [firstName = '', ...rest] = receiveName.split(/\s+/)
      dispatch(
        saveTransferProfile({
          userId: user.id,
          firstName: firstName || user.firstName || 'MOXT',
          lastName: rest.join(' ') || user.lastName || '',
          phone: receivePhone,
          country: targetCountry,
          method: method.trim() || order.method || 'other',
        }),
      )
    }

    dispatch(
      addToast({
        tone: 'success',
        title: t('p2p.order.buyerReceive.savedTitle'),
        message: t('p2p.order.buyerReceive.savedBody', { currency: order.toCurrency }),
      }),
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('p2p.order.buyerReceive.title')}
      description={t('p2p.order.buyerReceive.description', {
        currency: order.toCurrency,
      })}
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={source === 'profile' ? 'primary' : 'secondary'}
            onClick={applyProfile}
          >
            {t('p2p.order.buyerReceive.useProfile')}
          </Button>
          <Button
            size="sm"
            variant={source === 'manual' ? 'primary' : 'secondary'}
            onClick={() => setSource('manual')}
          >
            {t('p2p.order.buyerReceive.manual')}
          </Button>
        </div>

        {relevantFavorites.length ? (
          <Select
            id="p2p-buyer-favorite"
            label={t('p2p.order.buyerReceive.favorite')}
            value={favoriteId}
            onChange={(event) => {
              if (event.target.value) applyFavorite(event.target.value)
            }}
          >
            <option value="">{t('p2p.order.buyerReceive.favoritePlaceholder')}</option>
            {relevantFavorites.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.firstName} {profile.lastName} · {profile.phone}
              </option>
            ))}
          </Select>
        ) : null}

        <Input
          id="p2p-buyer-name"
          label={t('p2p.order.receiveName')}
          value={name}
          onChange={(event) => {
            setSource('manual')
            setName(event.target.value)
          }}
        />
        <Input
          id="p2p-buyer-phone"
          label={t('p2p.order.receivePhone')}
          value={phone}
          onChange={(event) => {
            setSource('manual')
            setPhone(event.target.value)
          }}
        />
        <Input
          id="p2p-buyer-method"
          label={t('p2p.detail.method')}
          value={method}
          onChange={(event) => setMethod(event.target.value)}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveFavorite}
            onChange={(event) => setSaveFavorite(event.target.checked)}
          />
          {t('p2p.order.buyerReceive.saveFavorite')}
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave}>{t('p2p.order.buyerReceive.save')}</Button>
          <Button variant="secondary" onClick={onClose}>
            {t('p2p.order.buyerReceive.later')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
