import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { FiLock, FiShield } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { PasswordInput } from '../components/ui/PasswordInput'
import { resetPasswordSchema } from '../features/auth/authSchemas'
import { authService } from '../features/auth/authService'
import { clearSession } from '../features/auth/authSlice'
import { authErrorToast } from '../features/auth/authErrorMessages'
import { addToast } from '../features/ui/uiSlice'
import { supabase } from '../services/supabaseClient'

export function ResetPasswordPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function ensureRecoverySession() {
      if (!supabase) {
        setInvalidLink(true)
        return
      }

      const hash = window.location.hash || ''
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        await new Promise((resolve) => window.setTimeout(resolve, 120))
      }

      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (data.session) {
        setReady(true)
        return
      }

      setInvalidLink(true)
    }

    ensureRecoverySession()
    return () => {
      cancelled = true
    }
  }, [])

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, helpers) => {
      try {
        await authService.updatePassword(values.password)
        await supabase?.auth.signOut()
        dispatch(clearSession())
        dispatch(
          addToast({
            title: 'Mot de passe mis à jour',
            message: 'Connectez-vous avec votre nouveau mot de passe.',
            tone: 'success',
          }),
        )
        navigate('/login', {
          replace: true,
          state: { notice: 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.' },
        })
      } catch (error) {
        dispatch(
          addToast(
            authErrorToast(
              'Réinitialisation impossible',
              error instanceof Error ? error.message : 'Réessayez plus tard.',
            ),
          ),
        )
      } finally {
        helpers.setSubmitting(false)
      }
    },
  })

  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)

  if (invalidLink) {
    return (
      <AuthCard
        eyebrow="Sécurité"
        title="Lien expiré ou invalide"
        description="Demandez un nouveau lien de réinitialisation depuis la page de connexion."
      >
        <div className="auth-flow-panel mt-6 grid gap-4">
          <Alert variant="warning">
            Ce lien n'est plus valide. Les liens de récupération expirent après un court délai.
          </Alert>
          <Link className="auth-flow-link text-center" to="/forgot-password">
            Demander un nouveau lien
          </Link>
          <Link className="auth-flow-link-muted text-center" to="/login">
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    )
  }

  if (!ready) {
    return (
      <AuthCard eyebrow="Sécurité" title="Vérification du lien…" description="Un instant, nous sécurisons votre accès.">
        <div className="auth-flow-panel mt-6 flex justify-center py-8">
          <span className="auth-flow-spinner" aria-hidden="true" />
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow="Sécurité"
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe fort que vous n'utilisez nulle part ailleurs."
      corner={<FiShield className="text-xl text-brand-600 dark:text-brand-300" aria-hidden="true" />}
    >
      <form className="auth-flow-panel mt-6 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
        <PasswordInput
          id="reset-password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          iconLeft={<FiLock />}
          {...formik.getFieldProps('password')}
          error={errorFor('password')}
        />
        <PasswordInput
          id="reset-password-confirm"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          iconLeft={<FiLock />}
          {...formik.getFieldProps('confirmPassword')}
          error={errorFor('confirmPassword')}
        />
        <p className="auth-flow-hint text-xs leading-relaxed text-[var(--app-text-muted)]">
          Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.
        </p>
        <Button className="w-full" type="submit" loading={formik.isSubmitting}>
          {formik.isSubmitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
        </Button>
        <Link className="auth-flow-link-muted text-center" to="/login">
          Retour à la connexion
        </Link>
      </form>
    </AuthCard>
  )
}
