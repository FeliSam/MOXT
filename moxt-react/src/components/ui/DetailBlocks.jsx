import { FiCheckCircle, FiClock, FiInfo, FiShield } from 'react-icons/fi'
import { Badge } from './Badge'
import { Card } from './Card'

export function DetailMetrics({ items }) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map(({ icon: Icon = FiInfo, label, tone = 'brand', value }) => (
        <Card key={label} className="p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)] sm:size-11">
              <Icon />
            </span>
            <div className="min-w-0">
              <strong className="block break-words text-sm tabular-nums sm:truncate sm:text-lg">
                {value}
              </strong>
              <span className="text-xs text-[var(--app-text-faint)]">{label}</span>
            </div>
          </div>
          {tone !== 'brand' ? <Badge tone={tone}>{label}</Badge> : null}
        </Card>
      ))}
    </section>
  )
}

export function DetailSection({ children, description, title }) {
  return (
    <Card>
      <div className="mb-5">
        <h2 className="font-display text-xl font-extrabold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </Card>
  )
}

export function DetailFacts({ items }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-[var(--radius-card)] bg-[var(--app-surface-muted)] p-4">
          <dt className="text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text-faint)]">
            {label}
          </dt>
          <dd className="mt-2 break-words font-bold tabular-nums">{value || 'Non renseigné'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function TrustPanel({ items, title = 'Confiance et sécurité' }) {
  return (
    <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f766e_0%,#0b8975_45%,#2563eb_100%)] text-white">
      <span className="grid size-12 place-items-center rounded-2xl bg-white/12">
        <FiShield className="text-2xl" />
      </span>
      <h2 className="font-display mt-4 text-xl font-extrabold">{title}</h2>
      <div className="mt-5 grid gap-2.5">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl bg-white/10 p-3 text-sm leading-5">
            <FiCheckCircle className="mt-0.5 shrink-0 text-white/85" />
            <span className="text-white/90">{item}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function DetailTimeline({ items }) {
  return (
    <div className="relative grid gap-5">
      {items.length > 1 ? (
        <div className="absolute left-5 top-3 bottom-3 w-px bg-[var(--app-border)]" aria-hidden />
      ) : null}
      {items.map(({ date, label }, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={`${label}-${date}-${index}`} className="relative flex gap-3.5">
            <span
              className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full ${
                isLast
                  ? 'bg-brand-700 text-white shadow-[0_4px_14px_rgba(8,112,95,0.3)] dark:bg-brand-500'
                  : 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
              }`}
            >
              {isLast ? <FiClock /> : <FiCheckCircle />}
            </span>
            <div className="pt-1.5">
              <strong className="block text-sm">{label}</strong>
              {date ? (
                <span className="mt-1 block text-xs text-[var(--app-text-faint)]">{date}</span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
