import { Card } from '../../../components/ui/Card'
import { CARD } from '../adminConfig'

/** Ligne « réglage global » de l’admin : icône, libellé, aide et interrupteur (Fil, Avatar…). */
export function AdminToggleRow({ icon: Icon, label, hint, enabled, onToggle, disabled = false }) {
  return (
    <Card className={`${CARD} flex items-start gap-4 p-4`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text)]">
        <Icon className="text-lg" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black">{label}</p>
        <p className="mt-0.5 text-sm text-[var(--app-text-muted)]">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onToggle}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          enabled ? 'bg-brand-600' : 'bg-[var(--app-border)]'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span
          className={`absolute top-1 size-6 rounded-full bg-white shadow transition ${
            enabled ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </Card>
  )
}
