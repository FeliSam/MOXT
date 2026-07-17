import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiGrid } from 'react-icons/fi'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { bottomNavigationItems } from '../../config/bottomNavigation'
import { preloadRoute } from '../../config/navigation'
import { useLanguage } from '../../contexts/useLanguage'
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
          : 'text-[var(--app-text-muted)]'
      }`}
    >
      <Icon className="text-lg" aria-hidden="true" />
    </span>
  )
}

function BottomNavLabel({ children }) {
  return <span className={BOTTOM_NAV_LABEL}>{children}</span>
}

function BottomNavItem({ icon, label, path, translateLabel, itemRef }) {
  return (
    <NavLink
      ref={itemRef}
      to={path}
      end={path === '/dashboard'}
      onFocus={() => preloadRoute(path)}
      onMouseEnter={() => preloadRoute(path)}
      className={({ isActive }) =>
        `${BOTTOM_NAV_SLOT} ${
          isActive ? 'nav-item-active-bottom text-[var(--app-accent)] dark:text-[var(--app-teal)]' : 'text-[var(--app-text-muted)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <BottomNavIcon active={isActive} icon={icon} />
          <BottomNavLabel>{translateLabel(label)}</BottomNavLabel>
        </>
      )}
    </NavLink>
  )
}

export function BottomNavigation() {
  const { t, translateLabel } = useLanguage()
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
        className="bottom-nav-shell z-[var(--z-nav)] grid grid-cols-5 gap-0.5 rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface)]/94 shadow-[var(--shadow-float)] backdrop-blur-xl lg:hidden"
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
            {...item}
            translateLabel={translateLabel}
            itemRef={(node) => {
              itemRefs.current[index] = node
            }}
          />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label={
            moreBadge > 0
              ? t('nav.moreServicesUnreadAria', { count: moreBadge > 9 ? '9+' : moreBadge })
              : t('nav.moreServicesAria')
          }
          aria-haspopup="dialog"
          className={`${BOTTOM_NAV_SLOT} relative text-[var(--app-text-muted)]`}
        >
          <BottomNavIcon active={false} icon={FiGrid} />
          {moreBadge > 0 ? (
            <span className="absolute right-2 top-1 min-w-[1.1rem] rounded-full bg-red-500 px-1 py-0.5 text-center text-[9px] font-bold leading-none text-white">
              {moreBadge > 9 ? '9+' : moreBadge}
            </span>
          ) : null}
          <BottomNavLabel>{translateLabel('Plus')}</BottomNavLabel>
        </button>
      </nav>

      <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
