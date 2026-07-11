import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import {
  hasSeenWelcome,
  isWelcomePending,
  markWelcomeSeen,
} from '../../features/onboarding/welcomeStorage'
import { WelcomeModal } from './WelcomeModal'

export function WelcomeGate() {
  const user = useSelector((state) => state.auth.user)
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setOpen(false)
      return
    }
    setOpen(isWelcomePending() && !hasSeenWelcome(user.id))
  }, [user?.id, location.pathname])

  function handleClose() {
    if (user?.id) markWelcomeSeen(user.id)
    setOpen(false)
  }

  if (!user) return null

  return <WelcomeModal open={open} onClose={handleClose} user={user} />
}
