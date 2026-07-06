import { FiArrowLeft, FiKey, FiLock, FiMonitor, FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import {
  selectAccountPreferences,
  updateAccountPreferences,
} from '../features/account/accountSlice'
import { addToast } from '../features/ui/uiSlice'

export function SecurityPage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const preferences = useSelector((state) => selectAccountPreferences(state, user.id))

  function simulate(action) {
    dispatch(
      addToast({
        title: 'Simulation locale',
        message: `${action} sera connecté au service d’authentification du backend.`,
        tone: 'info',
      }),
    )
  }

  function toggleTwoFactor() {
    dispatch(
      updateAccountPreferences({
        userId: user.id,
        preferences: { twoFactorEnabled: !preferences.twoFactorEnabled },
      }),
    )
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Sécurité"
        description="Préférences locales en attente du service d’authentification."
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
            Le mot de passe n’est jamais conservé dans Redux ou localStorage.
          </p>
          <Button className="mt-5" variant="secondary" onClick={() => simulate('Le changement')}>
            Modifier le mot de passe
          </Button>
        </Card>
        <Card>
          <FiKey className="text-2xl text-brand-600" />
          <h2 className="mt-4 font-black">Double authentification</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            État simulé: {preferences.twoFactorEnabled ? 'activée' : 'désactivée'}.
          </p>
          <Button className="mt-5" variant="secondary" onClick={toggleTwoFactor}>
            {preferences.twoFactorEnabled ? 'Désactiver la simulation' : 'Activer la simulation'}
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
          <h2 className="mt-4 font-black">Session actuelle</h2>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Navigateur actuel · activité aujourd’hui · session locale protégée.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => simulate('La déconnexion globale')}
          >
            Déconnecter les autres appareils
          </Button>
        </Card>
      </div>
    </div>
  )
}
