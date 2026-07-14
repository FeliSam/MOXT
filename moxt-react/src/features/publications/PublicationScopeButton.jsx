import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function PublicationScopeButton({ business, scope, onScopeChange, isOwner = true }) {
  if (!business) return null

  if (!isOwner) {
    return (
      <Link to={`/businesses/${business.id}/publications/listings`}>
        <Button icon={HiOutlineBuildingOffice2} variant="secondary">
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
          <Button icon={HiOutlineBuildingOffice2}>Fiche entreprise</Button>
        </Link>
      </>
    )
  }

  return (
    <Button icon={HiOutlineBuildingOffice2} variant="secondary" onClick={() => onScopeChange('business')}>
      Entreprise
    </Button>
  )
}
