import { Children } from 'react'
import { LazyContent } from './LazyContent'

export function CatalogGrid({
  children,
  className = '',
  as: Component = 'section',
  lazy = true,
  columns = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  /** Avant : gap-3 sm:gap-4 (12px / 16px). −70 % → ~3.6px / 4.8px. */
  gap = 'gap-1 sm:gap-1.5',
}) {
  const items = lazy
    ? Children.map(children, (child, index) => (
        <LazyContent delay={(index % 4) * 45} minHeight="13rem">
          {child}
        </LazyContent>
      ))
    : children

  return (
    <Component className={`grid content-start ${gap} ${columns} ${className}`}>
      {items}
    </Component>
  )
}
