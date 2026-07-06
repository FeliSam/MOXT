import { FiChevronRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { preloadRoute } from '../../../config/navigation'

function ProfileLinkTile({ description, icon: Icon, label, path, translateLabel }) {
  return (
    <Link
      to={path}
      onFocus={() => preloadRoute(path)}
      onMouseEnter={() => preloadRoute(path)}
      className="group flex min-h-[5.25rem] flex-col justify-between rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-[var(--shadow-card)] transition-all duration-[var(--transition-fast)] hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)] dark:hover:border-brand-800 sm:min-h-0 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
    >
      <span className="flex items-start justify-between gap-2 sm:contents">
        <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface-muted)] text-[var(--app-accent)] dark:text-[var(--app-teal)]">
          <Icon className="text-lg" aria-hidden="true" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-xs font-semibold leading-snug text-[var(--app-text)] sm:text-sm">
          {translateLabel(label)}
        </strong>
        <small className="mt-0.5 hidden text-[11px] leading-snug text-[var(--app-text-faint)] sm:block">
          {description}
        </small>
      </span>
      <FiChevronRight
        className="hidden shrink-0 text-[var(--app-text-faint)] transition-transform group-hover:translate-x-0.5 sm:block"
        aria-hidden="true"
      />
    </Link>
  )
}

export function ProfileLinkGrid({ sections, translateLabel }) {
  return (
    <>
      {sections.map((group) => (
        <section key={group.id}>
          <h2 className="mb-2.5 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
            {group.title}
          </h2>
          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-3" aria-label={group.title}>
            {group.links.map((link) => (
              <ProfileLinkTile key={link.path} {...link} translateLabel={translateLabel} />
            ))}
          </nav>
        </section>
      ))}
    </>
  )
}
