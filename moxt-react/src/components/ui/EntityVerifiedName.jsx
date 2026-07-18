import { VerifiedDisplayName } from './Badge'
import { useEntityVerified } from '../../features/profile/resolveEntityVerified'

/**
 * Display a user or business name with the verification icon when applicable.
 * Pass businessId for businesses, userId for people (or both: business wins).
 */
export function EntityVerifiedName({
  name,
  userId,
  businessId,
  verified,
  className = '',
  iconSize = 'sm',
  iconClassName = '',
  nameClassName = '',
  as = 'span',
}) {
  const resolvedVerified = useEntityVerified({ userId, businessId, verified })

  return (
    <VerifiedDisplayName
      as={as}
      name={name}
      verified={resolvedVerified}
      className={className}
      iconSize={iconSize}
      iconClassName={iconClassName}
      nameClassName={nameClassName}
    />
  )
}
