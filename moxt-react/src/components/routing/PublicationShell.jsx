import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { storeReturnTo } from '../../features/guest/guestNavigation'
import { AppLayout } from '../layout/AppLayout'
import { PublicSiteLayout } from '../layout/PublicSiteLayout'
import { GuestPreviewBanner } from '../../features/guest/GuestPreviewBanner'

function RouteLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] text-sm font-bold text-[var(--app-text-muted)]">
      Chargement de MOXT...
    </div>
  )
}

export function PublicationShell() {
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)
  const location = useLocation()
  const guestMode = !user

  if (status === 'loading') {
    return <RouteLoadingScreen />
  }

  const userProfileMatch = location.pathname.match(/^\/users\/([^/]+)\/publications\/?$/i)
  if (status === 'anonymous' && userProfileMatch) {
    const returnTo = `${location.pathname}${location.search}`
    storeReturnTo(returnTo)
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  const page = (
    <>
      {guestMode ? <GuestPreviewBanner /> : null}
      <Outlet context={{ guestMode }} />
    </>
  )

  if (guestMode) {
    return <PublicSiteLayout>{page}</PublicSiteLayout>
  }

  return <AppLayout>{page}</AppLayout>
}
