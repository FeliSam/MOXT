import { useEffect, useState } from 'react'
import { FiKey, FiLock, FiMonitor, FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isEmailVerified, isPhoneVerified } from '@moxt/shared/auth/userSecurity.js'
import { BackButton } from '../components/ui/BackButton'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { EmailVerificationCard } from '../features/security/EmailVerificationCard'
import {
  selectAccountPreferences,
  updateAccountPreferences,
} from '../features/account/accountSlice'
import { authService } from '../features/auth/authService'
import { addToast } from '../features/ui/uiSlice'
import { useLanguage } from '../contexts/useLanguage'

const MFA_AVAILABLE = false
import { OTP_RESEND_COOLDOWN_SECONDS } from '@moxt/shared/auth/otpCooldown.js'

export function SecurityPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useSelector((state) => state.auth.user)
  const preferences = useSelector((state) => selectAccountPreferences(state, user.id))
  const emailConfirmed = isEmailVerified(user)
  const phoneConfirmed = isPhoneVerified(user)
  const highlightEmail = searchParams.get('verify') === 'email' || searchParams.get('email') === 'confirmed'

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordOtp, setPasswordOtp] = useState('')
  const [passwordOtpSent, setPasswordOtpSent] = useState(false)
  const [passwordResendCooldown, setPasswordResendCooldown] = useState(0)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [mfaOpen, setMfaOpen] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaChallengeId, setMfaChallengeId] = useState('')
  const [mfaQrCode, setMfaQrCode] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)

  useEffect(() => {
    if (!highlightEmail || emailConfirmed) return undefined
    const timer = window.setTimeout(() => {
      document.getElementById('security-email-verify')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [highlightEmail, emailConfirmed])

  useEffect(() => {
    if (!MFA_AVAILABLE) return undefined
    let cancelled = false
    authService
      .listMfaFactors()
      .then((data) => {
        if (cancelled) return
        const verified = (data?.totp || []).some((factor) => factor.status === 'verified')
        setMfaEnabled(verified)
      })
      .catch(() => {
        if (!cancelled) setMfaEnabled(Boolean(preferences.twoFactorEnabled))
      })
    return () => {
      cancelled = true
    }
  }, [preferences.twoFactorEnabled])

  useEffect(() => {
    if (passwordResendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setPasswordResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [passwordResendCooldown])

  function resetPasswordModal() {
    setPasswordOtp('')
    setPasswordOtpSent(false)
    setPasswordResendCooldown(0)
    setNewPassword('')
    setConfirmPassword('')
  }

  function openPasswordModal() {
    if (!emailConfirmed) {
      dispatch(
        addToast({
          title: t('security.toasts.emailRequiredTitle'),
          message: t('security.toasts.emailRequiredBody'),
          tone: 'error',
        }),
      )
      return
    }
    resetPasswordModal()
    setPasswordOpen(true)
  }

  async function sendPasswordOtp() {
    setPasswordLoading(true)
    try {
      const result = await authService.requestPasswordChangeOtp(user)
      setPasswordOtpSent(true)
      setPasswordResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
      dispatch(
        addToast({
          title: t('security.toasts.otpSentTitle'),
          message: t('security.toasts.otpSentBody', { email: result.email }),
          tone: 'success',
        }),
      )
    } catch (error) {
      dispatch(addToast({ title: t('security.toasts.failure'), message: error.message, tone: 'error' }))
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault()
    if (!/^\d{6}$/.test(passwordOtp)) {
      dispatch(
        addToast({
          title: t('security.toasts.invalidOtpTitle'),
          message: t('security.toasts.invalidOtpBody'),
          tone: 'error',
        }),
      )
      return
    }
    if (newPassword !== confirmPassword) {
      dispatch(
        addToast({
          title: t('security.toasts.passwordMismatchTitle'),
          message: t('security.toasts.passwordMismatchBody'),
          tone: 'error',
        }),
      )
      return
    }
    setPasswordLoading(true)
    try {
      await authService.updatePassword(newPassword, { nonce: passwordOtp })
      dispatch(
        addToast({
          title: t('security.toasts.passwordUpdatedTitle'),
          message: t('security.toasts.passwordUpdatedBody'),
          tone: 'success',
        }),
      )
      setPasswordOpen(false)
      resetPasswordModal()
    } catch (error) {
      dispatch(addToast({ title: t('security.toasts.failure'), message: error.message, tone: 'error' }))
    } finally {
      setPasswordLoading(false)
    }
  }

  async function startMfaEnrollment() {
    setMfaLoading(true)
    try {
      const enrollment = await authService.enrollMfa()
      setMfaFactorId(enrollment.id)
      setMfaQrCode(enrollment.totp?.qr_code || '')
      const challenge = await authService.challengeMfa(enrollment.id)
      setMfaChallengeId(challenge.id)
      setMfaOpen(true)
    } catch (error) {
      dispatch(addToast({ title: t('security.mfa.unavailableTitle'), message: error.message, tone: 'error' }))
    } finally {
      setMfaLoading(false)
    }
  }

  async function verifyMfa(event) {
    event.preventDefault()
    setMfaLoading(true)
    try {
      await authService.verifyMfaEnrollment({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      })
      setMfaEnabled(true)
      dispatch(
        updateAccountPreferences({
          userId: user.id,
          preferences: { twoFactorEnabled: true },
        }),
      )
      dispatch(
        addToast({
          title: t('security.mfa.enabledTitle'),
          message: t('security.mfa.enabledBody'),
          tone: 'success',
        }),
      )
      setMfaOpen(false)
      setMfaCode('')
    } catch (error) {
      dispatch(addToast({ title: t('security.toasts.invalidOtpTitle'), message: error.message, tone: 'error' }))
    } finally {
      setMfaLoading(false)
    }
  }

  async function disableMfa() {
    setMfaLoading(true)
    try {
      const factors = await authService.listMfaFactors()
      for (const factor of factors.totp || []) {
        if (factor.status === 'verified') {
          await authService.unenrollMfa(factor.id)
        }
      }
      setMfaEnabled(false)
      dispatch(
        updateAccountPreferences({
          userId: user.id,
          preferences: { twoFactorEnabled: false },
        }),
      )
      dispatch(
        addToast({
          title: t('security.mfa.disabledTitle'),
          message: t('security.mfa.disabledBody'),
          tone: 'success',
        }),
      )
    } catch (error) {
      dispatch(addToast({ title: t('common.failure'), message: error.message, tone: 'error' }))
    } finally {
      setMfaLoading(false)
    }
  }

  async function signOutOthers() {
    try {
      await authService.signOutOtherSessions()
      dispatch(
        addToast({
          title: t('security.sessions.closedTitle'),
          message: t('security.sessions.closedBody'),
          tone: 'success',
        }),
      )
    } catch (error) {
      dispatch(addToast({ title: t('common.failure'), message: error.message, tone: 'error' }))
    }
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={t('security.pageEyebrow')}
        title={t('security.pageTitle')}
        description={t('security.pageDescription')}
        actions={<BackButton appearance="link" />}
      />
      {phoneConfirmed && !emailConfirmed ? (
        <Alert variant="info" title={t('security.postSignupEmailTitle')}>
          <div className="grid gap-3">
            <p>{t('security.postSignupEmailBody')}</p>
            <div>
              <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
                {t('security.postSignupEmailLater')}
              </Button>
            </div>
          </div>
        </Alert>
      ) : null}
      {searchParams.get('email') === 'confirmed' && emailConfirmed ? (
        <Alert variant="success" title={t('security.emailConfirmedToastTitle')}>
          {t('security.emailConfirmedToastBody')}
        </Alert>
      ) : null}
      <div
        id="security-email-verify"
        className={
          highlightEmail && !emailConfirmed
            ? 'rounded-3xl ring-2 ring-brand-500 ring-offset-2 ring-offset-[var(--app-bg)]'
            : undefined
        }
      >
        <EmailVerificationCard />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <FiLock className="text-2xl text-brand-600" />
          <h2 className="mt-4 font-black">{t('security.passwordTitle')}</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {emailConfirmed
              ? t('security.passwordHintOtp')
              : t('security.passwordHintConfirmEmail')}
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            disabled={!emailConfirmed}
            onClick={openPasswordModal}
          >
            {t('security.changePassword')}
          </Button>
        </Card>
        <Card
          className={!MFA_AVAILABLE ? 'opacity-55' : undefined}
          aria-disabled={!MFA_AVAILABLE || undefined}
        >
          <FiKey className={`text-2xl ${MFA_AVAILABLE ? 'text-brand-600' : 'text-[var(--app-text-muted)]'}`} />
          <h2 className="mt-4 font-black">{t('security.mfa.title')}</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {MFA_AVAILABLE
              ? mfaEnabled
                ? t('security.mfa.statusOn')
                : t('security.mfa.statusOff')
              : t('security.mfa.comingSoonBody')}
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            disabled={!MFA_AVAILABLE || mfaLoading}
            title={!MFA_AVAILABLE ? t('security.mfa.comingSoon') : undefined}
            onClick={mfaEnabled ? disableMfa : startMfaEnrollment}
          >
            {MFA_AVAILABLE
              ? mfaEnabled
                ? t('security.mfa.disable')
                : t('security.mfa.enable')
              : t('security.mfa.comingSoon')}
          </Button>
        </Card>
        <Card>
          <FiShield className="text-2xl text-brand-600" />
          <h2 className="mt-4 font-black">{t('security.alerts.title')}</h2>
          <label className="mt-5 flex items-center gap-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={preferences.securityAlerts}
              onChange={(event) =>
                dispatch(
                  updateAccountPreferences({
                    userId: user.id,
                    preferences: { securityAlerts: event.target.checked },
                  }),
                )
              }
            />
            {t('security.alerts.checkbox')}
          </label>
          {!emailConfirmed ? (
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              {t('security.alerts.emailHint')}
            </p>
          ) : null}
        </Card>
        <Card>
          <FiMonitor className="text-2xl text-brand-600" />
          <h2 className="mt-4 font-black">{t('security.sessions.title')}</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {t('security.sessions.description')}
          </p>
          <Button className="mt-5" variant="secondary" onClick={signOutOthers}>
            {t('security.sessions.signOutOthers')}
          </Button>
        </Card>
      </div>

      <Modal
        open={passwordOpen}
        onClose={() => {
          setPasswordOpen(false)
          resetPasswordModal()
        }}
        title={t('security.passwordModalTitle')}
      >
        <form className="grid gap-4" onSubmit={handlePasswordChange}>
          <p className="text-sm text-[var(--app-text-muted)]">
            {t('security.passwordModalIntro', { email: user.email })}
          </p>
          {!passwordOtpSent ? (
            <Button type="button" loading={passwordLoading} onClick={sendPasswordOtp}>
              {t('security.sendOtpEmail')}
            </Button>
          ) : (
            <>
              <Input
                label={t('security.otpCodeLabel')}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={passwordOtp}
                onChange={(event) => setPasswordOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <Input
                label={t('security.newPassword')}
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
              />
              <Input
                label={t('security.confirmPassword')}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={passwordResendCooldown > 0 || passwordLoading}
                  onClick={sendPasswordOtp}
                >
                  {passwordResendCooldown > 0
                    ? t('security.email.resendCooldown', { seconds: passwordResendCooldown })
                    : t('security.email.resend')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPasswordOpen(false)
                    resetPasswordModal()
                  }}
                >
                  {t('security.email.cancel')}
                </Button>
                <Button type="submit" disabled={passwordLoading || passwordOtp.length !== 6}>
                  {t('common.save')}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      <Modal open={mfaOpen} onClose={() => setMfaOpen(false)} title={t('security.mfa.modalTitle')}>
        <p className="text-sm text-[var(--app-text-muted)]">
          {t('security.mfa.modalIntro')}
        </p>
        {mfaQrCode ? (
          <img src={mfaQrCode} alt={t('security.mfa.qrAlt')} className="mx-auto mt-4 max-w-48 rounded-xl border" />
        ) : null}
        <form className="mt-4 grid gap-4" onSubmit={verifyMfa}>
          <Input
            label={t('security.mfa.verifyCodeLabel')}
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            placeholder="000000"
            required
            minLength={6}
            maxLength={6}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setMfaOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mfaLoading}>
              {t('security.mfa.validate')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
