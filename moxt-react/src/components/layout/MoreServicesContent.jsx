import { FiChevronRight } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'
import { preloadRoute } from '../../config/navigation'
import { resolveNavLabel } from '../../config/navLabel'

function MoreServiceTile({ badge, item, onNavigate, resolveLabel }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      data-tour={item.id ? `more-${item.id}` : undefined}
      onClick={onNavigate}
      onFocus={() => preloadRoute(item.path)}
      onMouseEnter={() => preloadRoute(item.path)}
      className={({ isActive }) =>
        `relative flex min-h-[3.5rem] items-center gap-2.5 rounded-[var(--radius-card)] border p-2.5 backdrop-blur-md transition-all duration-[var(--transition-fast)] ${
          isActive
            ? 'border-[var(--app-accent)]/60 bg-[var(--app-accent-soft)]/55 shadow-[var(--shadow-card)]'
            : 'border-[var(--app-border)]/70 bg-[var(--app-surface)]/40 shadow-[var(--shadow-card)] hover:border-brand-200 hover:bg-[var(--app-surface)]/55 hover:shadow-[var(--shadow-card-hover)] dark:hover:border-brand-800'
        }`
      }
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface)]/35 text-[var(--app-accent)] backdrop-blur-sm dark:text-[var(--app-teal)]">
        <Icon className="text-lg" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 line-clamp-2 text-xs font-semibold leading-snug text-[var(--app-text)]">
        {resolveLabel(item)}
      </span>
      {badge > 0 ? (
        <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </NavLink>
  )
}

function MoreServiceRow({ badge, item, onNavigate, resolveLabel }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      data-tour={item.id ? `more-${item.id}` : undefined}
      onClick={onNavigate}
      onFocus={() => preloadRoute(item.path)}
      onMouseEnter={() => preloadRoute(item.path)}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-sm font-semibold transition-all duration-[var(--transition-fast)] ${
          isActive
            ? 'nav-item-active'
            : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface)]/50 hover:text-[var(--app-text)]'
        }`
      }
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface)]/35 text-[var(--app-accent)] backdrop-blur-sm dark:text-[var(--app-teal)]">
        <Icon className="text-lg" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{resolveLabel(item)}</span>
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
  resolveLabel,
  t,
  translateLabel,
}) {
  const labelOf =
    resolveLabel || ((entry) => resolveNavLabel(entry, t, translateLabel))

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
            {labelOf(group)}
          </h3>
          {layout === 'grid' ? (
            <div className="grid grid-cols-2 gap-2">
              {group.children.map((item) => (
                <MoreServiceTile
                  key={item.path}
                  badge={badgeFor?.(item) ?? 0}
                  item={item}
                  onNavigate={onNavigate}
                  resolveLabel={labelOf}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-1 rounded-[var(--radius-card)] border border-[var(--app-border)]/70 bg-[var(--app-surface)]/30 p-1.5 backdrop-blur-md">
              {group.children.map((item) => (
                <MoreServiceRow
                  key={item.path}
                  badge={badgeFor?.(item) ?? 0}
                  item={item}
                  onNavigate={onNavigate}
                  resolveLabel={labelOf}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  )
}
