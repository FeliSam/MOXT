import { FiArrowLeft } from 'react-icons/fi'
import { Button } from './Button'
import { useLanguage } from '../../contexts/useLanguage'
import { useBackNavigation } from '../../hooks/useBackNavigation'

const linkClassName =
  'inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm hover:bg-[var(--app-surface-muted)]'

export function BackButton({
  fallback,
  label,
  appearance = 'button',
  variant = 'secondary',
  className,
  ...buttonProps
}) {
  const { t } = useLanguage()
  const { goBack } = useBackNavigation(fallback)
  const resolvedLabel = label ?? t('common.back')

  if (appearance === 'link') {
    return (
      <button type="button" onClick={goBack} className={className || linkClassName}>
        <FiArrowLeft /> {resolvedLabel}
      </button>
    )
  }

  return (
    <Button
      variant={variant}
      icon={FiArrowLeft}
      onClick={goBack}
      className={className}
      {...buttonProps}
    >
      {resolvedLabel}
    </Button>
  )
}
