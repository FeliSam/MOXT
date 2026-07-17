import { useDispatch } from 'react-redux'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { ActivityVisibilitySelect } from '../account/ActivityVisibilitySelect'
import { businessesText } from './businessesI18n'
import { updateBusinessActivityVisibility } from './businessSlice'

export function BusinessActivityVisibilitySection({ business, className = '' }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)

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
      <h2 className="font-black">{bt('businesses.visibility.title')}</h2>
      <p className="mt-2 text-sm text-[var(--app-text-muted)]">
        {bt('businesses.visibility.description')}
      </p>
      <div className="mt-5">
        <ActivityVisibilitySelect
          id={`business-visibility-${business.id}`}
          value={business.activityVisibility || 'public'}
          onChange={handleChange}
          hint={bt('businesses.visibility.hint')}
        />
      </div>
    </Card>
  )
}
