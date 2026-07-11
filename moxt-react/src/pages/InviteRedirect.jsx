import { Navigate, useParams } from 'react-router-dom'

export function InviteRedirect() {
  const { code } = useParams()
  const invite = code ? `?invite=${encodeURIComponent(code)}` : ''
  return <Navigate to={`/register${invite}`} replace />
}
