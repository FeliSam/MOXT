import { useEffect, useState } from 'react'
import { FiKey, FiLock, FiMonitor, FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { isEmailVerified } from '@moxt/shared/auth/userSecurity.js'
import { BackButton } from '../components/ui/BackButton'
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

const MFA_AVAILABLE = false
const RESEND_COOLDOWN_SECONDS = 60

export function SecurityPage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const preferences = useSelector((state) => selectAccountPreferences(state, user.id))
  const emailConfirmed = isEmailVerified(user)

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
          title: 'E-mail requis',
          message: 'Confirmez votre adresse e-mail ci-dessus avant de modifier le mot de passe.',
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
      setPasswordResendCooldown(RESEND_COOLDOWN_SECONDS)
      dispatch(
        addToast({
          title: 'Code envoyé',
          message: `Un code a été envoyé à ${result.email}. Vérifiez vos spams.`,
          tone: 'success',
        }),
      )
    } catch (error) {
      dispatch(addToast({ title: 'Échec', message: error.message, tone: 'error' }))
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault()
    if (!/^\d{6}$/.test(passwordOtp)) {
      dispatch(addToast({ title: 'Code invalide', message: 'Saisissez le code à 6 chiffres.', tone: 'error' }))
      return
    }
    if (newPassword !== confirmPassword) {
      dispatch(addToast({ title: 'Erreur', message: 'Les mots de passe ne correspondent pas.', tone: 'error' }))
      return
    }
    setPasswordLoading(true)
    try {
      await authService.updatePassword(newPassword, { nonce: passwordOtp })
      dispatch(addToast({ title: 'Mot de passe mis à jour', message: 'Votre mot de passe a été modifié.', tone: 'success' }))
      setPasswordOpen(false)
      resetPasswordModal()
    } catch (error) {
      dispatch(addToast({ title: 'Échec', message: error.message, tone: 'error' }))
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
      dispatch(addToast({ title: '2FA indisponible', message: error.message, tone: 'error' }))
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
      dispatch(addToast({ title: '2FA activée', message: 'La double authentification est active.', tone: 'success' }))
      setMfaOpen(false)
      setMfaCode('')
    } catch (error) {
      dispatch(addToast({ title: 'Code invalide', message: error.message, tone: 'error' }))
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
      dispatch(addToast({ title: '2FA désactivée', message: 'La double authentification a été retirée.', tone: 'success' }))
    } catch (error) {
      dispatch(addToast({ title: 'Échec', message: error.message, tone: 'error' }))
    } finally {
      setMfaLoading(false)
    }
  }

  async function signOutOthers() {
    try {
      await authService.signOutOtherSessions()
      dispatch(addToast({ title: 'Sessions fermées', message: 'Les autres appareils ont été déconnectés.', tone: 'success' }))
    } catch (error) {
      dispatch(addToast({ title: 'Échec', message: error.message, tone: 'error' }))
    }
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Sécurité"
        description="Mot de passe, double authentification et sessions actives."
        actions={<BackButton appearance="link" />}
      />
      <EmailVerificationCard />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <FiLock className="text-2xl text-brand-600" />
          <h2 className="mt-4 font-black">Mot de passe</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {emailConfirmed
              ? 'Modification protégée par un code OTP envoyé à votre e-mail confirmé.'
              : 'Confirmez d’abord votre e-mail pour pouvoir modifier le mot de passe.'}
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            disabled={!emailConfirmed}
            onClick={openPasswordModal}
          >
            Modifier le mot de passe
          </Button>
        </Card>
        <Card
          className={!MFA_AVAILABLE ? 'opacity-55' : undefined}
          aria-disabled={!MFA_AVAILABLE || undefined}
        >
          <FiKey className={`text-2xl ${MFA_AVAILABLE ? 'text-brand-600' : 'text-[var(--app-text-muted)]'}`} />
          <h2 className="mt-4 font-black">Double authentification</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            {MFA_AVAILABLE
              ? `État : ${mfaEnabled ? 'activée (TOTP)' : 'désactivée'}.`
              : 'Cette fonctionnalité n’est pas encore disponible. Elle sera proposée prochainement.'}
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            disabled={!MFA_AVAILABLE || mfaLoading}
            title={!MFA_AVAILABLE ? 'Bientôt disponible' : undefined}
            onClick={mfaEnabled ? disableMfa : startMfaEnrollment}
          >
            {MFA_AVAILABLE
              ? mfaEnabled
                ? 'Désactiver la 2FA'
                : 'Activer la 2FA'
              : 'Bientôt disponible'}
          </Button>
        </Card>
        <Card>
          <FiShield className="text-2xl text-brand-600" />
          <h2 className="mt-4 font-black">Alertes de sécurité</h2>
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
            Recevoir les alertes importantes
          </label>
          {!emailConfirmed ? (
            <p className="mt-2 text-xs text-[var(--app-text-muted)]">
              Les alertes e-mail nécessitent une adresse confirmée.
            </p>
          ) : null}
        </Card>
        <Card>
          <FiMonitor className="text-2xl text-brand-600" />
          <h2 className="mt-4 font-black">Sessions</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Déconnectez les autres appareils connectés à votre compte MOXT.
          </p>
          <Button className="mt-5" variant="secondary" onClick={signOutOthers}>
            Déconnecter les autres appareils
          </Button>
        </Card>
      </div>

      <Modal
        open={passwordOpen}
        onClose={() => {
          setPasswordOpen(false)
          resetPasswordModal()
        }}
        title="Modifier le mot de passe"
      >
        <form className="grid gap-4" onSubmit={handlePasswordChange}>
          <p className="text-sm text-[var(--app-text-muted)]">
            Un code OTP sera envoyé à <strong>{user.email}</strong>. Saisissez-le avec votre nouveau mot de passe.
          </p>
          {!passwordOtpSent ? (
            <Button type="button" loading={passwordLoading} onClick={sendPasswordOtp}>
              Envoyer le code par e-mail
            </Button>
          ) : (
            <>
              <Input
                label="Code reçu par e-mail"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={passwordOtp}
                onChange={(event) => setPasswordOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
              />
              <Input
                label="Confirmer le mot de passe"
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
                  {passwordResendCooldown > 0 ? `Renvoyer (${passwordResendCooldown}s)` : 'Renvoyer le code'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPasswordOpen(false)
                    resetPasswordModal()
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={passwordLoading || passwordOtp.length !== 6}>
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      <Modal open={mfaOpen} onClose={() => setMfaOpen(false)} title="Activer la double authentification">
        <p className="text-sm text-[var(--app-text-muted)]">
          Scannez le QR code avec votre application d’authentification, puis saisissez le code à 6 chiffres.
        </p>
        {mfaQrCode ? (
          <img src={mfaQrCode} alt="QR code 2FA" className="mx-auto mt-4 max-w-48 rounded-xl border" />
        ) : null}
        <form className="mt-4 grid gap-4" onSubmit={verifyMfa}>
          <Input
            label="Code de vérification"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            placeholder="000000"
            required
            minLength={6}
            maxLength={6}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setMfaOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={mfaLoading}>
              Valider
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
