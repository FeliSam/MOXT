import { Navigate, useSearchParams } from 'react-router-dom'

/** Redirection legacy — hub global Mes publications. */
export function MyListingsPage() {
  const [searchParams] = useSearchParams()
  const params = new URLSearchParams(searchParams)
  params.set('type', 'listing')
  const query = params.toString()
  return <Navigate to={`/publications/mine${query ? `?${query}` : ''}`} replace />
}
