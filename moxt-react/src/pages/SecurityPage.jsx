import { useEffect, useState } from 'react'
import { FiArrowLeft, FiKey, FiLock, FiMonitor, FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import {
  selectAccountPreferences,
  updateAccountPreferences,
} from '../features/account/accountSlice'
import { authService } from '../features/auth/authService'
import { addToast } from '../features/ui/uiSlice'

const MFA_AVAILABLE = false

export function SecurityPage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const preferences = useSelector((state) => selectAccountPreferences(state, user.id))

  const [passwordOpen, setPasswordOpen] = useState(false)
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

  async function handlePasswordChange(event) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      dispatch(addToast({ title: 'Erreur', message: 'Les mots de passe ne correspondent pas.', tone: 'error' }))
      return
    }
    setPasswordLoading(true)
    try {
      await authService.updatePassword(newPassword)
      dispatch(addToast({ title: 'Mot de passe mis à jour', message: 'Votre mot de passe a été modifié.', tone: 'success' }))
      setPasswordOpen(false)
      setNewPassword('')
      setConfirmPassword('')
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
        actions={
          <Link
            to="/profile"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm hover:bg-[var(--app-surface-muted)]"
          >
            <FiArrowLeft /> Retour
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <FiLock className="text-2xl text-brand-600" />
          <h2 className="mt-4 font-black">Mot de passe</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Modifiez votre mot de passe en toute sécurité. Il n’est jamais stocké sur cet appareil.
          </p>
          <Button className="mt-5" variant="secondary" onClick={() => setPasswordOpen(true)}>
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

      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Modifier le mot de passe">
        <form className="grid gap-4" onSubmit={handlePasswordChange}>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPasswordOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={passwordLoading}>
              Enregistrer
            </Button>
          </div>
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
