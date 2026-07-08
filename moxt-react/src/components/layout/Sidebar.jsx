import { useState } from 'react'
import {
  FiChevronRight,
  FiGrid,
  FiLogOut,
  FiSettings,
  FiX,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { navigationGroups, preloadRoute } from '../../config/navigation'
import {
  moreServicesExcludedPaths,
  primaryNavigationItems,
  sidebarMobileHiddenPaths,
} from '../../config/primaryNavigation'
import { logout } from '../../features/auth/authSlice'
import { stopRealtimeSubscription } from '../../services/realtimeService'
import { closeSidebar } from '../../features/ui/uiSlice'
import { useLanguage } from '../../contexts/useLanguage'
import { VerifiedBadge } from '../ui/Badge'
import { MoreServicesContent } from './MoreServicesContent'
import { filterNavigationGroups, useNavigationBadges } from './moreServicesUtils'

const primaryItems = primaryNavigationItems
const mobileHiddenPaths = sidebarMobileHiddenPaths
/** Chemins déjà listés dans la nav mobile — exclut les entrées réservées au desktop */
const mobileSidebarExcludePaths = new Set([
  ...primaryItems.filter((item) => !item.desktopOnly).map((item) => item.path),
  ...mobileHiddenPaths,
])

function initials(name = '') {
  return name.split(' ').map((w) => w[0] || '').slice(0, 2).join('').toUpperCase()
}

export function Sidebar({ open }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const role = user?.role
  const appState = useSelector((state) => state)
  const badgeForItem = useNavigationBadges(user?.id)
  const [moreOpen, setMoreOpen] = useState(false)
  const { translateLabel } = useLanguage()
  const groups = navigationGroups.filter((group) => !group.roles || group.roles.includes(role))
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()

  async function handleLogout() {
    stopRealtimeSubscription()
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <>
      {/* ── Sidebar : dock flottant, rail fixe desktop, libellés simultanés au survol ── */}
      <aside
        className={`group/sidebar fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col bg-[var(--app-surface)] shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:inset-y-3 lg:left-3 lg:w-[4.75rem] lg:translate-x-0 lg:overflow-visible lg:rounded-[1.75rem] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)]/95 lg:shadow-[var(--shadow-float)] lg:backdrop-blur-xl`}
      >
        {/* Logo — icône seule sur desktop */}
        <div className="flex h-[4.5rem] shrink-0 items-center justify-between px-5 lg:justify-center lg:border-b lg:border-[var(--app-border)]/70 lg:px-0">
          <Link to="/dashboard" aria-label="MOXT" className="flex min-w-0 items-center justify-center">
            <img
              src="/assets/logos/X.svg"
              alt=""
              className="hidden h-9 w-9 shrink-0 object-contain lg:block"
            />
            <img
              src="/assets/logos/MOXTlogo.svg"
              alt="MOXT"
              className="block h-9 max-w-[9rem] object-contain object-left lg:hidden"
            />
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-2xl bg-[var(--app-surface-muted)] lg:hidden"
            onClick={() => dispatch(closeSidebar())}
            aria-label="Fermer la navigation"
          >
            <FiX />
          </button>
        </div>

        {/* Nav principale */}
        <nav
          className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-3 py-4 lg:overflow-visible"
          aria-label="Navigation principale"
        >
          <div className="grid gap-1">
            {primaryItems.map((item) => (
              <SidebarLink
                key={item.path}
                item={item}
                badge={item.badgeSelector ? badgeForItem(item, appState) : 0}
                translateLabel={translateLabel}
                hideOnMobile={mobileHiddenPaths.has(item.path) || item.desktopOnly}
                onClick={() => dispatch(closeSidebar())}
              />
            ))}
          </div>

          {/* "Tous les services" — desktop, libellé flottant au survol du rail */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="group/more relative mt-2 hidden w-full min-h-11 items-center justify-center rounded-xl px-2 text-left text-sm font-bold text-[var(--app-text-muted)] transition hover:text-[var(--app-text)] lg:flex"
          >
            <span className="sidebar-nav-icon grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface-muted)] text-brand-700 dark:text-brand-300">
              <FiGrid className="text-base" />
            </span>
            <span className="sidebar-rail-label pointer-events-none absolute left-full z-50 ml-2.5 hidden items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]/98 px-3 py-1.5 text-xs font-bold text-[var(--app-text)] shadow-[var(--shadow-float)] backdrop-blur-md lg:group-hover/sidebar:flex">
              Tous les services
              <FiChevronRight className="text-[var(--app-text-faint)]" />
            </span>
          </button>

          {/* Mobile : groupes complets */}
          <div className="mt-5 border-t border-[var(--app-border)] pt-4 lg:hidden">
            {groups.map((group) => (
              <NavigationGroup
                key={group.id}
                group={group}
                role={role}
                excludePaths={mobileSidebarExcludePaths}
                onNavigate={() => dispatch(closeSidebar())}
                translateLabel={translateLabel}
              />
            ))}
          </div>
        </nav>

        {/* Profil bas de sidebar — desktop uniquement */}
        <div className="relative hidden shrink-0 border-t border-[var(--app-border)]/70 p-3 lg:block">
          <NavLink
            to="/profile"
            onClick={() => dispatch(closeSidebar())}
            className="group/profile relative flex min-h-11 items-center justify-center rounded-2xl p-2 transition hover:bg-[var(--app-surface-muted)]"
          >
            <span className="sidebar-nav-icon grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-[var(--app-teal)] text-xs font-black text-white">
              {initials(fullName) || 'M'}
            </span>
            <span className="sidebar-rail-label pointer-events-none absolute left-full z-50 ml-2.5 hidden min-w-[9rem] flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]/98 px-3 py-2 shadow-[var(--shadow-float)] backdrop-blur-md lg:group-hover/sidebar:flex">
              <strong className="truncate text-xs font-black text-[var(--app-text)]">
                {fullName || 'Mon profil'}
              </strong>
              {user?.verified ? (
                <VerifiedBadge size="sm" className="mt-0.5" />
              ) : (
                <span className="text-[10px] text-[var(--app-text-faint)]">{role || 'Membre'}</span>
              )}
            </span>
          </NavLink>
          <div className="sidebar-rail-actions pointer-events-none absolute bottom-3 left-full z-50 ml-2.5 hidden flex-col gap-1 opacity-0 transition-opacity duration-200 lg:group-hover/sidebar:pointer-events-auto lg:group-hover/sidebar:flex lg:group-hover/sidebar:opacity-100">
            <NavLink
              to="/settings"
              className="sidebar-rail-label pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]/98 px-3 py-1.5 text-xs font-bold text-[var(--app-text-muted)] shadow-[var(--shadow-float)] backdrop-blur-md transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
            >
              <FiSettings className="text-sm" />
              Reglages
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar-rail-label pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-xl border border-red-200 bg-red-50/95 px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm backdrop-blur-md transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30"
            >
              <FiLogOut className="text-sm" />
              Quitter
            </button>
          </div>
        </div>

        {/* Logout mobile (sidebar pleine largeur) */}
        <button
          type="button"
          onClick={handleLogout}
          className="mx-3 mb-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 lg:hidden dark:hover:bg-red-950/30"
        >
          <FiLogOut className="text-lg" />
          Deconnexion
        </button>
      </aside>

      {/* ── Panel "Tous les services" desktop ── */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50 hidden lg:block">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
            aria-label="Fermer les services"
          />
          <aside className="panel-pop absolute bottom-4 left-24 top-4 flex w-[24rem] flex-col overflow-hidden rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-float)]">
            <div className="shrink-0 border-b border-[var(--app-border)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-700">
                    MOXT
                  </p>
                  <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight">
                    Tous les services
                  </h2>
                </div>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-[var(--radius-btn)] border border-[var(--app-border)] bg-[var(--app-surface-muted)]"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Fermer"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div
              data-navbar-ignore
              className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-4 py-4"
            >
              <MoreServicesContent
                badgeFor={(item) => badgeForItem(item, appState)}
                groups={filterNavigationGroups(groups, role, moreServicesExcludedPaths, '', translateLabel)}
                layout="grid"
                onNavigate={() => setMoreOpen(false)}
                translateLabel={translateLabel}
              />
            </div>
            <div className="shrink-0 border-t border-[var(--app-border)] p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
              >
                <FiLogOut />
                Déconnexion
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}

function NavigationGroup({ card = false, excludePaths, group, onNavigate, role, translateLabel }) {
  const items = group.children.filter(
    (item) =>
      (!item.roles || item.roles.includes(role)) && (!excludePaths || !excludePaths.has(item.path)),
  )
  if (!items.length) return null

  return (
    <section className="mb-5">
      <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--app-text-faint)]">
        {translateLabel(group.label)}
      </p>
      <div className={card ? 'grid grid-cols-2 gap-2' : 'grid gap-1'}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            onFocus={() => preloadRoute(item.path)}
            onMouseEnter={() => preloadRoute(item.path)}
            className={({ isActive }) =>
              card
                ? `flex min-h-24 flex-col justify-between rounded-2xl p-3 transition ${
                    isActive
                      ? 'bg-[var(--app-accent-soft)] text-brand-800 dark:text-brand-200'
                      : 'bg-[var(--app-surface-muted)] hover:-translate-y-0.5 hover:shadow-md'
                  }`
                : `flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition ${
                    isActive
                      ? 'bg-[var(--app-accent-soft)] text-brand-800 dark:text-brand-200'
                      : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]'
                  }`
            }
          >
            <item.icon className="text-lg" />
            <span className={card ? 'text-xs font-black' : ''}>{translateLabel(item.label)}</span>
          </NavLink>
        ))}
      </div>
    </section>
  )
}

function SidebarLink({ badge = 0, hideOnMobile = false, item, onClick, translateLabel }) {
  const Icon = item.icon
  const label = translateLabel(item.label)
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      onClick={onClick}
      onFocus={() => preloadRoute(item.path)}
      onMouseEnter={() => preloadRoute(item.path)}
      className={({ isActive }) =>
        `group/link relative block ${hideOnMobile ? 'hidden lg:block' : ''} ${
          isActive ? 'lg:z-[1]' : ''
        }`
      }
      aria-label={badge > 0 ? `${label} (${badge > 9 ? '9+' : badge} non lus)` : undefined}
    >
      {({ isActive }) => (
        <span
          className={`flex min-h-11 items-center justify-center rounded-xl px-2.5 transition-all duration-200 lg:justify-start ${
            isActive
              ? 'nav-item-active text-sm font-bold'
              : 'text-sm font-bold text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]/80 hover:text-[var(--app-text)]'
          }`}
        >
          <span
            className={`sidebar-nav-icon relative grid size-9 shrink-0 place-items-center rounded-[0.7rem] transition-all duration-200 ${
              isActive
                ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--app-accent)_25%,transparent)] dark:text-[var(--app-teal)]'
                : 'text-[var(--app-text-muted)]'
            }`}
          >
            <Icon className="text-lg transition-transform duration-200" />
            {badge > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>

          {/* Mobile : libellé inline */}
          <span className="ml-3 flex min-w-0 flex-1 items-center justify-between gap-2 lg:hidden">
            <span className="truncate">{label}</span>
            {badge > 0 ? (
              <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>

          {/* Desktop : libellé flottant — tous visibles au survol du rail */}
          <span className="sidebar-rail-label pointer-events-none absolute left-full z-50 ml-2.5 hidden max-w-[11rem] items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]/98 px-3 py-1.5 text-xs font-bold text-[var(--app-text)] shadow-[var(--shadow-float)] backdrop-blur-md lg:group-hover/sidebar:flex">
            <span className="truncate">{label}</span>
            {badge > 0 ? (
              <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>
        </span>
      )}
    </NavLink>
  )
}
