import { useDispatch } from 'react-redux'
import { Card } from '../../components/ui/Card'
import { ActivityVisibilitySelect } from '../account/ActivityVisibilitySelect'
import { updateBusinessActivityVisibility } from './businessSlice'

export function BusinessActivityVisibilitySection({ business, className = '' }) {
  const dispatch = useDispatch()

  if (!business?.id) return null

  function handleChange(event) {
    dispatch(
      updateBusinessActivityVisibility({
        businessId: business.id,
        ownerId: business.ownerId,
        activityVisibility: event.target.value,
      }),
    )
  }

  return (
    <Card className={className}>
      <h2 className="font-black">Visibilité des publications</h2>
      <p className="mt-2 text-sm text-[var(--app-text-muted)]">
        Contrôle qui peut consulter la fiche publique et les publications de votre entreprise.
        Enregistré sur MOXT et synchronisé entre vos appareils.
      </p>
      <div className="mt-5">
        <ActivityVisibilitySelect
          id={`business-visibility-${business.id}`}
          value={business.activityVisibility || 'public'}
          onChange={handleChange}
          hint="Les visiteurs non autorisés verront un message d’accès restreint."
        />
      </div>
    </Card>
  )
}
