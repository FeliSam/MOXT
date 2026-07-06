import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { expireEvents } from '../events/eventSlice'
import { expireJobs } from '../jobs/jobSlice'
import { expireListings } from '../marketplace/marketplaceSlice'

export function useContentLifecycle() {
  const dispatch = useDispatch()

  useEffect(() => {
    const now = new Date().toISOString()
    dispatch(expireListings(now))
    dispatch(expireJobs(now))
    dispatch(expireEvents(now))
  }, [dispatch])
}
