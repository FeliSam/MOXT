import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { addToast } from '../ui/uiSlice'

function buildReturnTo(location) {
  return encodeURIComponent(`${location.pathname}${location.search}`)
}

export function useGuestAction() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const outletContext = useOutletContext() || {}
  const guestMode = Boolean(outletContext.guestMode)

  const promptAccount = useCallback(
    (intent = 'interagir') => {
      const returnTo = buildReturnTo(location)
      dispatch(
        addToast({
          title: 'Compte requis',
          message: `Créez un compte MOXT pour ${intent} avec ce profil.`,
          tone: 'info',
        }),
      )
      navigate(`/register?returnTo=${returnTo}`)
    },
    [dispatch, location, navigate],
  )

  const requireAccount = useCallback(
    (intent = 'interagir') => {
      if (!guestMode) return false
      promptAccount(intent)
      return true
    },
    [guestMode, promptAccount],
  )

  return { guestMode, requireAccount, promptAccount }
}
