import { RevealOnScroll } from './RevealOnScroll'

export function RevealListItem({ children, className = '', index = 0 }) {
  return (
    <RevealOnScroll className={className} delay={Math.min(index * 45, 260)}>
      {children}
    </RevealOnScroll>
  )
}
