import { useEffect } from 'react'
import { useStore } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setDeepLinkAuthReader, setDeepLinkNavigator } from '../../platform/deepLinks'

export function DeepLinkListener() {
  const navigate = useNavigate()
  const store = useStore()

  useEffect(() => {
    setDeepLinkNavigator(navigate)
    setDeepLinkAuthReader(() => store.getState().auth.user)
    return () => {
      setDeepLinkNavigator(null)
      setDeepLinkAuthReader(null)
    }
  }, [navigate, store])

  return null
}
