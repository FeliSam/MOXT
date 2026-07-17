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
import { useLanguage } from '../../contexts/useLanguage'

import { OTP_RESEND_COOLDOWN_SECONDS } from '@moxt/shared/auth/otpCooldown.js'

export function EmailVerificationCard({
  className = '',
  variant = 'card',
  idPrefix = 'verify',
  allowChangeWhenVerified = true,
}) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
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
    dispatch(addToast(authErrorToast(t('security.email.errorTitle'), authError, 'error', t)))
    dispatch(clearAuthError())
  }, [authError, dispatch, t])

  useEffect(() => {
    if (!otpSent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft email from auth profile
      setEmail(user?.email || '')
    }
  }, [user?.email, otpSent])

  // Si Auth a déjà confirmé (Safari / autre onglet), quitter le flux OTP
  useEffect(() => {
    if (!verified) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- exit OTP when Auth confirms elsewhere
    setOtpSent(false)
    setOtp('')
    if (!changeMode) {
      setEmail(user?.email || '')
    }
  }, [verified, user?.email, changeMode])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  if (!user) return null

  const showOtpFlow = changeMode || !verified

  async function sendCode() {
    const normalized = email.trim().toLowerCase()
    if (!normalized.includes('@')) {
      dispatch(
        addToast({
          title: t('security.email.invalidTitle'),
          message: t('security.email.invalidBody'),
          tone: 'error',
        }),
      )
      return
    }
    if (verified && !emailDiffersFromProfile && !changeMode) {
      dispatch(
        addToast({
          title: t('security.email.alreadyConfirmedTitle'),
          message: t('security.email.alreadyConfirmedBody'),
          tone: 'success',
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
        setOtpSent(false)
        setOtp('')
        dispatch(
          addToast({
            title: t('security.email.confirmedTitle'),
            message: t('security.email.alreadyVerifiedBody'),
            tone: 'success',
          }),
        )
        return
      }
      setOtpType(result.payload.otpType || 'email_change')
      setOtpSent(true)
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
      dispatch(
        addToast({
          title: t('security.email.codeSentTitle'),
          message: t('security.email.codeSentBody', { email: normalized }),
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
          title: t('security.email.confirmedTitle'),
          message: emailDiffersFromProfile
            ? t('security.email.confirmedUpdatedBody', { email: confirmedEmail })
            : t('security.email.confirmedBody'),
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

  if (verified && !showOtpFlow) {
    if (embedded) {
      return (
        <div className={`grid gap-2 ${className}`}>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {t('security.email.verifiedInline', { email: user.email })}
          </p>
          {allowChangeWhenVerified ? (
            <Button type="button" variant="secondary" onClick={() => setChangeMode(true)}>
              {t('security.email.changeButton')}
            </Button>
          ) : null}
        </div>
      )
    }
    return (
      <Alert variant="success" title={t('security.email.verifiedTitle')} className={className}>
        <div className="grid gap-3">
          <p>{t('security.email.verifiedBody', { email: user.email })}</p>
          {allowChangeWhenVerified ? (
            <Button type="button" variant="secondary" onClick={() => setChangeMode(true)}>
              {t('security.email.changeButton')}
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
              {verified ? t('security.email.changeTitle') : t('security.email.confirmTitle')}
            </h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              {verified
                ? t('security.email.changeSubtitle')
                : t('security.email.confirmSubtitle')}
            </p>
          </div>
        </div>
      ) : null}
      <Input
        id={`${idPrefix}-email`}
        label={t('security.email.addressLabel')}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={otpSent}
        hint={
          embedded
            ? verified
              ? t('security.email.hintChange')
              : t('security.email.hintConfirm')
            : undefined
        }
      />
      {otpSent ? (
        <>
          <Input
            id={`${idPrefix}-email-otp`}
            label={t('security.email.otpLabel')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            hint={t('security.email.otpHint')}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              icon={FiCheckCircle}
              loading={busy || authStatus === 'loading'}
              disabled={otp.length !== 6}
              onClick={confirmCode}
            >
              {t('security.email.confirmButton')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={resendCooldown > 0 || busy}
              onClick={sendCode}
            >
              {resendCooldown > 0
                ? t('security.email.resendCooldown', { seconds: resendCooldown })
                : t('security.email.resend')}
            </Button>
            {verified ? (
              <Button type="button" variant="ghost" onClick={cancelChange}>
                {t('security.email.cancel')}
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" loading={busy || authStatus === 'loading'} onClick={sendCode}>
            {verified ? t('security.email.sendValidation') : t('security.email.sendConfirmation')}
          </Button>
          {verified && changeMode ? (
            <Button type="button" variant="ghost" onClick={cancelChange}>
              {t('security.email.cancel')}
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
