import { useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
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
  const guestMode = !user

  if (status === 'loading') {
    return <RouteLoadingScreen />
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
