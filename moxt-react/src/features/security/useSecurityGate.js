import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import {
  canCreateBusiness,
  canPublishContent,
  canPublishP2POffer,
  canUseTransferAccount,
  securityGateMessage,
} from '@moxt/shared/auth/userSecurity.js'
import { addToast } from '../ui/uiSlice'

export function useSecurityGate() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  const notifyBlocked = useCallback(
    (kind) => {
      dispatch(
        addToast({
          title: 'Vérification requise',
          message: securityGateMessage(kind, user),
          tone: 'warning',
        }),
      )
    },
    [dispatch, user],
  )

  const requirePublish = useCallback(() => {
    if (canPublishContent(user)) return true
    notifyBlocked('publish')
    return false
  }, [notifyBlocked, user])

  const requireP2PPublish = useCallback(() => {
    if (canPublishP2POffer(user)) return true
    notifyBlocked('p2p')
    return false
  }, [notifyBlocked, user])

  const requireBusiness = useCallback(() => {
    if (canCreateBusiness(user)) return true
    notifyBlocked('business')
    return false
  }, [notifyBlocked, user])

  const requireTransfer = useCallback(() => {
    if (canUseTransferAccount(user)) return true
    notifyBlocked('transfer')
    return false
  }, [notifyBlocked, user])

  return { user, requirePublish, requireP2PPublish, requireBusiness, requireTransfer }
}
