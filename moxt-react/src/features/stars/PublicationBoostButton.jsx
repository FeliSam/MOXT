import { FiTrendingUp } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { useStarsModuleEnabled } from './useStarsModuleEnabled'

export function PublicationBoostButton({ onBoost, disabled = false, activeBoost = null }) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const starsEnabled = useStarsModuleEnabled()

  if (!starsEnabled || !onBoost) return null

  if (activeBoost) {
    return (
      <Button variant="secondary" icon={FiTrendingUp} size="sm" disabled className="w-full">
        {p3('publications.cards.boostActive')}
      </Button>
    )
  }

  return (
    <Button
      variant="secondary"
      icon={FiTrendingUp}
      size="sm"
      className="w-full"
      disabled={disabled}
      onClick={onBoost}
    >
      {p3('publications.cards.boost')}
    </Button>
  )
}
