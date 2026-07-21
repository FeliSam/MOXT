import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import {
  canAcceptP2POffer,
  canCreateBusiness,
  canPublishContent,
  canPublishP2POffer,
  canPublishVoyage,
  canUseTransferAccount,
  securityGateMessage,
} from '@moxt/shared/auth/userSecurity.js'
import { useLanguage } from '../../contexts/useLanguage'
import { sharedText } from '../../i18n/sharedI18n'
import { addToast } from '../ui/uiSlice'

export function useSecurityGate() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)

  const notifyBlocked = useCallback(
    (kind) => {
      dispatch(
        addToast({
          title: sharedText(t, 'shared.securityGate.toastTitle'),
          message: securityGateMessage(kind, user),
          tone: 'warning',
        }),
      )
    },
    [dispatch, t, user],
  )

  const requirePublish = useCallback(() => {
    if (canPublishContent(user)) return true
    notifyBlocked('publish')
    return false
  }, [notifyBlocked, user])

  const requireVoyagePublish = useCallback(() => {
    if (canPublishVoyage(user)) return true
    notifyBlocked('voyage')
    return false
  }, [notifyBlocked, user])

  const requireP2PPublish = useCallback(() => {
    if (canPublishP2POffer(user)) return true
    notifyBlocked('p2p')
    return false
  }, [notifyBlocked, user])

  const requireP2PAccept = useCallback(() => {
    if (canAcceptP2POffer(user)) return true
    notifyBlocked('p2pAccept')
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

  return {
    user,
    requirePublish,
    requireVoyagePublish,
    requireP2PPublish,
    requireP2PAccept,
    requireBusiness,
    requireTransfer,
  }
}
