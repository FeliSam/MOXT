import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import {
  ensurePhoneCountry,
  phoneError,
  phonePlaceholder,
  validatePhone,
} from '../../../config/phone'
import { useLanguage } from '../../../contexts/useLanguage'
import { saveTransferProfile } from '../../account/accountSlice'
import { countryLabel } from '../../transfers/transferAccountUtils'
import { currencyForCountry } from '../../transfers/transferConfig'
import { updateOrderReceiveDetails } from '../p2pSlice'
import { addToast } from '../../ui/uiSlice'
import { receiveCountryForP2POffer, usePaymentMethodOptions } from '../usePaymentMethodOptions'

/**
 * Après « J’ai payé » : l’acheteur indique où recevoir la devise cible.
 * Méthodes dynamiques selon le sens (RUB → banques SBP russes, sinon réseaux du pays).
 */
export function P2PBuyerReceiveModal({ open, onClose, order, user }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user.country : 'BJ') || 'BJ'
  const receiveCountry = receiveCountryForP2POffer(order?.toCurrency, originCountry)
  const { options: methodOptions, loading: methodsLoading, isRussia } = usePaymentMethodOptions(
    receiveCountry,
  )
  const transferProfiles = useSelector((state) =>
    (state.account.transferProfiles || []).filter((item) => item.userId === user?.id),
  )

  const relevantFavorites = useMemo(
    () =>
      transferProfiles.filter(
        (profile) =>
          !profile.country ||
          profile.country === receiveCountry ||
          currencyForCountry(profile.country) === order?.toCurrency,
      ),
    [order?.toCurrency, receiveCountry, transferProfiles],
  )

  const [source, setSource] = useState('profile')
  const [favoriteId, setFavoriteId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [method, setMethod] = useState('')
  const [saveFavorite, setSaveFavorite] = useState(true)
  const [phoneErr, setPhoneErr] = useState('')

  useEffect(() => {
    if (!open || !user) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset du formulaire à l'ouverture
    setSource('profile')
    setFavoriteId('')
    setSaveFavorite(true)
    setPhoneErr('')
    setName(`${user.firstName || ''} ${user.lastName || ''}`.trim())
    setPhone(ensurePhoneCountry(user.phone || '', receiveCountry))
  }, [open, receiveCountry, user])

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- aligne la méthode sur les options chargées
    setMethod((current) => {
      if (current && methodOptions.includes(current)) return current
      const existing = order?.buyerReceiveMethod
      if (existing && methodOptions.includes(existing)) return existing
      return ''
    })
  }, [methodOptions, open, order?.buyerReceiveMethod])

  function applyProfile() {
    if (!user) return
    setSource('profile')
    setFavoriteId('')
    setName(`${user.firstName || ''} ${user.lastName || ''}`.trim())
    setPhone(ensurePhoneCountry(user.phone || '', receiveCountry))
  }

  function applyFavorite(id) {
    setSource('favorite')
    setFavoriteId(id)
    const profile = relevantFavorites.find((item) => item.id === id)
    if (!profile) return
    setName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim())
    setPhone(ensurePhoneCountry(profile.phone || '', receiveCountry))
    if (profile.method && methodOptions.includes(profile.method)) {
      setMethod(profile.method)
    }
  }

  function handleSave() {
    const receiveName = name.trim()
    const receivePhone = phone.trim()
    const receiveMethod = method.trim()

    if (!receiveMethod) {
      dispatch(
        addToast({
          tone: 'warning',
          title: t('validation.p2p.methodRequired'),
          message: isRussia
            ? t('p2p.publish.methodRussia')
            : t('p2p.publish.methodAfrica', { country: countryLabel(receiveCountry) }),
        }),
      )
      return
    }

    if (!validatePhone(receivePhone, receiveCountry)) {
      setPhoneErr(phoneError(receiveCountry))
      dispatch(
        addToast({
          tone: 'warning',
          title: t('p2p.order.buyerReceive.missingPhoneTitle'),
          message: phoneError(receiveCountry) || t('p2p.order.buyerReceive.missingPhoneBody'),
        }),
      )
      return
    }

    dispatch(
      updateOrderReceiveDetails({
        id: order.id,
        buyerReceiveName: receiveName,
        buyerReceivePhone: receivePhone,
        buyerReceiveMethod: receiveMethod,
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
          country: receiveCountry,
          method: receiveMethod,
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
      open={Boolean(open && order && user)}
      onClose={onClose}
      title={t('p2p.order.buyerReceive.title')}
      description={t('p2p.order.buyerReceive.description', {
        currency: order?.toCurrency || '',
      })}
    >
      {order && user ? (
        <div className="grid gap-4">
          <p className="text-sm text-[var(--app-text-muted)]">
            {isRussia
              ? t('p2p.publish.receiveHintRussia')
              : t('p2p.publish.receiveHintAfrica', { country: countryLabel(receiveCountry) })}
          </p>

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
                  {profile.method ? ` · ${profile.method}` : ''}
                </option>
              ))}
            </Select>
          ) : null}

          <Select
            id="p2p-buyer-method"
            label={
              isRussia
                ? t('p2p.publish.methodRussia')
                : t('p2p.publish.methodAfrica', { country: countryLabel(receiveCountry) })
            }
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            disabled={methodsLoading && isRussia}
          >
            <option value="">
              {methodsLoading
                ? t('p2p.publish.methodLoading')
                : t('p2p.publish.methodPlaceholder')}
            </option>
            {methodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>

          <Input
            id="p2p-buyer-name"
            label={t('p2p.publish.receiveName')}
            placeholder={t('p2p.publish.receiveNamePlaceholder')}
            value={name}
            onChange={(event) => {
              setSource('manual')
              setName(event.target.value)
            }}
          />
          <Input
            id="p2p-buyer-phone"
            label={t('p2p.publish.receivePhone')}
            placeholder={phonePlaceholder(receiveCountry)}
            value={phone}
            error={phoneErr}
            onChange={(event) => {
              setSource('manual')
              setPhoneErr('')
              setPhone(ensurePhoneCountry(event.target.value, receiveCountry))
            }}
            onFocus={() => {
              if (!String(phone || '').replace(/\D/g, '').slice(1)) {
                setPhone(ensurePhoneCountry('', receiveCountry))
              }
            }}
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
      ) : null}
    </Modal>
  )
}
