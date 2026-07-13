import { useEffect, useState } from 'react'
import { FiCheckCircle, FiSmartphone } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { flagEmoji } from '../../config/flags'
import { constrainPhone } from '../../config/phone'
import { isPhoneVerified, isValidRussianPhone } from '@moxt/shared/auth/userSecurity.js'
import {
  clearAuthError,
  confirmPhoneVerification,
  requestPhoneVerificationOtp,
} from '../auth/authSlice'
import { authErrorToast } from '../auth/authErrorMessages'
import { addToast } from '../ui/uiSlice'

const RESEND_COOLDOWN_SECONDS = 60

export function PhoneVerificationCard({ className = '' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const authError = useSelector((state) => state.auth.error)
  const authStatus = useSelector((state) => state.auth.status)
  const [busy, setBusy] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpType, setOtpType] = useState('phone_change')
  const [phone, setPhone] = useState(user?.phone || '+7')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!authError) return
    dispatch(addToast(authErrorToast('Envoi SMS impossible', authError)))
    dispatch(clearAuthError())
  }, [authError, dispatch])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

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
    setBusy(true)
    try {
      const result = await dispatch(requestPhoneVerificationOtp(phone))
      if (!requestPhoneVerificationOtp.fulfilled.match(result)) return
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
      setOtp('')
      setOtpType(result.payload.otpType || 'phone_change')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      dispatch(clearAuthError())
      dispatch(
        addToast({
          title: 'Code envoyé',
          message: `Un code à 6 chiffres a été envoyé au ${result.payload.phone} par SMS.`,
          tone: 'info',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  async function confirmCode() {
    if (!/^\d{6}$/.test(otp)) return
    setBusy(true)
    try {
      const result = await dispatch(confirmPhoneVerification({ phone, token: otp, otpType }))
      if (!confirmPhoneVerification.fulfilled.match(result)) return
      setOtp('')
      setOtpSent(false)
      dispatch(
        addToast({
          title: 'Numéro confirmé',
          message: 'Votre numéro russe est vérifié. Vous pouvez publier sur MOXT.',
          tone: 'success',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  const loading = busy || authStatus === 'loading'

  return (
    <Card className={`grid gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <FiSmartphone />
        </span>
        <div>
          <h2 className="font-black">Confirmer votre numéro russe</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Même confirmation par SMS que lors de l&apos;inscription. Obligatoire pour publier une
            annonce, un colis, un job ou un événement.
          </p>
        </div>
      </div>

      {!otpSent ? (
        <>
          <Input
            id="phone-verify-number"
            label="Numéro russe (+7)"
            type="tel"
            autoComplete="tel"
            placeholder="+7XXXXXXXXXX"
            iconLeft={<span className="text-base leading-none">{flagEmoji('RU')}</span>}
            value={phone}
            onChange={(event) => setPhone(constrainPhone(event.target.value, '+7', 10))}
          />
          <Button type="button" icon={FiSmartphone} loading={loading} onClick={sendCode}>
            Envoyer le code SMS
          </Button>
        </>
      ) : (
        <>
          <Alert variant="info">
            Un code à 6 chiffres a été envoyé au <strong>{phone}</strong> par SMS.
          </Alert>
          <Input
            id="phone-verify-otp"
            label="Code reçu par SMS"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Button
            type="button"
            icon={FiCheckCircle}
            loading={loading}
            disabled={otp.length !== 6}
            onClick={confirmCode}
          >
            Confirmer le numéro
          </Button>
          <div className="text-center text-sm text-[var(--app-text-muted)]">
            <span>Vous n&apos;avez pas reçu le SMS ? </span>
            <button
              type="button"
              className="font-bold text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-300"
              disabled={resendCooldown > 0 || loading}
              onClick={sendCode}
            >
              {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
            </button>
          </div>
          <button
            type="button"
            className="text-sm font-bold text-[var(--app-text-muted)] underline-offset-2 hover:underline"
            onClick={() => {
              setOtpSent(false)
              setOtp('')
              setOtpType('phone_change')
              dispatch(clearAuthError())
            }}
          >
            Modifier le numéro
          </button>
        </>
      )}
    </Card>
  )
}
