import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import {
  canCreateBusiness,
  canPublishContent,
  canUseTransferAccount,
  securityGateMessage,
} from '@moxt/shared/auth/userSecurity.js'
import { useSelector } from 'react-redux'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { PhoneVerificationCard } from './PhoneVerificationCard'
import { SecurityGateLinks } from './SecurityGateLinks'

const gateCopy = {
  publish: {
    title: 'Numéro russe requis pour publier',
    backLabel: 'Retour',
  },
  business: {
    title: 'Identité vérifiée requise',
    backLabel: 'Retour aux entreprises',
  },
  transfer: {
    title: 'Compte vérifié requis',
    backLabel: 'Retour aux transferts',
  },
}

function canAccess(kind, user) {
  if (kind === 'publish') return canPublishContent(user)
  if (kind === 'business') return canCreateBusiness(user)
  if (kind === 'transfer') return canUseTransferAccount(user)
  return true
}

export function SecurityGatePanel({
  kind = 'publish',
  backTo = '/dashboard',
  children,
}) {
  const user = useSelector((state) => state.auth.user)
  const copy = gateCopy[kind] || gateCopy.publish

  if (canAccess(kind, user)) return children

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div className="flex items-center gap-3">
        <Link to={backTo}>
          <Button variant="secondary" icon={FiArrowLeft}>
            {copy.backLabel}
          </Button>
        </Link>
        <h1 className="text-xl font-black">{copy.title}</h1>
      </div>

      <Alert variant="warning" title="Vérification requise">
        {securityGateMessage(kind, user)}
        <div className="mt-3">
          <SecurityGateLinks kind={kind} />
        </div>
      </Alert>

      {kind === 'publish' ? <PhoneVerificationCard /> : null}
      {kind === 'business' || kind === 'transfer' ? (
        <Alert variant="info" title="Centre de vérification MOXT">
          Complétez vos informations personnelles puis soumettez votre dossier d’identité.{' '}
          <Link className="font-bold text-brand-700 hover:underline" to="/verification">
            Ouvrir la vérification
          </Link>
        </Alert>
      ) : null}
    </div>
  )
}
