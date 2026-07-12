import { buildReferralCode } from '@moxt/shared/referral/buildReferralCode.js'
import { buildAbsoluteUrl } from '../../utils/siteUrl'

export { buildReferralCode }

export function buildReferralLink(user) {
  return buildAbsoluteUrl(`/invite/${buildReferralCode(user)}`)
}
