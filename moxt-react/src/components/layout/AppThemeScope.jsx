import { useAppThemeScope } from '../../hooks/useAppThemeScope'

export function AppThemeScope({ children, className = '' }) {
  const scope = useAppThemeScope()
  const scopeClass = scope === 'base' ? '' : `theme-${scope}`

  return (
    <div className={`${scopeClass} min-w-0 max-w-full overflow-x-clip ${className}`.trim()}>
      {children}
    </div>
  )
}
