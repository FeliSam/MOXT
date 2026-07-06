/* ─── Card variants ──────────────────────────────────────────────────────── */

/*
  variant="default"      → carte standard (identique à l'ancienne Card)
  variant="interactive"  → cliquable, hover lift + shadow verte
  variant="compact"      → padding réduit, radius plus petit
  variant="featured"     → gradient subtil en fond, pour hero / KPI
  variant="verified"     → bordure gauche verte, signal de confiance
  variant="flat"         → sans bordure ni ombre, fond muted
  variant="finance"      → carte KPI / montants (couche fintech 20 %)
*/

const variants = {
  default:
    'rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6',

  interactive:
    'rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6 cursor-pointer transition-all duration-[var(--transition-base)] hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)] active:translate-y-0 active:shadow-[var(--shadow-card)] dark:hover:border-brand-800',

  compact:
    'rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--shadow-card)]',

  featured:
    'rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-brand-50/60 before:to-[var(--app-cobalt-soft)]/20 before:pointer-events-none dark:before:from-brand-900/20 dark:before:to-[var(--app-cobalt-soft)]/10',

  verified:
    'rounded-[var(--radius-card-lg)] border border-[var(--app-border)] border-l-[3px] border-l-brand-600 bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6 dark:border-l-brand-400',

  flat:
    'rounded-[var(--radius-card)] bg-[var(--app-surface-muted)] p-4',

  finance:
    'rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-finance)] sm:p-6 tabular-nums',
}

export function Card({ children, className = '', variant = 'default', as: Tag = 'section', ...props }) {
  return (
    <Tag className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </Tag>
  )
}
