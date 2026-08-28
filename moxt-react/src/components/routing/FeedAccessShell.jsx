import { useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import { AuthLoadingScreen } from '../layout/AuthLoadingScreen'

/** Fil accessible sans compte ; chrome app complet si connecté. */
export function FeedAccessShell() {
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)
  const guestMode = !user

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  const page = <Outlet context={{ guestMode }} />

  if (guestMode) {
    return page
  }

  return <AppLayout>{page}</AppLayout>
}
