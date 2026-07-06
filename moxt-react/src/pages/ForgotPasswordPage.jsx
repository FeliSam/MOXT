import { useFormik } from 'formik'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { authService } from '../features/auth/authService'
import { forgotPasswordSchema } from '../features/auth/authSchemas'
import { addToast } from '../features/ui/uiSlice'

export function ForgotPasswordPage() {
  const dispatch = useDispatch()
  const [sent, setSent] = useState(false)
  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, helpers) => {
      try {
        await authService.requestPasswordReset(values.email)
        setSent(true)
        dispatch(
          addToast({
            title: 'Demande enregistrée',
            message: 'Consultez votre messagerie pour poursuivre la récupération.',
            tone: 'success',
          }),
        )
      } catch (error) {
        dispatch(
          addToast({
            title: 'Envoi impossible',
            message: error.message,
            tone: 'error',
          }),
        )
      } finally {
        helpers.setSubmitting(false)
      }
    },
  })

  return (
    <AuthCard
      eyebrow="Recuperation"
      title="Mot de passe oublie"
      description="Saisissez votre adresse. Pour des raisons de securite, la reponse reste identique qu'un compte existe ou non."
    >
      {sent ? (
        <div className="mt-7 grid gap-5">
          <Alert variant="success" title="Demande enregistree">
            Si cette adresse correspond a un compte, un lien de recuperation sera envoye.
          </Alert>
          <Link
            className="text-center text-sm font-bold text-brand-700 dark:text-brand-300"
            to="/login"
          >
            Retour a la connexion
          </Link>
        </div>
      ) : (
        <form className="mt-7 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
          <Input
            id="forgot-email"
            label="Adresse email"
            type="email"
            {...formik.getFieldProps('email')}
            error={formik.touched.email ? formik.errors.email : undefined}
          />
          <Button className="w-full" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Envoi...' : 'Demander un lien'}
          </Button>
          <Link
            className="text-center text-sm font-bold text-brand-700 dark:text-brand-300"
            to="/login"
          >
            Retour a la connexion
          </Link>
        </form>
      )}
    </AuthCard>
  )
}
