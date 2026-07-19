import { Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import {
  canCreateBusiness,
  canPublishContent,
  canPublishP2POffer,
  canPublishVoyage,
  canUseTransferAccount,
  isEmailVerified,
  isPhoneVerified,
  isValidRussianPhone,
  securityGateMessage,
} from '@moxt/shared/auth/userSecurity.js'
import { useSelector } from 'react-redux'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { sharedText } from '../../i18n/sharedI18n'
import { EmailVerificationCard } from './EmailVerificationCard'
import { PhoneVerificationCard } from './PhoneVerificationCard'
import { SecurityGateLinks } from './SecurityGateLinks'

const GATE_COPY_KEYS = {
  publish: {
    titlePhone: 'shared.securityGate.publish.titlePhone',
    titleEmail: 'shared.securityGate.publish.titleEmail',
    title: 'shared.securityGate.publish.title',
    backLabel: 'common.back',
  },
  voyage: {
    titlePhone: 'shared.securityGate.voyage.titlePhone',
    titleEmail: 'shared.securityGate.voyage.titleEmail',
    title: 'shared.securityGate.voyage.title',
    backLabel: 'shared.securityGate.voyage.back',
  },
  p2p: {
    titlePhone: 'shared.securityGate.p2p.titlePhone',
    titleEmail: 'shared.securityGate.p2p.titleEmail',
    title: 'shared.securityGate.p2p.title',
    backLabel: 'shared.securityGate.p2p.back',
  },
  business: {
    title: 'shared.securityGate.business.title',
    backLabel: 'shared.securityGate.business.back',
  },
  transfer: {
    title: 'shared.securityGate.transfer.title',
    backLabel: 'shared.securityGate.transfer.back',
  },
}

function canAccess(kind, user) {
  if (kind === 'publish') return canPublishContent(user)
  if (kind === 'voyage') return canPublishVoyage(user)
  if (kind === 'p2p') return canPublishP2POffer(user)
  if (kind === 'business') return canCreateBusiness(user)
  if (kind === 'transfer') return canUseTransferAccount(user)
  return true
}

function gateText(t, key) {
  if (key === 'common.back') return t('common.back')
  return sharedText(t, key)
}

function publishGateTitle(kind, user, keys, t) {
  if (kind !== 'publish' && kind !== 'p2p' && kind !== 'voyage') return gateText(t, keys.title)
  const phoneOk = isPhoneVerified(user) && isValidRussianPhone(user?.phone)
  if (!phoneOk && keys.titlePhone) return gateText(t, keys.titlePhone)
  if (!isEmailVerified(user) && keys.titleEmail) return gateText(t, keys.titleEmail)
  return gateText(t, keys.title)
}

export function SecurityGatePanel({
  kind = 'publish',
  backTo = '/dashboard',
  children,
}) {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const keys = GATE_COPY_KEYS[kind] || GATE_COPY_KEYS.publish
  const phoneOk = isPhoneVerified(user) && isValidRussianPhone(user?.phone)
  const emailOk = isEmailVerified(user)
  const showPhoneCard = (kind === 'publish' || kind === 'p2p' || kind === 'voyage') && !phoneOk
  const showEmailCard =
    !emailOk &&
    ((kind === 'publish' || kind === 'p2p' || kind === 'voyage') ? phoneOk : kind === 'business')

  if (canAccess(kind, user)) return children

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div className="flex items-center gap-3">
        <Link to={backTo}>
          <Button variant="secondary" icon={FiArrowLeft}>
            {gateText(t, keys.backLabel)}
          </Button>
        </Link>
        <h1 className="text-xl font-black">{publishGateTitle(kind, user, keys, t)}</h1>
      </div>

      <Alert variant="warning" title={sharedText(t, 'shared.securityGate.alertTitle')}>
        {securityGateMessage(kind, user)}
        <div className="mt-3">
          <SecurityGateLinks kind={kind} user={user} />
        </div>
      </Alert>

      {showPhoneCard ? <PhoneVerificationCard /> : null}
      {showEmailCard ? <EmailVerificationCard /> : null}
      {kind === 'voyage' || kind === 'p2p' || kind === 'business' || kind === 'transfer' ? (
        <Alert variant="info" title={sharedText(t, 'shared.securityGate.centerTitle')}>
          {sharedText(t, 'shared.securityGate.centerBody')}{' '}
          <Link className="font-bold text-brand-700 hover:underline" to="/verification">
            {sharedText(t, 'shared.securityGate.openVerification')}
          </Link>
        </Alert>
      ) : null}
    </div>
  )
}
