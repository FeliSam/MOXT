import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { useLanguage } from '../../contexts/useLanguage'
import { publishText } from '../publications/publishI18n'
import {
  businessPublishBlockedMessageKey,
  businessServicePublishBlockedMessageKey,
} from './businessPublishUtils'

export function BusinessPublishNotice({ business, contentType, className = '' }) {
  const { t } = useLanguage()
  if (!business) return null

  const statusKey = businessPublishBlockedMessageKey(business)
  if (statusKey) {
    return (
      <Alert
        variant="warning"
        className={className}
        title={publishText(t, 'publish.common.business.unverifiedTitle')}
      >
        {publishText(t, statusKey)}{' '}
        {publishText(t, 'publish.common.business.continueAsIndividual')}
      </Alert>
    )
  }

  const serviceKey = businessServicePublishBlockedMessageKey(business, contentType)
  if (!serviceKey) return null

  return (
    <Alert
      variant="info"
      className={className}
      title={publishText(t, 'publish.common.business.serviceNotDeclaredTitle')}
    >
      <p>{publishText(t, serviceKey)}</p>
      <p className="mt-1">
        {publishText(t, 'publish.common.business.continueAsIndividual')}{' '}
        <Link
          to="/businesses/setup"
          className="font-semibold text-[var(--app-accent)] underline-offset-2 hover:underline"
        >
          {publishText(t, 'publish.common.business.editServices')}
        </Link>
      </p>
    </Alert>
  )
}
