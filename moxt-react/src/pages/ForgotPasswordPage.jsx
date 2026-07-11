import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { FiMail } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { authErrorToast } from '../features/auth/authErrorMessages'
import { authService } from '../features/auth/authService'
import { forgotPasswordSchema } from '../features/auth/authSchemas'
import { addToast } from '../features/ui/uiSlice'

export function ForgotPasswordPage() {
  const dispatch = useDispatch()
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, helpers) => {
      try {
        await authService.requestPasswordReset(values.email)
        setSent(true)
        setCooldown(60)
        dispatch(
          addToast({
            title: 'Demande enregistrée',
            message: 'Si un compte existe, un e-mail de récupération vous sera envoyé sous peu.',
            tone: 'success',
          }),
        )
      } catch (error) {
        dispatch(
          addToast(
            authErrorToast(
              'Envoi impossible',
              error instanceof Error ? error.message : 'Réessayez plus tard.',
            ),
          ),
        )
      } finally {
        helpers.setSubmitting(false)
      }
    },
  })

  return (
    <AuthCard
      eyebrow="MOXT · Récupération"
      title="Mot de passe oublié"
      description="Saisissez votre adresse e-mail. Pour votre sécurité, la réponse reste identique que le compte existe ou non."
      corner={<FiMail className="text-xl text-brand-600 dark:text-brand-300" aria-hidden="true" />}
    >
      {sent ? (
        <div className="auth-flow-panel mt-6 grid gap-4">
          <Alert variant="success" title="Vérifiez votre messagerie">
            Si cette adresse correspond à un compte MOXT, un lien de réinitialisation vient d'être envoyé.
            Pensez à consulter les courriers indésirables.
          </Alert>
          <p className="auth-flow-hint text-sm text-[var(--app-text-muted)]">
            Le lien expire après un court délai. Ouvrez-le sur le même appareil si possible.
          </p>
          <Button
            className="w-full"
            variant="secondary"
            type="button"
            disabled={cooldown > 0 || formik.isSubmitting}
            onClick={() => formik.handleSubmit()}
          >
            {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer un e-mail'}
          </Button>
          <Link className="auth-flow-link text-center" to="/login">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form className="auth-flow-panel mt-6 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
          <Input
            id="forgot-email"
            label="Adresse e-mail"
            type="email"
            autoComplete="email"
            placeholder="nom@example.com"
            iconLeft={<FiMail />}
            {...formik.getFieldProps('email')}
            error={formik.touched.email ? formik.errors.email : undefined}
          />
          <p className="auth-flow-hint text-xs text-[var(--app-text-muted)]">
            Compte créé uniquement par téléphone ? Connectez-vous par SMS ou contactez le support MOXT.
          </p>
          <Button className="w-full" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Envoi en cours…' : 'Recevoir un lien sécurisé'}
          </Button>
          <Link className="auth-flow-link-muted text-center" to="/login">
            Retour à la connexion
          </Link>
        </form>
      )}
    </AuthCard>
  )
}
