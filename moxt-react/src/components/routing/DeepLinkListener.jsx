import { useEffect } from 'react'
import { useStore } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setDeepLinkAuthReader, setDeepLinkNavigator, setDeepLinkStore } from '../../platform/deepLinks'

export function DeepLinkListener() {
  const navigate = useNavigate()
  const store = useStore()

  useEffect(() => {
    setDeepLinkNavigator(navigate)
    setDeepLinkStore(store)
    setDeepLinkAuthReader(() => store.getState().auth.user)
    return () => {
      setDeepLinkNavigator(null)
      setDeepLinkStore(null)
      setDeepLinkAuthReader(null)
    }
  }, [navigate, store])

  return null
}
