import { useAppThemeScope } from '../../hooks/useAppThemeScope'

export function AppThemeScope({ children, className = '' }) {
  const scope = useAppThemeScope()
  const scopeClass = scope === 'base' ? '' : `theme-${scope}`

  return (
    <div className={`${scopeClass} ${className}`.trim()}>
      {children}
    </div>
  )
}
