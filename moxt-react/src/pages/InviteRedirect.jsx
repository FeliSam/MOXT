import { Navigate, useParams } from 'react-router-dom'
import { storePendingInviteCode } from '../features/guest/guestNavigation'

export function InviteRedirect() {
  const { code } = useParams()
  if (code) {
    storePendingInviteCode(code)
  }
  const invite = code ? `?invite=${encodeURIComponent(code)}` : ''
  return <Navigate to={`/register${invite}`} replace />
}
