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
const primaryPaths = new Set(primaryItems.map((item) => item.path))
const mobileHiddenPaths = sidebarMobileHiddenPaths

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
      {/* ── Sidebar : dock flottant, replié sur desktop, déploiement au survol ── */}
      <aside
        className={`group fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col bg-[var(--app-surface)] shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:inset-y-3 lg:left-3 lg:w-[4.75rem] lg:translate-x-0 lg:overflow-hidden lg:rounded-[1.75rem] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)]/95 lg:shadow-[var(--shadow-float)] lg:backdrop-blur-xl lg:transition-[width] lg:duration-300 lg:ease-out lg:hover:w-64 lg:hover:shadow-2xl`}
      >
        {/* Logo zone — marque repliée sur desktop, logo complet sur mobile et au survol */}
        <div className="flex h-[4.5rem] shrink-0 items-center justify-between px-5 lg:justify-center lg:border-b lg:border-[var(--app-border)]/70 lg:px-0 lg:group-hover:justify-between lg:group-hover:px-4">
          <Link to="/dashboard" aria-label="MOXT" className="flex min-w-0 items-center justify-center">
            <img
              src="/assets/logos/X.svg"
              alt=""
              className="hidden h-9 w-9 shrink-0 object-contain transition-opacity duration-200 lg:block lg:group-hover:hidden"
            />
            <img
              src="/assets/logos/MOXTlogo.svg"
              alt="MOXT"
              className="block h-9 max-w-[9rem] object-contain object-left transition-opacity duration-200 lg:hidden lg:group-hover:block"
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
          className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-3 py-4 lg:overflow-x-hidden"
          aria-label="Navigation principale"
        >
          <div className="grid gap-1">
            {primaryItems.map((item) => (
              <SidebarLink
                key={item.path}
                item={item}
                badge={item.badgeSelector ? badgeForItem(item, appState) : 0}
                translateLabel={translateLabel}
                hideOnMobile={mobileHiddenPaths.has(item.path)}
                onClick={() => dispatch(closeSidebar())}
              />
            ))}
          </div>

          {/* "Tous les services" — desktop ouvre le panel flottant */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="mt-2 hidden w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-bold text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] lg:flex"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-brand-700 transition-transform duration-200 group-hover:scale-105 dark:text-brand-300">
              <FiGrid className="text-base" />
            </span>
            <span className="flex flex-1 items-center justify-between gap-2 overflow-hidden whitespace-nowrap lg:max-w-0 lg:opacity-0 lg:transition-all lg:duration-200 lg:group-hover:max-w-[10rem] lg:group-hover:opacity-100">
              Tous les services
              <FiChevronRight className="shrink-0 text-[var(--app-text-faint)]" />
            </span>
          </button>

          {/* Mobile : groupes complets */}
          <div className="mt-5 border-t border-[var(--app-border)] pt-4 lg:hidden">
            {groups.map((group) => (
              <NavigationGroup
                key={group.id}
                group={group}
                role={role}
                excludePaths={new Set([...primaryPaths, ...mobileHiddenPaths])}
                onNavigate={() => dispatch(closeSidebar())}
                translateLabel={translateLabel}
              />
            ))}
          </div>
        </nav>

        {/* Profil bas de sidebar — desktop uniquement */}
        <div className="hidden shrink-0 border-t border-[var(--app-border)]/70 p-3 lg:block">
          <NavLink
            to="/profile"
            onClick={() => dispatch(closeSidebar())}
            className="flex items-center gap-2.5 rounded-2xl p-2 transition hover:bg-[var(--app-surface-muted)]"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-[var(--app-teal)] text-xs font-black text-white">
              {initials(fullName) || 'M'}
            </span>
            <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap lg:max-w-0 lg:opacity-0 lg:transition-all lg:duration-200 lg:group-hover:max-w-[10rem] lg:group-hover:opacity-100">
              <strong className="block truncate text-xs font-black">
                {fullName || 'Mon profil'}
              </strong>
              {user?.verified ? (
                <VerifiedBadge size="sm" className="mt-0.5" />
              ) : (
                <span className="text-[10px] text-[var(--app-text-faint)]">{role || 'Membre'}</span>
              )}
            </span>
          </NavLink>
          <div className="mt-1 grid grid-cols-2 gap-1.5 overflow-hidden whitespace-nowrap lg:max-w-0 lg:opacity-0 lg:transition-all lg:duration-200 lg:group-hover:max-w-[14rem] lg:group-hover:opacity-100">
            <NavLink
              to="/settings"
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
            >
              <FiSettings className="text-sm" />
              Reglages
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
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
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      onClick={onClick}
      onFocus={() => preloadRoute(item.path)}
      onMouseEnter={() => preloadRoute(item.path)}
      className={hideOnMobile ? 'hidden lg:block' : ''}
      aria-label={
        badge > 0 ? `${translateLabel(item.label)} (${badge > 9 ? '9+' : badge} non lus)` : undefined
      }
    >
      {({ isActive }) => (
        <span
          className={`flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-sm font-bold transition-all duration-[var(--transition-fast)] ${
            isActive
              ? 'nav-item-active'
              : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
          }`}
        >
          <span
            className={`relative grid size-9 shrink-0 place-items-center rounded-[0.7rem] transition-all duration-200 ${
              isActive
                ? 'text-[var(--app-accent)] dark:text-[var(--app-teal)]'
                : 'text-[var(--app-text-muted)] group-hover:scale-105'
            }`}
          >
            <Icon className="text-lg" />
            {badge > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden whitespace-nowrap lg:max-w-0 lg:opacity-0 lg:transition-all lg:duration-200 lg:group-hover:max-w-[10rem] lg:group-hover:opacity-100">
            <span className="truncate">{translateLabel(item.label)}</span>
            {badge > 0 ? (
              <span className="hidden shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white lg:group-hover:inline">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>
        </span>
      )}
    </NavLink>
  )
}
