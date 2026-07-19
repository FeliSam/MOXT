import { Link } from 'react-router-dom'
import {
  isEmailVerified,
  isPhoneVerified,
  isValidRussianPhone,
} from '@moxt/shared/auth/userSecurity.js'
import { useLanguage } from '../../contexts/useLanguage'
import { sharedText } from '../../i18n/sharedI18n'

const EMAIL_VERIFY_PATH = '/security?verify=email'

export function SecurityGateLinks({ kind = 'publish', user = null }) {
  const { t } = useLanguage()
  const needsPhoneFirst = kind === 'publish' || kind === 'p2p' || kind === 'voyage'
  const phoneOk = isPhoneVerified(user) && isValidRussianPhone(user?.phone)
  const emailOk = isEmailVerified(user)

  if (needsPhoneFirst && !phoneOk) {
    return (
      <span className="text-sm">
        <Link className="font-bold text-brand-700 hover:underline" to="/profile">
          {sharedText(t, 'shared.securityGate.links.verifyPhone')}
        </Link>
        {' · '}
        <Link className="font-bold text-brand-700 hover:underline" to="/verification">
          {sharedText(t, 'shared.securityGate.links.center')}
        </Link>
      </span>
    )
  }

  if ((needsPhoneFirst || kind === 'business') && !emailOk) {
    return (
      <span className="text-sm">
        <Link className="font-bold text-brand-700 hover:underline" to={EMAIL_VERIFY_PATH}>
          {sharedText(t, 'shared.securityGate.links.confirmEmail')}
        </Link>
        {' · '}
        <Link className="font-bold text-brand-700 hover:underline" to="/security">
          {sharedText(t, 'shared.securityGate.links.security')}
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
        {sharedText(
          t,
          needsPhoneFirst
            ? 'shared.securityGate.links.verifyPhone'
            : 'shared.securityGate.links.verificationMoxt',
        )}
      </Link>
      {' · '}
      <Link className="font-bold text-brand-700 hover:underline" to="/verification">
        {sharedText(t, 'shared.securityGate.links.center')}
      </Link>
    </span>
  )
}
