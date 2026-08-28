import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  canPublishContent,
  isEmailVerified,
  isPhoneVerified,
  isValidRussianPhone,
} from '@moxt/shared/auth/userSecurity.js'
import { useSecurityGate } from '../security/useSecurityGate'

/** Actions publication post libre + statut (gate sécurité). */
export function useNewsPublishActions() {
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const { requirePublish } = useSecurityGate()
  const [showShareModal, setShowShareModal] = useState(false)
  const [statusComposerOpen, setStatusComposerOpen] = useState(false)

  function redirectIfEmailPending() {
    if (
      isPhoneVerified(user) &&
      isValidRussianPhone(user?.phone) &&
      !isEmailVerified(user)
    ) {
      navigate('/security?verify=email')
    }
  }

  function openStatusComposer() {
    if (canPublishContent(user)) {
      setStatusComposerOpen(true)
      return
    }
    requirePublish()
    redirectIfEmailPending()
  }

  function openComposer() {
    if (canPublishContent(user)) {
      setShowShareModal(true)
      return
    }
    requirePublish()
    redirectIfEmailPending()
  }

  return {
    user,
    showShareModal,
    setShowShareModal,
    statusComposerOpen,
    setStatusComposerOpen,
    openStatusComposer,
    openComposer,
  }
}
