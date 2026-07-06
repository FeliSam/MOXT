import { FiChevronRight } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'
import { preloadRoute } from '../../config/navigation'

function MoreServiceTile({ badge, item, onNavigate, translateLabel }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      onFocus={() => preloadRoute(item.path)}
      onMouseEnter={() => preloadRoute(item.path)}
      className={({ isActive }) =>
        `relative flex min-h-[5.25rem] flex-col justify-between rounded-[var(--radius-card)] border p-3 transition-all duration-[var(--transition-fast)] ${
          isActive
            ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] shadow-[var(--shadow-card)]'
            : 'border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-card)] hover:border-brand-200 hover:shadow-[var(--shadow-card-hover)] dark:hover:border-brand-800'
        }`
      }
    >
      <span className="flex items-start justify-between gap-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface-muted)] text-[var(--app-accent)] dark:text-[var(--app-teal)]">
          <Icon className="text-lg" aria-hidden="true" />
        </span>
        {badge > 0 ? (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </span>
      <span className="line-clamp-2 text-xs font-semibold leading-snug text-[var(--app-text)]">
        {translateLabel(item.label)}
      </span>
    </NavLink>
  )
}

function MoreServiceRow({ badge, item, onNavigate, translateLabel }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      onFocus={() => preloadRoute(item.path)}
      onMouseEnter={() => preloadRoute(item.path)}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-sm font-semibold transition-all duration-[var(--transition-fast)] ${
          isActive
            ? 'nav-item-active'
            : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
        }`
      }
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface-muted)] text-[var(--app-accent)] dark:text-[var(--app-teal)]">
        <Icon className="text-lg" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{translateLabel(item.label)}</span>
      {badge > 0 ? (
        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
      <FiChevronRight className="shrink-0 text-[var(--app-text-faint)]" aria-hidden="true" />
    </NavLink>
  )
}

/**
 * Grille de services — design aligné Piste A (cartes bordées, icônes teal, sections claires).
 * layout="grid" → tuiles 2 colonnes (drawer Plus mobile)
 * layout="list" → lignes compactes (panneau desktop optionnel)
 */
export function MoreServicesContent({
  badgeFor,
  groups,
  layout = 'grid',
  onNavigate,
  translateLabel,
}) {
  if (!groups.length) {
    return (
      <p className="px-2 py-10 text-center text-sm text-[var(--app-text-muted)]">
        Aucun service ne correspond à votre recherche.
      </p>
    )
  }

  return (
    <>
      {groups.map((group) => (
        <section key={group.id} className="mb-5">
          <h3 className="mb-2.5 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-text-faint)]">
            {translateLabel(group.label)}
          </h3>
          {layout === 'grid' ? (
            <div className="grid grid-cols-2 gap-2">
              {group.children.map((item) => (
                <MoreServiceTile
                  key={item.path}
                  badge={badgeFor?.(item) ?? 0}
                  item={item}
                  onNavigate={onNavigate}
                  translateLabel={translateLabel}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-1 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1.5">
              {group.children.map((item) => (
                <MoreServiceRow
                  key={item.path}
                  badge={badgeFor?.(item) ?? 0}
                  item={item}
                  onNavigate={onNavigate}
                  translateLabel={translateLabel}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  )
}
