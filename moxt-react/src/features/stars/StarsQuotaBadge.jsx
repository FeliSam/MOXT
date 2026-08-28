export function StarsQuotaBadge({ used, quota, label, enforced }) {
  if (!enforced || quota == null) return null
  const remaining = Math.max(0, Number(quota) - Number(used || 0))
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--app-accent-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--app-accent)]">
      {label ? `${label} · ` : ''}
      {remaining}/{quota} ★
    </span>
  )
}
