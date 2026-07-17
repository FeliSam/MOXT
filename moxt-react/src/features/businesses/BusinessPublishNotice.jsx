import { Alert } from '../../components/ui/Alert'
import { useLanguage } from '../../contexts/useLanguage'
import { publishText } from '../publications/publishI18n'
import { businessPublishBlockedMessageKey } from './businessPublishUtils'

export function BusinessPublishNotice({ business, className = '' }) {
  const { t } = useLanguage()
  const messageKey = businessPublishBlockedMessageKey(business)
  if (!business || !messageKey) return null
  return (
    <Alert
      variant="warning"
      className={className}
      title={publishText(t, 'publish.common.business.unverifiedTitle')}
    >
      {publishText(t, messageKey)}{' '}
      {publishText(t, 'publish.common.business.continueAsIndividual')}
    </Alert>
  )
}
