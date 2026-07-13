import { useEffect, useState } from 'react'
import { FiCheckCircle, FiMail } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { isEmailVerified } from '@moxt/shared/auth/userSecurity.js'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import {
  clearAuthError,
  confirmEmailVerification,
  requestEmailVerificationOtp,
} from '../auth/authSlice'
import { authErrorToast } from '../auth/authErrorMessages'
import { addToast } from '../ui/uiSlice'

const RESEND_COOLDOWN_SECONDS = 60

export function EmailVerificationCard({ className = '' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const authError = useSelector((state) => state.auth.error)
  const authStatus = useSelector((state) => state.auth.status)
  const [busy, setBusy] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpType, setOtpType] = useState('email_change')
  const [email, setEmail] = useState(user?.email || '')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!authError) return
    dispatch(addToast(authErrorToast('E-mail impossible', authError)))
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

  if (isEmailVerified(user)) {
    return (
      <Alert variant="success" title="E-mail confirmé" className={className}>
        {user.email} est vérifié. Vous pouvez créer une entreprise et soumettre votre dossier
        d&apos;identité.
      </Alert>
    )
  }

  async function sendCode() {
    const normalized = email.trim().toLowerCase()
    if (!normalized.includes('@')) {
      dispatch(
        addToast({
          title: 'E-mail invalide',
          message: 'Saisissez une adresse e-mail valide.',
          tone: 'error',
        }),
      )
      return
    }
    setBusy(true)
    try {
      const result = await dispatch(requestEmailVerificationOtp(normalized))
      if (!requestEmailVerificationOtp.fulfilled.match(result)) return
      if (result.payload.user) {
        dispatch(
          addToast({
            title: 'E-mail confirmé',
            message: 'Votre adresse e-mail est déjà vérifiée.',
            tone: 'success',
          }),
        )
        return
      }
      setOtpType(result.payload.otpType || 'email_change')
      setOtpSent(true)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      dispatch(
        addToast({
          title: 'Code envoyé',
          message: `Un code a été envoyé à ${normalized}. Vérifiez vos spams.`,
          tone: 'success',
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
      const result = await dispatch(
        confirmEmailVerification({ email: email.trim().toLowerCase(), token: otp, otpType }),
      )
      if (!confirmEmailVerification.fulfilled.match(result)) return
      setOtpSent(false)
      setOtp('')
      dispatch(
        addToast({
          title: 'E-mail confirmé',
          message: 'Votre adresse e-mail est maintenant vérifiée.',
          tone: 'success',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className={`grid gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <FiMail />
        </span>
        <div>
          <h2 className="font-black">Confirmer votre e-mail</h2>
          <p className="text-sm text-[var(--app-text-muted)]">
            Votre e-mail a été enregistré à l&apos;inscription. Confirmez-le ici pour créer une
            entreprise et valider votre identité MOXT.
          </p>
        </div>
      </div>
      <Input
        id="verify-email"
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={otpSent}
      />
      {otpSent ? (
        <>
          <Input
            id="verify-email-otp"
            label="Code reçu par e-mail"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              icon={FiCheckCircle}
              loading={busy || authStatus === 'loading'}
              disabled={otp.length !== 6}
              onClick={confirmCode}
            >
              Confirmer l&apos;e-mail
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={resendCooldown > 0 || busy}
              onClick={sendCode}
            >
              {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
            </Button>
          </div>
        </>
      ) : (
        <Button type="button" loading={busy || authStatus === 'loading'} onClick={sendCode}>
          Envoyer le code de confirmation
        </Button>
      )}
    </Card>
  )
}
