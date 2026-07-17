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
import { OTP_RESEND_COOLDOWN_SECONDS } from '@moxt/shared/auth/otpCooldown.js'
import { useLanguage } from '../contexts/useLanguage'
import { createAuthSchemas } from '../features/auth/authSchemas'
import { addToast } from '../features/ui/uiSlice'

export function ForgotPasswordPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const { forgotPasswordSchema } = createAuthSchemas(t)

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
        setCooldown(OTP_RESEND_COOLDOWN_SECONDS)
        dispatch(
          addToast({
            title: t('auth.forgot.toastSuccessTitle'),
            message: t('auth.forgot.toastSuccessBody'),
            tone: 'success',
          }),
        )
      } catch (error) {
        dispatch(
          addToast(
            authErrorToast(
              t('auth.forgot.toastErrorTitle'),
              error instanceof Error ? error.message : t('auth.forgot.toastErrorFallback'),
              'error',
              t,
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
      eyebrow={t('auth.forgot.eyebrow')}
      title={t('auth.forgot.title')}
      description={t('auth.forgot.description')}
      corner={<FiMail className="text-xl text-brand-600 dark:text-brand-300" aria-hidden="true" />}
    >
      {sent ? (
        <div className="auth-flow-panel mt-6 grid gap-4">
          <Alert variant="success" title={t('auth.forgot.sentTitle')}>
            {t('auth.forgot.sentBody')}
          </Alert>
          <p className="auth-flow-hint text-sm text-[var(--app-text-muted)]">
            {t('auth.forgot.sentHint')}
          </p>
          <Button
            className="w-full"
            variant="secondary"
            type="button"
            disabled={cooldown > 0 || formik.isSubmitting}
            onClick={() => formik.handleSubmit()}
          >
            {cooldown > 0
              ? t('auth.forgot.resendCooldown', { seconds: cooldown })
              : t('auth.forgot.resend')}
          </Button>
          <Link className="auth-flow-link text-center" to="/login">
            {t('auth.forgot.backToLogin')}
          </Link>
        </div>
      ) : (
        <form className="auth-flow-panel mt-6 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
          <Input
            id="forgot-email"
            label={t('auth.forgot.email')}
            type="email"
            autoComplete="email"
            placeholder="nom@example.com"
            iconLeft={<FiMail />}
            {...formik.getFieldProps('email')}
            error={formik.touched.email ? formik.errors.email : undefined}
          />
          <p className="auth-flow-hint text-xs text-[var(--app-text-muted)]">
            {t('auth.forgot.phoneAccountHint')}
          </p>
          <Button className="w-full" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
          </Button>
          <Link className="auth-flow-link-muted text-center" to="/login">
            {t('auth.forgot.backToLogin')}
          </Link>
        </form>
      )}
    </AuthCard>
  )
}
