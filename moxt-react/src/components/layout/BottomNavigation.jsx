import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiGrid } from 'react-icons/fi'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { bottomNavigationItems } from '../../config/bottomNavigation'
import { preloadRoute } from '../../config/navigation'
import { resolveNavLabel } from '../../config/navLabel'
import { useLanguage } from '../../contexts/useLanguage'
import { TOUR_MORE_EVENT } from '../../features/onboarding/tourChrome'
import { selectMoreMenuBadgeCount } from './moreServicesUtils'
import { MobileMoreDrawer } from './MobileMoreDrawer'

const BOTTOM_NAV_SLOT =
  'relative z-[1] flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-all duration-[var(--transition-fast)] active:scale-[0.96]'

const BOTTOM_NAV_ICON =
  'grid size-9 shrink-0 place-items-center rounded-[0.7rem] transition-colors duration-[var(--transition-fast)]'

const BOTTOM_NAV_LABEL =
  'block w-full max-w-full truncate text-center text-[11px] font-semibold leading-none'

function BottomNavIcon({ active, icon: Icon }) {
  return (
    <span
      className={`${BOTTOM_NAV_ICON} ${
        active
          ? 'text-[var(--app-accent)] dark:text-[var(--app-teal)]'
          : 'text-[var(--app-text)]/72'
      }`}
    >
      <Icon className="text-lg" strokeWidth={2.1} aria-hidden="true" />
    </span>
  )
}

function BottomNavLabel({ children }) {
  return <span className={BOTTOM_NAV_LABEL}>{children}</span>
}

function BottomNavItem({ item, resolveLabel, itemRef }) {
  const { icon, path, id } = item
  return (
    <NavLink
      ref={itemRef}
      to={path}
      end={path === '/dashboard'}
      data-tour={`nav-${id}`}
      onFocus={() => preloadRoute(path)}
      onMouseEnter={() => preloadRoute(path)}
      className={({ isActive }) =>
        `${BOTTOM_NAV_SLOT} ${
          isActive
            ? 'nav-item-active-bottom text-[var(--app-accent)] dark:text-[var(--app-teal)]'
            : 'text-[var(--app-text)]/72'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <BottomNavIcon active={isActive} icon={icon} />
          <BottomNavLabel>{resolveLabel(item)}</BottomNavLabel>
        </>
      )}
    </NavLink>
  )
}

export function BottomNavigation() {
  const { t, translateLabel } = useLanguage()
  const resolveLabel = (entry) => resolveNavLabel(entry, t, translateLabel)
  const location = useLocation()
  const userId = useSelector((state) => state.auth.user?.id)
  const moreBadge = useSelector((state) => selectMoreMenuBadgeCount(state, userId))
  const [moreOpen, setMoreOpen] = useState(false)
  const navRef = useRef(null)
  const itemRefs = useRef([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  const activeIndex = bottomNavigationItems.findIndex((item) => {
    if (item.path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  })

  useLayoutEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onTourMore(event) {
      setMoreOpen(Boolean(event.detail?.open))
    }
    window.addEventListener(TOUR_MORE_EVENT, onTourMore)
    return () => window.removeEventListener(TOUR_MORE_EVENT, onTourMore)
  }, [])

  useEffect(() => {
    function onPageShow(event) {
      if (event.persisted) setMoreOpen(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  useLayoutEffect(() => {
    function update() {
      const el = activeIndex >= 0 ? itemRefs.current[activeIndex] : null
      const nav = navRef.current
      if (!el || !nav) {
        setIndicator((current) => ({ ...current, ready: false }))
        return
      }
      const navRect = nav.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      setIndicator({
        left: elRect.left - navRect.left,
        width: elRect.width,
        ready: true,
      })
    }
    update()
    window.addEventListener('resize', update)
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
    }
  }, [activeIndex, location.pathname])

  return (
    <>
      <nav
        ref={navRef}
        data-tour="bottom-nav"
        className="bottom-nav-shell z-[var(--z-nav)] grid grid-cols-5 gap-0.5 rounded-[1rem] border border-[var(--app-border)]/80 bg-[var(--app-surface)]/65 shadow-[var(--shadow-float)] backdrop-blur-xl lg:hidden"
        aria-label={t('nav.mobileQuickAria')}
      >
        <span
          aria-hidden="true"
          className="bottom-nav-indicator pointer-events-none absolute rounded-xl bg-[var(--app-surface-muted)] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
            opacity: indicator.ready ? 1 : 0,
          }}
        />

        {bottomNavigationItems.map((item, index) => (
          <BottomNavItem
            key={item.id}
            item={item}
            resolveLabel={resolveLabel}
            itemRef={(node) => {
              itemRefs.current[index] = node
            }}
          />
        ))}

        <button
          type="button"
          data-tour="nav-more"
          onClick={() => setMoreOpen(true)}
          aria-label={
            moreBadge > 0
              ? t('nav.moreServicesUnreadAria', { count: moreBadge > 9 ? '9+' : moreBadge })
              : t('nav.moreServicesAria')
          }
          aria-haspopup="dialog"
          className={`${BOTTOM_NAV_SLOT} relative text-[var(--app-text)]/72`}
        >
          <BottomNavIcon active={false} icon={FiGrid} />
          <BottomNavLabel>{t('nav.more')}</BottomNavLabel>
        </button>
      </nav>

      <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
