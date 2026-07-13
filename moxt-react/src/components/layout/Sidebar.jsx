import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  FiChevronRight,
  FiGrid,
  FiLogOut,
  FiSettings,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { navigationGroups, preloadRoute } from '../../config/navigation'
import {
  moreServicesExcludedPaths,
  primaryNavigationItems,
  sidebarMobileHiddenPaths,
} from '../../config/primaryNavigation'
import { selectActiveBusinessForOwner } from '../../features/businesses/businessVisibility'
import { logout } from '../../features/auth/authSlice'
import { stopRealtimeSubscription } from '../../services/realtimeService'
import { closeSidebar } from '../../features/ui/uiSlice'
import { useLanguage } from '../../contexts/useLanguage'
import { CountBounce } from '../ui/CountBounce'
import { MoreServicesContent } from './MoreServicesContent'
import { filterNavigationGroups, useNavigationBadges } from './moreServicesUtils'

const primaryItems = primaryNavigationItems
const mobileHiddenPaths = sidebarMobileHiddenPaths
/** Chemins déjà listés dans la nav mobile — exclut les entrées réservées au desktop */
const mobileSidebarExcludePaths = new Set([
  ...primaryItems.filter((item) => !item.desktopOnly).map((item) => item.path),
  ...mobileHiddenPaths,
])

function buildRailKeys(items) {
  return [...items.map((item) => item.path), 'more', 'settings']
}

function railProximity(railKeys, hoveredKey, key) {
  if (hoveredKey == null) return null
  const hoveredIndex = railKeys.indexOf(hoveredKey)
  const itemIndex = railKeys.indexOf(key)
  if (hoveredIndex < 0 || itemIndex < 0) return null
  const distance = Math.abs(hoveredIndex - itemIndex)
  if (distance === 0) return 'focus'
  if (distance === 1) return 'near'
  if (distance === 2) return 'far'
  if (distance === 3) return 'edge'
  return null
}

function proximityClass(proximity) {
  if (proximity === 'focus') return 'sidebar-proximity-focus'
  if (proximity === 'near') return 'sidebar-proximity-near'
  if (proximity === 'far') return 'sidebar-proximity-far'
  if (proximity === 'edge') return 'sidebar-proximity-edge'
  return ''
}

export function Sidebar({ open }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const role = user?.role
  const appState = useSelector((state) => state)
  const businesses = useSelector((state) => state.businesses.items)
  const ownBusiness = useMemo(
    () => selectActiveBusinessForOwner(businesses, user?.id),
    [businesses, user?.id],
  )
  const visiblePrimaryItems = useMemo(
    () =>
      primaryItems.filter((item) => {
        if (item.requiresOwnedBusiness && !ownBusiness) return false
        return true
      }),
    [ownBusiness],
  )
  const railKeys = useMemo(() => buildRailKeys(visiblePrimaryItems), [visiblePrimaryItems])
  const badgeForItem = useNavigationBadges(user?.id)
  const [moreOpen, setMoreOpen] = useState(false)
  const [hoveredRailKey, setHoveredRailKey] = useState(null)
  const hoverFrameRef = useRef(0)
  const asideRef = useRef(null)
  const location = useLocation()
  const { translateLabel } = useLanguage()
  const groups = navigationGroups.filter((group) => !group.roles || group.roles.includes(role))

  function setRailHover(key) {
    if (hoverFrameRef.current) cancelAnimationFrame(hoverFrameRef.current)
    hoverFrameRef.current = requestAnimationFrame(() => {
      setHoveredRailKey(key)
    })
  }

  useEffect(() => {
    return () => {
      if (hoverFrameRef.current) cancelAnimationFrame(hoverFrameRef.current)
    }
  }, [])

  useLayoutEffect(() => {
    setMoreOpen(false)
    setHoveredRailKey(null)
    const active = document.activeElement
    if (active && asideRef.current?.contains(active)) {
      active.blur()
    }
  }, [location.pathname])

  useEffect(() => {
    function onPageShow(event) {
      if (!event.persisted) return
      setMoreOpen(false)
      setHoveredRailKey(null)
      dispatch(closeSidebar())
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [dispatch])

  async function handleLogout() {
    stopRealtimeSubscription()
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <>
      {/* ── Sidebar : dock flottant, rail fixe desktop, cascade 4 niveaux au survol ── */}
      <aside
        ref={asideRef}
        onMouseLeave={() => setRailHover(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setHoveredRailKey(null)
          }
        }}
        className={`group/sidebar fixed inset-y-0 left-0 z-[var(--z-nav)] flex max-h-dvh w-[18rem] flex-col bg-[var(--app-surface)] shadow-2xl transition-transform duration-300 ease-out lg:z-[var(--z-nav-menu)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:inset-y-3 lg:left-3 lg:flex lg:max-h-[calc(100dvh-1.5rem)] lg:w-[4.75rem] lg:translate-x-0 lg:overflow-visible lg:rounded-[1.75rem] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)]/95 lg:shadow-[var(--shadow-float)] lg:backdrop-blur-xl`}
      >
        {/* Logo — icône seule sur desktop */}
        <div className="flex h-[4.5rem] shrink-0 items-center justify-between px-5 lg:justify-center lg:border-b lg:border-[var(--app-border)]/70 lg:px-0">
          <Link to="/dashboard" aria-label="MOXT" className="flex min-w-0 items-center justify-center">
            <img
              src="/assets/brand/moxt-x.png"
              alt="MOXT"
              className="h-9 w-9 shrink-0 rounded-xl object-cover"
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

        {/* Corps du rail — icônes + services, profil séparé en bas */}
        <div className="sidebar-rail-body flex min-h-0 flex-1 flex-col overflow-visible">
          <div className="sidebar-rail-leading-spacer hidden min-h-0 shrink-0 lg:block" aria-hidden="true" />
          <nav
            className="sidebar-mobile-nav sidebar-rail-nav scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-3 py-4 lg:overflow-visible lg:overscroll-none lg:px-2 lg:py-2"
            aria-label="Navigation principale"
          >
            <div className="sidebar-rail-stack grid gap-1 lg:gap-1.5">
              {visiblePrimaryItems.map((item) => {
                const itemPath =
                  item.id === 'businesses' && ownBusiness
                    ? `/businesses/${ownBusiness.id}`
                    : item.path
                return (
                <SidebarLink
                  key={item.id}
                  item={{ ...item, path: itemPath }}
                  badge={item.badgeSelector ? badgeForItem(item, appState) : 0}
                  translateLabel={translateLabel}
                  hideOnMobile={mobileHiddenPaths.has(item.path) || item.desktopOnly}
                  proximity={railProximity(railKeys, hoveredRailKey, item.path)}
                  onRailHover={() => setRailHover(item.path)}
                  onClick={() => dispatch(closeSidebar())}
                />
                )
              })}

              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                onMouseEnter={() => setRailHover('more')}
                onFocus={() => setRailHover('more')}
                className={`sidebar-rail-item group/more relative hidden w-full min-h-11 shrink-0 items-center justify-center rounded-xl px-2 text-left text-sm font-bold text-[var(--app-text-muted)] transition hover:text-[var(--app-text)] lg:flex ${proximityClass(railProximity(railKeys, hoveredRailKey, 'more'))}`}
              >
                <span className="sidebar-nav-icon grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-[var(--app-surface-muted)] text-brand-700 dark:text-brand-300">
                  <FiGrid className="text-base" />
                </span>
                <span className="sidebar-rail-label sidebar-rail-label--row">
                  {translateLabel('Services supplémentaires')}
                  <FiChevronRight className="sidebar-rail-label-chevron" />
                </span>
              </button>
            </div>

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
        </div>

        {/* Réglages bas de sidebar — flyout : Profil en haut, Réglages + Déconnexion en bas */}
        <div
          className="sidebar-footer-zone group/footer relative z-10 hidden shrink-0 overflow-visible border-t border-[var(--app-border)]/70 bg-[var(--app-surface)] p-3 lg:block"
          onMouseEnter={() => setRailHover('settings')}
        >
          <NavLink
            to="/settings"
            onClick={() => dispatch(closeSidebar())}
            onMouseEnter={() => setRailHover('settings')}
            className={({ isActive }) =>
              `sidebar-rail-item group/settings relative flex min-h-11 items-center justify-center rounded-2xl p-2 transition hover:bg-[var(--app-surface-muted)] ${proximityClass(railProximity(railKeys, hoveredRailKey, 'settings'))} ${
                isActive ? 'bg-[var(--app-surface-muted)]' : ''
              }`
            }
          >
            <span className="sidebar-nav-icon grid size-9 shrink-0 place-items-center rounded-full bg-[var(--app-surface-muted)] text-lg text-[var(--app-accent)]">
              <FiSettings />
            </span>
          </NavLink>

          <div className="sidebar-footer-flyout" role="menu" aria-label="Compte et session">
            <NavLink
              to="/profile"
              role="menuitem"
              onClick={() => dispatch(closeSidebar())}
              className="sidebar-rail-label sidebar-rail-label--action sidebar-rail-label--profile sidebar-rail-label--interactive"
            >
              <FiUser className="text-sm shrink-0" />
              <span>Profil</span>
            </NavLink>
            <div className="sidebar-footer-flyout-actions">
              <NavLink
                to="/settings"
                role="menuitem"
                onClick={() => dispatch(closeSidebar())}
                className="sidebar-rail-label sidebar-rail-label--action sidebar-rail-label--interactive"
              >
                <FiSettings className="text-sm shrink-0" />
                <span>Réglages</span>
              </NavLink>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="sidebar-rail-label sidebar-rail-label--action sidebar-rail-label--danger sidebar-rail-label--interactive"
              >
                <FiLogOut className="text-sm shrink-0" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logout mobile (sidebar pleine largeur) */}
        <button
          type="button"
          onClick={handleLogout}
          className="mx-3 mb-3 mt-auto flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 lg:hidden dark:hover:bg-red-950/30"
        >
          <FiLogOut className="text-lg" />
          Deconnexion
        </button>
      </aside>

      {/* ── Panel "Services supplémentaires" desktop ── */}
      {moreOpen ? (
        <div className="fixed inset-0 z-[var(--z-nav-menu)] hidden lg:block">
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
                    {translateLabel('Services supplémentaires')}
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

function SidebarLink({
  badge = 0,
  hideOnMobile = false,
  item,
  onClick,
  onRailHover,
  proximity = null,
  translateLabel,
}) {
  const Icon = item.icon
  const label = translateLabel(item.label)
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      onClick={onClick}
      onMouseEnter={() => {
        preloadRoute(item.path)
        onRailHover?.()
      }}
      onFocus={() => {
        preloadRoute(item.path)
        onRailHover?.()
      }}
      className={({ isActive }) =>
        `sidebar-rail-item group/link relative block outline-none ${proximityClass(proximity)} ${
          hideOnMobile ? 'hidden lg:block' : ''
        } ${isActive ? 'lg:z-[1]' : ''}`
      }
      aria-label={badge > 0 ? `${label} (${badge > 9 ? '9+' : badge} non lus)` : label}
    >
      {({ isActive }) => (
        <span
          className={`flex min-h-11 items-center justify-center rounded-xl px-2.5 lg:justify-start ${
            isActive
              ? 'nav-item-active text-sm font-bold'
              : 'text-sm font-bold text-[var(--app-text-muted)]'
          }`}
        >
          <span
            className={`sidebar-nav-icon relative grid size-9 shrink-0 place-items-center rounded-[0.7rem] ${
              isActive
                ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--app-accent)_25%,transparent)] dark:text-[var(--app-teal)]'
                : 'text-[var(--app-text-muted)]'
            }`}
          >
            <Icon className="text-lg" />
            {badge > 0 ? (
              <CountBounce
                value={badge}
                className="absolute -right-0.5 -top-0.5 grid min-w-[1.05rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm"
              />
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
          <span className="sidebar-rail-label sidebar-rail-label--row">
            <span className="truncate">{label}</span>
            {badge > 0 ? (
              <span className="sidebar-rail-label-badge shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </span>
        </span>
      )}
    </NavLink>
  )
}
