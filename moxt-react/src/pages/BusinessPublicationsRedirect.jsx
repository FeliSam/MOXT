import { Navigate, useParams, useSearchParams } from 'react-router-dom'

const CONTENT_TYPE_MAP = {
  listings: 'listing',
  jobs: 'job',
  events: 'event',
  parcels: 'parcel',
}

export function BusinessPublicationsRedirect() {
  const { businessId, contentType } = useParams()
  const [searchParams] = useSearchParams()
  const params = new URLSearchParams(searchParams)
  params.delete('view')
  const mappedType = CONTENT_TYPE_MAP[contentType]
  if (mappedType && mappedType !== 'listing') {
    params.set('type', mappedType)
  } else {
    params.delete('type')
  }
  const query = params.toString()
  return <Navigate to={`/businesses/${businessId}${query ? `?${query}` : ''}`} replace />
}
