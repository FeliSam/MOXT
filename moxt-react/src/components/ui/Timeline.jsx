import { FiCheckCircle } from 'react-icons/fi'
import { formatDateTime } from '../../utils/formatters'

export function Timeline({ events = [], labelFor = (event) => event.label || event.status }) {
  if (!events.length) return null
  return (
    <ol className="grid gap-3" aria-label="Chronologie">
      {events.map((event, index) => (
        <li
          key={event.id || `${event.status}-${event.at}-${index}`}
          className="grid grid-cols-[auto_1fr] gap-3"
        >
          <span className="grid size-8 place-items-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <FiCheckCircle aria-hidden="true" />
          </span>
          <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3">
            <strong className="text-sm">{labelFor(event)}</strong>
            <time className="mt-1 block text-xs text-[var(--app-text-muted)]" dateTime={event.at}>
              {formatDateTime(event.at)}
            </time>
            {event.note ? <p className="mt-2 text-sm">{event.note}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
