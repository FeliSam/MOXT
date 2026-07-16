import { Link } from 'react-router-dom'
import {
  isEmailVerified,
  isPhoneVerified,
  isValidRussianPhone,
} from '@moxt/shared/auth/userSecurity.js'

const EMAIL_VERIFY_PATH = '/security?verify=email'

export function SecurityGateLinks({ kind = 'publish', user = null }) {
  const needsPhoneFirst = kind === 'publish' || kind === 'p2p'
  const phoneOk = isPhoneVerified(user) && isValidRussianPhone(user?.phone)
  const emailOk = isEmailVerified(user)

  if (needsPhoneFirst && !phoneOk) {
    return (
      <span className="text-sm">
        <Link className="font-bold text-brand-700 hover:underline" to="/profile">
          Vérifier mon numéro
        </Link>
        {' · '}
        <Link className="font-bold text-brand-700 hover:underline" to="/verification">
          Centre de vérification
        </Link>
      </span>
    )
  }

  if ((needsPhoneFirst || kind === 'business') && !emailOk) {
    return (
      <span className="text-sm">
        <Link className="font-bold text-brand-700 hover:underline" to={EMAIL_VERIFY_PATH}>
          Confirmer mon e-mail
        </Link>
        {' · '}
        <Link className="font-bold text-brand-700 hover:underline" to="/security">
          Sécurité
        </Link>
      </span>
    )
  }

  return (
    <span className="text-sm">
      <Link
        className="font-bold text-brand-700 hover:underline"
        to={needsPhoneFirst ? '/profile' : '/verification'}
      >
        {needsPhoneFirst ? 'Vérifier mon numéro' : 'Vérification MOXT'}
      </Link>
      {' · '}
      <Link className="font-bold text-brand-700 hover:underline" to="/verification">
        Centre de vérification
      </Link>
    </span>
  )
}
