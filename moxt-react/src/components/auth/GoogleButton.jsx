import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginWithGoogle } from '../../features/auth/authSlice'
import { supabase } from '../../services/supabaseClient'

/*
  mode="login"    (defaut) — connexion directe : utilise pour la page de
                   connexion ou un compte existe deja (le pays a deja ete
                   choisi a l'inscription).
  mode="identity" — OAuth Google puis retour sur /register pour completer
                   langue et pays d'origine.
*/
export function GoogleButton({
  className = '',
  label = 'Continuer avec Google',
  mode = 'login',
  to = '/dashboard',
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const status = useSelector((state) => state.auth.status)
  const [identityLoading, setIdentityLoading] = useState(false)
  const loading = mode === 'login' ? status === 'loading' : identityLoading

  async function handleClick() {
    if (mode === 'identity') {
      if (!supabase) return
      setIdentityLoading(true)
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/register?from=google` },
        })
        if (error) throw error
      } finally {
        setIdentityLoading(false)
      }
      return
    }
    const result = await dispatch(loginWithGoogle())
    if (loginWithGoogle.fulfilled.match(result)) navigate(to, { replace: true })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-input)] border border-[var(--app-border-md)] bg-[var(--app-surface)] text-sm font-bold text-[var(--app-text)] transition-all duration-[var(--transition-fast)] hover:-translate-y-px hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <span className="ds-spinner" style={{ width: 18, height: 18 }} aria-hidden="true" />
      ) : (
        <FcGoogle className="text-xl" aria-hidden="true" />
      )}
      {loading ? 'Connexion...' : label}
    </button>
  )
}
