import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useLayoutEffect } from 'react'
import { closeSidebar } from '../../features/ui/uiSlice'
import { useContentLifecycle } from '../../features/content/useContentLifecycle'
import { AppThemeScope } from './AppThemeScope'
import { BottomNavigation } from './BottomNavigation'
import { Header } from './Header'
import { PullToRefreshIndicator } from './PullToRefreshIndicator'
import { Sidebar } from './Sidebar'
import { WelcomeGate } from '../onboarding/WelcomeGate'
import { PwaInstallBanner } from '../pwa/PwaInstallBanner'
import { PushPermissionBanner } from '../pwa/PushPermissionBanner'
import { useAppBadgeSync } from '../../hooks/useAppBadgeSync'

function isMessagesPath(pathname) {
  return pathname === '/messages' || pathname === '/messages/'
}

function hasOpenMessageThread(searchParams) {
  if (searchParams.get('conversation')) return true
  return Boolean(searchParams.get('relatedType') && searchParams.get('relatedId'))
}

export function AppLayout({ children }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const user = useSelector((state) => state.auth.user)
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)
  /** Set by MessagesPage when a thread is open on a small viewport */
  const messageThreadImmersive = useSelector((state) => state.ui.messageThreadImmersive)
  const isMessagesRoute = isMessagesPath(location.pathname)
  const isMessageThread = isMessagesRoute && hasOpenMessageThread(searchParams)
  /** Hide app chrome: URL thread (immediate) OR page-confirmed mobile immersion */
  const hideAppChrome = isMessageThread || messageThreadImmersive
  useContentLifecycle()
  useAppBadgeSync(user?.id)

  useLayoutEffect(() => {
    dispatch(closeSidebar())
  }, [dispatch, location.pathname])

  useEffect(() => {
    function onPageShow(event) {
      if (event.persisted) dispatch(closeSidebar())
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [dispatch])

  useLayoutEffect(() => {
    const root = document.documentElement
    if (!isMessagesRoute) {
      root.classList.remove('messages-route-lock')
      return undefined
    }
    root.classList.add('messages-route-lock')
    return () => {
      root.classList.remove('messages-route-lock')
    }
  }, [isMessagesRoute])

  return (
    <div
      className={`text-[var(--app-text)] ${
        isMessagesRoute
          ? 'messages-shell h-dvh max-h-dvh overflow-hidden overscroll-none'
          : 'min-h-screen'
      } ${hideAppChrome ? 'messages-thread-immersive' : ''}`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Aller au contenu
      </a>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[var(--z-nav-scrim)] bg-slate-950/50 lg:hidden"
          aria-label="Fermer la navigation"
          onClick={() => dispatch(closeSidebar())}
        />
      ) : null}
      <Sidebar open={sidebarOpen} />
      <div
        className={`lg:pl-28 ${
          isMessagesRoute ? 'flex h-full min-h-0 flex-col overflow-hidden' : ''
        }`}
      >
        {messageThreadImmersive ? null : isMessagesRoute ? (
          /* /messages: hide app Header on small screens (list + thread). Desktop keeps it. */
          <div className="hidden lg:block">
            <Header />
          </div>
        ) : (
          <Header />
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className={`mx-auto w-full min-w-0 max-w-[96rem] overflow-x-clip ${
            isMessagesRoute
              ? `flex min-h-0 flex-1 flex-col overflow-hidden overscroll-none ${
                  hideAppChrome
                    ? 'max-lg:p-0 lg:px-8 lg:py-8'
                    : 'px-0 pt-0 pb-[var(--bottom-nav-clearance)] sm:pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:px-8 lg:py-8'
                }`
              : 'p-4 pb-[var(--bottom-nav-clearance-loose)] sm:p-6 sm:pb-[var(--bottom-nav-clearance-loose)] lg:px-8 lg:py-8'
          }`}
        >
          <div
            key={location.pathname}
            className={
              isMessagesRoute
                ? 'page-enter flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
                : 'page-enter min-w-0'
            }
          >
            <AppThemeScope
              className={isMessagesRoute ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden' : ''}
            >
              {children ?? <Outlet />}
            </AppThemeScope>
          </div>
        </main>
      </div>
      {/* Bottom nav is mobile-only; never keep it mounted over an open thread */}
      {hideAppChrome ? null : <BottomNavigation />}
      <PullToRefreshIndicator disabled={hideAppChrome || isMessagesRoute} />
      <WelcomeGate />
      {messageThreadImmersive ? null : (
        <>
          <PwaInstallBanner />
          <PushPermissionBanner />
        </>
      )}
    </div>
  )
}
