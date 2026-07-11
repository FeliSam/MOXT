import { FiBriefcase } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function PublicationScopeButton({ business, scope, onScopeChange, isOwner = true }) {
  if (!business) return null

  if (!isOwner) {
    return (
      <Link to={`/businesses/${business.id}/publications/listings`}>
        <Button icon={FiBriefcase} variant="secondary">
          Entreprise
        </Button>
      </Link>
    )
  }

  if (scope === 'business') {
    return (
      <>
        <Button variant="secondary" onClick={() => onScopeChange('personal')}>
          Profil personnel
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
