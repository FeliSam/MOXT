import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'

export function PublicationScopeButton({
  business,
  scope,
  onScopeChange,
  isOwner = true,
  className = '',
}) {
  const { t } = useLanguage()

  if (!business) return null

  if (!isOwner) {
    return (
      <Link to={`/businesses/${business.id}`} className={`min-w-0 ${className}`.trim()}>
        <Button icon={HiOutlineBuildingOffice2} variant="secondary" className="w-full min-w-0 max-w-full whitespace-normal">
          {t('publications.scope.business')}
        </Button>
      </Link>
    )
  }

  if (scope === 'business') {
    return (
      <>
        <Button
          variant="secondary"
          className="w-full min-w-0 max-w-full whitespace-normal"
          onClick={() => onScopeChange('personal')}
        >
          {t('publications.scope.personalProfile')}
        </Button>
        <Link to={`/businesses/${business.id}`} className="min-w-0">
          <Button icon={HiOutlineBuildingOffice2} className="w-full min-w-0 max-w-full whitespace-normal">
            {t('publications.scope.businessProfile')}
          </Button>
        </Link>
      </>
    )
  }

  return (
    <Button
      icon={HiOutlineBuildingOffice2}
      variant="secondary"
      className={`w-full min-w-0 max-w-full whitespace-normal ${className}`.trim()}
      onClick={() => onScopeChange('business')}
    >
      {t('publications.scope.business')}
    </Button>
  )
}
