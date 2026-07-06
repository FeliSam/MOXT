/**
 * Ancre de scroll pour les pages catalogue (évite les id dupliqués entre routes).
 * Utiliser avec useScrollToSecondSection().
 */
export function ScrollSectionAnchor({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag data-scroll-target="second-section" className={className} {...props}>
      {children}
    </Tag>
  )
}
