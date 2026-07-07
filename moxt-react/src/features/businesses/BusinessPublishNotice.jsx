import { Alert } from '../../components/ui/Alert'
import { businessPublishBlockedMessage } from './businessPublishUtils'

export function BusinessPublishNotice({ business, className = '' }) {
  const message = businessPublishBlockedMessage(business)
  if (!business || !message) return null
  return (
    <Alert variant="warning" className={className} title="Entreprise non vérifiée">
      {message} Vous pouvez continuer en tant que particulier.
    </Alert>
  )
}
