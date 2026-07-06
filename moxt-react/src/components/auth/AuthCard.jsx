import { Card } from '../ui/Card'

export function AuthCard({ children, compact = false, corner, description, eyebrow = 'MOXT', title }) {
  return (
    <Card variant="featured" className={compact ? 'p-4 sm:p-6' : 'p-6 sm:p-8'}>
      <div className="relative flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
          <span className="ds-dot-pulse size-1.5 rounded-full bg-brand-600 dark:bg-brand-300" />
          {eyebrow}
        </p>
        {corner ? <div className="shrink-0">{corner}</div> : null}
      </div>
      <h1
        className={`font-display relative font-extrabold tracking-tight text-[var(--app-text)] ${
          compact ? 'mt-2 text-xl sm:text-2xl' : 'mt-3 text-2xl sm:text-3xl'
        }`}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={`relative text-[var(--app-text-muted)] ${
            compact ? 'mt-1.5 text-xs leading-5' : 'mt-2 text-sm leading-6'
          }`}
        >
          {description}
        </p>
      ) : null}
      <div className="relative">{children}</div>
    </Card>
  )
}
