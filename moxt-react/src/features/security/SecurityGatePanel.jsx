import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import {
  canCreateBusiness,
  canPublishContent,
  canPublishP2POffer,
  canUseTransferAccount,
  isEmailVerified,
  isPhoneVerified,
  isValidRussianPhone,
  securityGateMessage,
} from '@moxt/shared/auth/userSecurity.js'
import { useSelector } from 'react-redux'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { EmailVerificationCard } from './EmailVerificationCard'
import { PhoneVerificationCard } from './PhoneVerificationCard'
import { SecurityGateLinks } from './SecurityGateLinks'

const gateCopy = {
  publish: {
    titlePhone: 'Numéro russe requis pour publier',
    titleEmail: 'E-mail confirmé requis pour publier',
    title: 'Vérification requise pour publier',
    backLabel: 'Retour',
  },
  p2p: {
    titlePhone: 'Numéro russe requis pour le P2P',
    titleEmail: 'E-mail confirmé requis pour le P2P',
    title: 'Identité vérifiée requise pour le P2P',
    backLabel: 'Retour au P2P',
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
  if (kind === 'p2p') return canPublishP2POffer(user)
  if (kind === 'business') return canCreateBusiness(user)
  if (kind === 'transfer') return canUseTransferAccount(user)
  return true
}

function publishGateTitle(kind, user, copy) {
  if (kind !== 'publish' && kind !== 'p2p') return copy.title
  const phoneOk = isPhoneVerified(user) && isValidRussianPhone(user?.phone)
  if (!phoneOk && copy.titlePhone) return copy.titlePhone
  if (!isEmailVerified(user) && copy.titleEmail) return copy.titleEmail
  return copy.title
}

export function SecurityGatePanel({
  kind = 'publish',
  backTo = '/dashboard',
  children,
}) {
  const user = useSelector((state) => state.auth.user)
  const copy = gateCopy[kind] || gateCopy.publish
  const phoneOk = isPhoneVerified(user) && isValidRussianPhone(user?.phone)
  const emailOk = isEmailVerified(user)
  const showPhoneCard = (kind === 'publish' || kind === 'p2p') && !phoneOk
  const showEmailCard =
    !emailOk &&
    ((kind === 'publish' || kind === 'p2p') ? phoneOk : kind === 'business')

  if (canAccess(kind, user)) return children

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div className="flex items-center gap-3">
        <Link to={backTo}>
          <Button variant="secondary" icon={FiArrowLeft}>
            {copy.backLabel}
          </Button>
        </Link>
        <h1 className="text-xl font-black">{publishGateTitle(kind, user, copy)}</h1>
      </div>

      <Alert variant="warning" title="Vérification requise">
        {securityGateMessage(kind, user)}
        <div className="mt-3">
          <SecurityGateLinks kind={kind} user={user} />
        </div>
      </Alert>

      {showPhoneCard ? <PhoneVerificationCard /> : null}
      {showEmailCard ? <EmailVerificationCard /> : null}
      {kind === 'p2p' || kind === 'business' || kind === 'transfer' ? (
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
