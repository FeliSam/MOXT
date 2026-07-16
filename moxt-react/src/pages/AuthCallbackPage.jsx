import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'
import { isEmailVerified } from '@moxt/shared/auth/userSecurity.js'
import { AuthCard } from '../components/auth/AuthCard'
import { Alert } from '../components/ui/Alert'
import { authService } from '../features/auth/authService'
import { applySession } from '../features/auth/authSlice'
import { addToast } from '../features/ui/uiSlice'
import { useDispatch } from 'react-redux'

/**
 * Consumes Supabase email confirmation / magic-link tokens from the URL,
 * then routes to Security (never /register) when the profile is already complete.
 */
export function AuthCallbackPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('Confirmation en cours…')

  useEffect(() => {
    let cancelled = false

    async function finish() {
      try {
        // Allow detectSessionInUrl / onAuthStateChange to settle first.
        await new Promise((resolve) => window.setTimeout(resolve, 150))
        let payload = await authService.refreshAuthSession()
        if (!payload?.user) {
          await new Promise((resolve) => window.setTimeout(resolve, 400))
          payload = await authService.refreshAuthSession()
        }
        if (cancelled) return

        if (payload?.user) {
          dispatch(applySession(payload))
        }

        const next = searchParams.get('next') || '/security'
        const safeNext =
          next.startsWith('/') && !next.startsWith('//') ? next : '/security'

        if (!payload?.user) {
          setMessage('Session introuvable. Connectez-vous pour continuer.')
          window.setTimeout(() => navigate('/login', { replace: true }), 1200)
          return
        }

        if (!isProfileComplete(payload.user)) {
          setMessage('Complétez votre profil pour continuer.')
          window.setTimeout(() => navigate('/register', { replace: true }), 800)
          return
        }

        const emailJustConfirmed = isEmailVerified(payload.user)
        dispatch(
          addToast({
            title: emailJustConfirmed ? 'E-mail confirmé' : 'Connexion réussie',
            message: emailJustConfirmed
              ? 'Votre adresse e-mail est vérifiée. Vous pouvez gérer la sécurité du compte.'
              : 'Votre session est active.',
            tone: 'success',
          }),
        )
        const target =
          safeNext === '/security' && emailJustConfirmed
            ? '/security?email=confirmed'
            : safeNext.includes('?')
              ? safeNext
              : emailJustConfirmed
                ? `${safeNext}?email=confirmed`
                : safeNext
        navigate(target, { replace: true })
      } catch (error) {
        if (cancelled) return
        setMessage(error?.message || 'Confirmation impossible.')
        window.setTimeout(() => navigate('/security', { replace: true }), 1500)
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [dispatch, navigate, searchParams])

  return (
    <AuthCard eyebrow="MOXT · Sécurité" title="Vérification du compte" description={message}>
      <Alert variant="info">Patientez quelques instants — redirection automatique.</Alert>
    </AuthCard>
  )
}
