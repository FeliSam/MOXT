import { useDispatch } from 'react-redux'
import { FcGoogle } from 'react-icons/fc'
import { useSelector } from 'react-redux'
import { loginWithGoogle } from '../../features/auth/authSlice'

export function GoogleButton({
  className = '',
  label = 'Continuer avec Google',
}) {
  const dispatch = useDispatch()
  const status = useSelector((state) => state.auth.status)
  const loading = status === 'loading'

  async function handleClick() {
    await dispatch(loginWithGoogle())
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
