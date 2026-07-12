import { flagEmoji } from '../../config/flags'

export function ExchangerPickerAvatar({ exchanger, active = false }) {
  const label = exchanger.name || 'Partenaire'
  const flag = flagEmoji(exchanger.country)

  if (exchanger.logoUrl) {
    return (
      <div className="relative size-12 shrink-0">
        <img
          src={exchanger.logoUrl}
          alt=""
          className={`size-12 rounded-2xl object-cover ${active ? 'ring-2 ring-brand-500' : ''}`}
          loading="lazy"
          decoding="async"
        />
        <span
          className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-sm leading-none"
          aria-hidden="true"
        >
          {flag}
        </span>
      </div>
    )
  }

  return (
    <div className="relative size-12 shrink-0">
      <div
        className={`grid size-12 place-items-center rounded-2xl text-base font-black ${
          active
            ? 'bg-brand-700 text-white'
            : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
        }`}
      >
        {label[0]}
      </div>
      <span
        className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-sm leading-none"
        aria-hidden="true"
      >
        {flag}
      </span>
    </div>
  )
}
