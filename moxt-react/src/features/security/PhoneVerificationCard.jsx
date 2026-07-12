import { useState } from 'react'
import { FiCheckCircle, FiSmartphone } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { isPhoneVerified, isValidRussianPhone } from '@moxt/shared/auth/userSecurity.js'
import {
  confirmPhoneVerification,
  requestPhoneVerificationOtp,
} from '../auth/authSlice'
import { addToast } from '../ui/uiSlice'

export function PhoneVerificationCard({ className = '' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState(user?.phone || '+7')

  if (!user) return null

  if (isPhoneVerified(user)) {
    return (
      <Alert variant="success" title="Numéro russe vérifié" className={className}>
        {user.phone} est confirmé. Vous pouvez publier des annonces, colis, jobs et événements.
      </Alert>
    )
  }

  async function sendCode() {
    if (!isValidRussianPhone(phone)) {
      dispatch(
        addToast({
          title: 'Numéro invalide',
          message: 'Utilisez un numéro russe au format +7XXXXXXXXXX.',
          tone: 'error',
        }),
      )
      return
    }
    const result = await dispatch(requestPhoneVerificationOtp(phone))
    if (requestPhoneVerificationOtp.fulfilled.match(result)) {
      if (result.payload.user) {
        dispatch(
          addToast({
            title: 'Numéro confirmé',
            message: 'Votre numéro russe est déjà vérifié sur votre compte.',
            tone: 'success',
          }),
        )
        return
      }
      setOtpSent(true)
      dispatch(
        addToast({
          title: 'Code envoyé',
          message: `Un SMS a été envoyé au ${result.payload.phone}.`,
          tone: 'info',
        }),
      )
    }
  }

  async function confirmCode() {
    if (!/^\d{6}$/.test(otp)) return
    const result = await dispatch(confirmPhoneVerification({ phone, token: otp }))
    if (confirmPhoneVerification.fulfilled.match(result)) {
      setOtp('')
      setOtpSent(false)
      dispatch(
        addToast({
          title: 'Numéro confirmé',
          message: 'Votre numéro russe est vérifié. Vous pouvez publier sur MOXT.',
          tone: 'success',
        }),
      )
    }
  }

  return (
    <Card className={`grid gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <FiSmartphone />
        </span>
        <div>
          <h2 className="font-black">Confirmer votre numéro russe</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Obligatoire pour publier une annonce, un colis, un job ou un événement. Un numéro unique
            par compte.
          </p>
        </div>
      </div>
      <Input
        id="phone-verify-number"
        label="Numéro russe (+7)"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      {!otpSent ? (
        <Button type="button" icon={FiSmartphone} loading={status === 'loading'} onClick={sendCode}>
          Envoyer le code SMS
        </Button>
      ) : (
        <>
          <Input
            id="phone-verify-otp"
            label="Code reçu par SMS"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              icon={FiCheckCircle}
              loading={status === 'loading'}
              disabled={otp.length !== 6}
              onClick={confirmCode}
            >
              Confirmer le numéro
            </Button>
            <Button type="button" variant="secondary" onClick={sendCode}>
              Renvoyer le code
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
