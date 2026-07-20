import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  clearTourPreview,
  hasSeenWelcome,
  isTourPreview,
  isWelcomePending,
  markWelcomeSeen,
  TOUR_PREVIEW_EVENT,
} from '../../features/onboarding/welcomeStorage'
import { ProductTour } from './ProductTour'

export function WelcomeGate() {
  const user = useSelector((state) => state.auth.user)
  const [dismissedWelcomeFor, setDismissedWelcomeFor] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(() => isTourPreview())

  useEffect(() => {
    function onPreview() {
      setPreviewOpen(true)
    }
    window.addEventListener(TOUR_PREVIEW_EVENT, onPreview)
    return () => window.removeEventListener(TOUR_PREVIEW_EVENT, onPreview)
  }, [])

  if (!user?.id) return null

  const welcomeOpen =
    dismissedWelcomeFor !== user.id &&
    isWelcomePending() &&
    !hasSeenWelcome(user.id)
  const open = welcomeOpen || previewOpen

  function handleClose() {
    if (welcomeOpen) {
      markWelcomeSeen(user.id)
      setDismissedWelcomeFor(user.id)
    }
    clearTourPreview()
    setPreviewOpen(false)
  }

  return <ProductTour open={open} onClose={handleClose} user={user} />
}
