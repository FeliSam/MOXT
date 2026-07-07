import { FiBriefcase } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function PublicationScopeButton({ business, scope, onScopeChange }) {
  if (!business) return null

  if (scope === 'business') {
    return (
      <>
        <Button variant="secondary" onClick={() => onScopeChange('all')}>
          Toutes les publications
        </Button>
        <Link to={`/businesses/${business.id}`}>
          <Button icon={FiBriefcase}>Fiche entreprise</Button>
        </Link>
      </>
    )
  }

  return (
    <Button icon={FiBriefcase} variant="secondary" onClick={() => onScopeChange('business')}>
      Entreprise
    </Button>
  )
}
