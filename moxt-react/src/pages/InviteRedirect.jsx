import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'
import { storePendingInviteCode } from '../features/guest/guestNavigation'
import { applyPendingReferral } from '../features/referral/referralService'

export function InviteRedirect() {
  const { code } = useParams()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const status = useSelector((state) => state.auth.status)

  useEffect(() => {
    if (status === 'loading') return

    if (code) {
      storePendingInviteCode(code)
    }

    if (user && isProfileComplete(user)) {
      void applyPendingReferral().then(() => {
        navigate('/profile', { replace: true })
      })
      return
    }

    const invite = code ? `?invite=${encodeURIComponent(code)}` : ''
    navigate(`/register${invite}`, { replace: true })
  }, [code, navigate, status, user])

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] text-sm font-bold text-[var(--app-text-muted)]">
      Chargement de MOXT...
    </div>
  )
}
