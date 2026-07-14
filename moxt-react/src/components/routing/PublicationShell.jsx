import { useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import { AuthLoadingScreen } from '../layout/AuthLoadingScreen'
import { PublicSiteLayout } from '../layout/PublicSiteLayout'
import { GuestPreviewBanner } from '../../features/guest/GuestPreviewBanner'

export function PublicationShell() {
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)
  const guestMode = !user

  if (status === 'loading') {
    return <AuthLoadingScreen />
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
