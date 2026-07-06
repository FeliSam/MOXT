import { useState } from 'react'
import { FiGrid } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'
import { bottomNavigationItems } from '../../config/bottomNavigation'
import { preloadRoute } from '../../config/navigation'
import { useLanguage } from '../../contexts/useLanguage'
import { MobileMoreDrawer } from './MobileMoreDrawer'

const BOTTOM_NAV_SLOT =
  'flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-all duration-[var(--transition-fast)] active:scale-[0.98]'

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

function BottomNavItem({ icon, label, path, translateLabel }) {
  return (
    <NavLink
      to={path}
      end={path === '/dashboard'}
      onFocus={() => preloadRoute(path)}
      onMouseEnter={() => preloadRoute(path)}
      className={({ isActive }) =>
        `${BOTTOM_NAV_SLOT} ${
          isActive
            ? 'nav-item-active-bottom'
            : 'text-[var(--app-text-muted)]'
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
  const { translateLabel } = useLanguage()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-0.5 rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface)]/94 p-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-float)] backdrop-blur-xl lg:hidden"
        aria-label="Navigation mobile rapide"
      >
        {bottomNavigationItems.map((item) => (
          <BottomNavItem key={item.id} {...item} translateLabel={translateLabel} />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Plus de services"
          aria-haspopup="dialog"
          className={`${BOTTOM_NAV_SLOT} text-[var(--app-text-muted)]`}
        >
          <BottomNavIcon active={false} icon={FiGrid} />
          <BottomNavLabel>{translateLabel('Plus')}</BottomNavLabel>
        </button>
      </nav>

      <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
