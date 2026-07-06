import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setDeepLinkNavigator } from '../../platform/deepLinks'

export function DeepLinkListener() {
  const navigate = useNavigate()

  useEffect(() => {
    setDeepLinkNavigator(navigate)
    return () => setDeepLinkNavigator(null)
  }, [navigate])

  return null
}
