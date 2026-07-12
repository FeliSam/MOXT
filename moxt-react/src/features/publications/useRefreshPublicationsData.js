import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { loadAllData } from '../../app/loadAllData'

/** Recharge les données distantes à l’ouverture d’une page publications (entreprise ou membre). */
export function useRefreshPublicationsData(scopeKey) {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadAllData())
  }, [dispatch, scopeKey])
}
