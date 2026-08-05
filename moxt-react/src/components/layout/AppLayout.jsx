import { Outlet, useLocation, useSearchParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'

import { useEffect, useLayoutEffect } from 'react'

import { closeSidebar } from '../../features/ui/uiSlice'

import { useContentLifecycle } from '../../features/content/useContentLifecycle'

import { resyncViewportBottomGap, forceKeyboardClosed, useKeyboardInset } from '../../hooks/useKeyboardInset'

import { useMediaQuery } from '../../hooks/useMediaQuery'

import { resetMessagesScroll } from '../../hooks/useScrollToTopOnStep'

import { MessagesHeaderProvider } from '../../contexts/MessagesHeaderContext'

import { isMessageThreadOpen, isMessagesPath } from '../../pages/messages/messageRouteUtils'

import { AppThemeScope } from './AppThemeScope'

import { BottomNavigation } from './BottomNavigation'

import { Header } from './Header'

import { PullToRefreshIndicator } from './PullToRefreshIndicator'

import { Sidebar } from './Sidebar'

import { WelcomeGate } from '../onboarding/WelcomeGate'

import { PwaInstallBanner } from '../pwa/PwaInstallBanner'

import { PushPermissionBanner } from '../pwa/PushPermissionBanner'



export function AppLayout({ children }) {

  const dispatch = useDispatch()

  const location = useLocation()

  const [searchParams] = useSearchParams()

  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)

  const isMessagesRoute = isMessagesPath(location.pathname)

  const mobileViewport = useMediaQuery('(max-width: 1023px)')

  const isMessageThread = isMessagesRoute && isMessageThreadOpen(searchParams)

  /** Fil mobile ouvert : bottom nav masquée (URL = source unique). */
  const hideAppChrome = isMessageThread && mobileViewport
  /** Scroll lock + dvh : desktop messagerie uniquement (liste + détail mobile = catalogues). */
  const messagesScrollLock = isMessagesRoute && !mobileViewport
  const messagesFixedViewport = messagesScrollLock
  const isMessagesMobileDetail = isMessagesRoute && mobileViewport && hideAppChrome

  useContentLifecycle()

  useKeyboardInset()



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

    if (!messagesScrollLock) {
      root.classList.remove('messages-route-lock')
      return undefined
    }

    root.classList.add('messages-route-lock')
    resetMessagesScroll()
    return () => {
      root.classList.remove('messages-route-lock')
    }
  }, [messagesScrollLock])



  useLayoutEffect(() => {

    const root = document.documentElement

    root.classList.toggle('messages-thread-immersive', hideAppChrome)
    root.classList.toggle('messages-thread-detail', hideAppChrome)

    return () => {
      root.classList.remove('messages-thread-immersive')
      root.classList.remove('messages-thread-detail')
    }

  }, [hideAppChrome])

  /** Entrée détail mobile : état clavier propre (principe 2). */
  useLayoutEffect(() => {
    if (!isMessagesMobileDetail) return undefined
    forceKeyboardClosed(document.documentElement)
    return undefined
  }, [isMessagesMobileDetail])



  /** Retour liste mobile : resync agressif gap Safari + état clavier (piste 4). */
  useLayoutEffect(() => {
    if (!isMessagesRoute || hideAppChrome) return undefined

    function burst() {
      forceKeyboardClosed(document.documentElement)
      resyncViewportBottomGap()
    }

    burst()
    const raf1 = requestAnimationFrame(() => {
      burst()
      requestAnimationFrame(burst)
    })
    const timers = [80, 200, 450, 900].map((ms) => window.setTimeout(burst, ms))

    return () => {
      cancelAnimationFrame(raf1)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [hideAppChrome, isMessagesRoute])



  return (

    <MessagesHeaderProvider>

    <div

      className={`max-w-full min-w-0 overflow-x-clip text-[var(--app-text)] ${
        messagesFixedViewport
          ? 'messages-shell flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none'
          : hideAppChrome
            ? 'messages-shell flex h-[100svh] max-h-[100svh] flex-col overflow-hidden overscroll-none'
            : isMessagesRoute
              ? 'messages-shell flex min-h-[100svh] flex-col'
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

        className={`min-w-0 max-w-full overflow-x-clip lg:pl-28 ${
          isMessagesRoute ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''
        } ${messagesFixedViewport ? 'h-full' : ''}`}

      >

        <Header />

        <main

          id="main-content"

          tabIndex={-1}

          className={`mx-auto w-full min-w-0 max-w-[96rem] overflow-x-clip ${
            isMessagesRoute
              ? `flex min-h-0 flex-1 flex-col overflow-hidden ${
                  messagesFixedViewport ? 'overscroll-none' : ''
                } ${
                  hideAppChrome
                    ? 'max-lg:p-0 max-lg:pb-0 lg:px-8 lg:py-8'
                    : 'px-0 pt-0 pb-[var(--bottom-nav-clearance)] lg:px-8 lg:py-8'
                }`
              : 'p-4 pb-[var(--bottom-nav-clearance-loose)] sm:p-6 sm:pb-[var(--bottom-nav-clearance-loose)] lg:px-8 lg:py-8'
          }`}

        >

          <div

            key={location.pathname}

            className={
              isMessagesRoute
                ? `page-enter flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
                    messagesFixedViewport ? 'h-full' : ''
                  }`
                : 'page-enter min-w-0'
            }

          >

            <AppThemeScope

              className={
                isMessagesRoute
                  ? `flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
                      messagesFixedViewport ? 'h-full' : ''
                    }`
                  : ''
              }

            >

              {children ?? <Outlet />}

            </AppThemeScope>

          </div>

        </main>

      </div>

      {!hideAppChrome ? <BottomNavigation /> : null}

      <PullToRefreshIndicator disabled={hideAppChrome || isMessagesRoute} />

      <WelcomeGate />

      {hideAppChrome ? null : (

        <>

          <PwaInstallBanner />

          <PushPermissionBanner />

        </>

      )}

    </div>

    </MessagesHeaderProvider>

  )

}


