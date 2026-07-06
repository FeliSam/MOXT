import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { closeSidebar } from '../../features/ui/uiSlice'
import { useContentLifecycle } from '../../features/content/useContentLifecycle'
import { AppThemeScope } from './AppThemeScope'
import { BottomNavigation } from './BottomNavigation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const dispatch = useDispatch()
  const location = useLocation()
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)
  const messageParams = new URLSearchParams(location.search)
  const isMessagesRoute = location.pathname === '/messages'
  const isMessageThread =
    isMessagesRoute &&
    (messageParams.has('conversation') ||
      (messageParams.has('relatedType') && messageParams.has('relatedId')))
  useContentLifecycle()

  return (
    <div
      className={`text-[var(--app-text)] ${
        isMessagesRoute ? 'h-dvh overflow-hidden' : 'min-h-screen'
      }`}
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
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
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
        <Header hideOnMobile={isMessageThread} />
        <main
          id="main-content"
          tabIndex={-1}
          className={`mx-auto w-full min-w-0 max-w-[96rem] ${
            isMessagesRoute
              ? `min-h-0 flex-1 overflow-hidden ${
                  isMessageThread
                    ? 'max-lg:p-0 lg:px-8 lg:py-8'
                    : 'p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8'
                }`
              : 'p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8'
          }`}
        >
          <div key={location.pathname} className={isMessagesRoute ? 'page-enter h-full min-h-0 min-w-0' : 'page-enter min-w-0'}>
            <AppThemeScope className={isMessagesRoute ? 'h-full min-h-0' : ''}>
              <Outlet />
            </AppThemeScope>
          </div>
        </main>
      </div>
      <div className={isMessageThread ? 'hidden lg:block' : ''}>
        <BottomNavigation />
      </div>
    </div>
  )
}
