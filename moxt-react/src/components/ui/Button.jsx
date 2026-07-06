/* ─── Spinner interne ────────────────────────────────────────────────────── */
function Spinner({ size }) {
  return (
    <span
      className="ds-spinner"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

/* ─── Variants ───────────────────────────────────────────────────────────── */
const variants = {
  primary:
    'bg-brand-700 text-white shadow-[0_4px_14px_rgba(8,112,95,0.25)] hover:bg-brand-800 hover:shadow-[0_6px_20px_rgba(8,112,95,0.30)] active:shadow-[0_2px_8px_rgba(8,112,95,0.20)] dark:bg-brand-400 dark:text-slate-950 dark:hover:bg-brand-300',
  secondary:
    'border border-[var(--app-border-md)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)] hover:border-[var(--app-border)] active:bg-[var(--app-surface-muted)]',
  ghost:
    'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] active:bg-[var(--app-border)]',
  danger:
    'bg-[var(--app-danger-soft)] text-[var(--app-danger)] hover:bg-red-100 active:bg-red-200 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950/70',
  teal:
    'bg-[var(--app-teal)] text-white shadow-[0_4px_14px_rgba(18,191,163,0.3)] hover:opacity-90 active:opacity-80 dark:bg-[var(--app-teal)] dark:text-slate-900',
}

/* ─── Tailles ────────────────────────────────────────────────────────────── */
const sizes = {
  xs: 'min-h-8  gap-1.5 rounded-[0.6rem] px-3   text-xs',
  sm: 'min-h-9  gap-1.5 rounded-[0.7rem] px-3.5 text-xs',
  md: 'min-h-11 gap-2   rounded-[0.75rem] px-5  text-sm',
  lg: 'min-h-13 gap-2.5 rounded-[0.875rem] px-7 text-base',
}

/* ─── Icon-only square ───────────────────────────────────────────────────── */
const iconSizes = {
  xs: 'size-8  rounded-[0.6rem]',
  sm: 'size-9  rounded-[0.7rem]',
  md: 'size-11 rounded-[0.75rem]',
  lg: 'size-13 rounded-[0.875rem]',
}

/* ─── Composant ──────────────────────────────────────────────────────────── */
export function Button({
  children,
  className = '',
  icon: Icon,
  iconRight: IconRight,
  size = 'md',
  variant = 'primary',
  loading = false,
  iconOnly = false,
  type = 'button',
  ...props
}) {
  const isDisabled = loading || props.disabled

  const base =
    'inline-flex shrink-0 items-center justify-center font-semibold transition-all duration-[var(--transition-fast)] focus-visible:ring-2 focus-visible:ring-[var(--app-teal)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none select-none'

  const sizeClass = iconOnly ? iconSizes[size] ?? iconSizes.md : sizes[size] ?? sizes.md

  const iconClass = {
    xs: 'text-sm',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[size] ?? 'text-base'

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`${base} ${sizeClass} ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 18 : size === 'sm' || size === 'xs' ? 14 : 16} />
      ) : Icon ? (
        <Icon className={iconClass} aria-hidden="true" />
      ) : null}

      {!iconOnly && children ? (
        <span className={loading ? 'opacity-70' : ''}>{children}</span>
      ) : null}

      {!loading && IconRight ? (
        <IconRight className={`${iconClass} ml-auto`} aria-hidden="true" />
      ) : null}
    </button>
  )
}
