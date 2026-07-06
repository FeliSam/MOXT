import { Navigate, useSearchParams } from 'react-router-dom'

export function LegacyDetailRedirect({ fallback, parameter = 'id', target }) {
  const [searchParams] = useSearchParams()
  const id =
    searchParams.get(parameter) ||
    searchParams.get('itemId') ||
    searchParams.get('entityId') ||
    searchParams.get('transferId')

  return <Navigate to={id ? `${target}/${encodeURIComponent(id)}` : fallback} replace />
}
