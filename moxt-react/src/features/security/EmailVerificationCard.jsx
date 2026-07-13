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

export function EmailVerificationCard({
  className = '',
  variant = 'card',
  idPrefix = 'verify',
  allowChangeWhenVerified = true,
}) {
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
  const [changeMode, setChangeMode] = useState(false)

  const embedded = variant === 'embedded'
  const verified = isEmailVerified(user)
  const profileEmail = String(user?.email || '').trim().toLowerCase()
  const draftEmail = email.trim().toLowerCase()
  const emailDiffersFromProfile = Boolean(profileEmail && draftEmail && draftEmail !== profileEmail)

  useEffect(() => {
    if (!authError) return
    dispatch(addToast(authErrorToast('E-mail impossible', authError)))
    dispatch(clearAuthError())
  }, [authError, dispatch])

  useEffect(() => {
    if (!otpSent) {
      setEmail(user?.email || '')
    }
  }, [user?.email, otpSent])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  if (!user) return null

  const showOtpFlow = embedded || changeMode || !verified

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
        setChangeMode(false)
        setEmail(result.payload.user.email || normalized)
        dispatch(
          addToast({
            title: 'E-mail confirmé',
            message: 'Cette adresse e-mail est déjà vérifiée sur votre compte.',
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
      const confirmedEmail = result.payload?.email || email.trim().toLowerCase()
      setEmail(confirmedEmail)
      setOtpSent(false)
      setOtp('')
      setChangeMode(false)
      dispatch(
        addToast({
          title: 'E-mail confirmé',
          message: emailDiffersFromProfile
            ? `Votre adresse a été mise à jour : ${confirmedEmail}.`
            : 'Votre adresse e-mail est maintenant vérifiée.',
          tone: 'success',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  function cancelChange() {
    setChangeMode(false)
    setOtpSent(false)
    setOtp('')
    setEmail(user?.email || '')
  }

  if (verified && !showOtpFlow && !embedded) {
    return (
      <Alert variant="success" title="E-mail confirmé" className={className}>
        <div className="grid gap-3">
          <p>
            {user.email} est vérifié. Vous pouvez créer une entreprise et soumettre votre dossier
            d&apos;identité.
          </p>
          {allowChangeWhenVerified ? (
            <Button type="button" variant="secondary" onClick={() => setChangeMode(true)}>
              Changer d&apos;adresse e-mail
            </Button>
          ) : null}
        </div>
      </Alert>
    )
  }

  const body = (
  <>
      {!embedded ? (
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <FiMail />
          </span>
          <div>
            <h2 className="font-black">
              {verified ? 'Modifier votre e-mail' : 'Confirmer votre e-mail'}
            </h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              {verified
                ? 'Saisissez la nouvelle adresse puis validez le code reçu par e-mail.'
                : 'Confirmez votre adresse pour créer une entreprise et valider votre identité MOXT.'}
            </p>
          </div>
        </div>
      ) : null}
      <Input
        id={`${idPrefix}-email`}
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={otpSent}
        hint={
          embedded
            ? verified
              ? 'Modifiable uniquement après confirmation par code OTP envoyé à la nouvelle adresse.'
              : 'Confirmez cette adresse avec le code reçu par e-mail.'
            : undefined
        }
      />
      {verified && embedded ? (
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          E-mail actuel vérifié : {user.email}
        </p>
      ) : null}
      {otpSent ? (
        <>
          <Input
            id={`${idPrefix}-email-otp`}
            label="Code reçu par e-mail"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            hint="Le code valide l'adresse saisie ci-dessus et met à jour votre profil si elle diffère."
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
            {verified && !embedded ? (
              <Button type="button" variant="ghost" onClick={cancelChange}>
                Annuler
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" loading={busy || authStatus === 'loading'} onClick={sendCode}>
            {verified ? 'Envoyer le code de validation' : 'Envoyer le code de confirmation'}
          </Button>
          {verified && changeMode && !embedded ? (
            <Button type="button" variant="ghost" onClick={cancelChange}>
              Annuler
            </Button>
          ) : null}
        </div>
      )}
    </>
  )

  if (embedded) {
    return <div className={`grid gap-4 ${className}`}>{body}</div>
  }

  return <Card className={`grid gap-4 ${className}`}>{body}</Card>
}
