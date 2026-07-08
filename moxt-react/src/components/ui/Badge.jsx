import { FiCheck, FiCheckCircle, FiStar, FiZap } from 'react-icons/fi'

/* ─── Tones (fond coloré, conserve l'API existante) ─────────────────────── */
const tones = {
  brand:   'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger:  'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  violet:  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  rose:    'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  /* nouveaux tones */
  teal:    'bg-[var(--app-teal-soft)] text-[color:#0a6b5d] dark:bg-[var(--app-teal-soft)] dark:text-[var(--app-teal)]',
  slate:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

/* ─── Badge standard ─────────────────────────────────────────────────────── */
export function Badge({ children, className = '', tone = 'brand' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] ${tones[tone] ?? tones.brand} ${className}`}
    >
      {children}
    </span>
  )
}

/* ─── Icône vérifiée (rond vert + check) ─────────────────────────────────── */
export function VerifiedIcon({ size = 'md', className = '', title = 'Profil vérifié' }) {
  const box = {
    sm: 'size-5',
    md: 'size-6',
    lg: 'size-7',
  }
  const icon = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }
  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-grid shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_2px_rgba(16,185,129,0.18)] ${box[size] ?? box.md} ${className}`}
    >
      <FiCheck className={icon[size] ?? icon.md} strokeWidth={3} aria-hidden="true" />
    </span>
  )
}

/* ─── Badge Verifie ──────────────────────────────────────────────────────── */
/*
  Utilisation : <VerifiedBadge /> ou <VerifiedBadge label="Partenaire MOXT" />
  Taille : sm | md (defaut)
*/
export function VerifiedBadge({ label = 'Verifie MOXT', size = 'md', className = '' }) {
  const styles = {
    sm: 'gap-1 rounded-full border border-[rgba(8,112,95,0.2)] bg-[rgba(8,112,95,0.07)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.07em] text-brand-700 dark:text-brand-300',
    md: 'gap-1.5 rounded-full border border-[rgba(8,112,95,0.2)] bg-[rgba(8,112,95,0.07)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.07em] text-brand-700 dark:text-brand-300',
  }
  return (
    <span className={`inline-flex items-center ${styles[size] ?? styles.md} ${className}`}>
      <FiCheckCircle className={size === 'sm' ? 'text-[10px]' : 'text-xs'} aria-hidden="true" />
      {label}
    </span>
  )
}

/* ─── Badge Premium ──────────────────────────────────────────────────────── */
export function PremiumBadge({ label = 'Premium', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[rgba(184,134,11,0.25)] bg-[var(--app-gold-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.07em] text-[var(--app-gold)] dark:bg-[var(--app-gold-soft)] dark:text-[var(--app-gold)] ${className}`}
    >
      <FiStar className="text-[10px]" aria-hidden="true" />
      {label}
    </span>
  )
}

/* ─── Badge Statut avec point colore ─────────────────────────────────────── */
/*
  color : 'green' | 'amber' | 'red' | 'blue' | 'slate'
*/
const dotColors = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-400',
  red:   'bg-red-500',
  blue:  'bg-blue-500',
  slate: 'bg-slate-400',
}

export function StatusBadge({ label, color = 'slate', pulse = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--app-surface-muted)] px-2.5 py-1 text-[11px] font-bold text-[var(--app-text-muted)] ${className}`}
    >
      <span className="relative inline-flex">
        <span className={`size-1.5 rounded-full ${dotColors[color] ?? dotColors.slate}`} />
        {pulse && (
          <span
            className={`absolute inset-0 rounded-full ${dotColors[color] ?? dotColors.slate} animate-ping opacity-60`}
          />
        )}
      </span>
      {label}
    </span>
  )
}

/* ─── Badge Nouveau / Actif ──────────────────────────────────────────────── */
export function NewBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white dark:bg-brand-600 ${className}`}
    >
      <FiZap className="text-[9px]" aria-hidden="true" />
      Nouveau
    </span>
  )
}

/* ─── Badge Pill (categorie, tag) ────────────────────────────────────────── */
export function PillBadge({ children, active = false, onClick, className = '' }) {
  const base =
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-[var(--transition-fast)]'
  const stateClass = active
    ? 'bg-brand-700 text-white shadow-sm dark:bg-brand-600'
    : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-border)] hover:text-[var(--app-text)]'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${stateClass} cursor-pointer ${className}`}>
        {children}
      </button>
    )
  }
  return (
    <span className={`${base} ${stateClass} ${className}`}>{children}</span>
  )
}
