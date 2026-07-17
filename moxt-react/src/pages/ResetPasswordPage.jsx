import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { FiLock, FiShield } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { PasswordInput } from '../components/ui/PasswordInput'
import { createAuthSchemas } from '../features/auth/authSchemas'
import { authService } from '../features/auth/authService'
import { clearSession } from '../features/auth/authSlice'
import { authErrorToast } from '../features/auth/authErrorMessages'
import { addToast } from '../features/ui/uiSlice'
import { supabase } from '../services/supabaseClient'
import { useLanguage } from '../contexts/useLanguage'

export function ResetPasswordPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const { resetPasswordSchema } = createAuthSchemas(t)

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
            title: t('auth.reset.toastSuccessTitle'),
            message: t('auth.reset.toastSuccessBody'),
            tone: 'success',
          }),
        )
        navigate('/login', {
          replace: true,
          state: { notice: t('auth.reset.loginNotice') },
        })
      } catch (error) {
        dispatch(
          addToast(
            authErrorToast(
              t('auth.reset.toastErrorTitle'),
              error instanceof Error ? error.message : t('auth.reset.toastErrorFallback'),
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

  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)

  if (invalidLink) {
    return (
      <AuthCard
        eyebrow={t('auth.reset.eyebrow')}
        title={t('auth.reset.invalidTitle')}
        description={t('auth.reset.invalidDescription')}
      >
        <div className="auth-flow-panel mt-6 grid gap-4">
          <Alert variant="warning">
            {t('auth.reset.invalidAlert')}
          </Alert>
          <Link className="auth-flow-link text-center" to="/forgot-password">
            {t('auth.reset.requestNewLink')}
          </Link>
          <Link className="auth-flow-link-muted text-center" to="/login">
            {t('auth.reset.backToLogin')}
          </Link>
        </div>
      </AuthCard>
    )
  }

  if (!ready) {
    return (
      <AuthCard
        eyebrow={t('auth.reset.eyebrow')}
        title={t('auth.reset.checkingTitle')}
        description={t('auth.reset.checkingDescription')}
      >
        <div className="auth-flow-panel mt-6 flex justify-center py-8">
          <span className="auth-flow-spinner" aria-hidden="true" />
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      eyebrow={t('auth.reset.eyebrow')}
      title={t('auth.reset.title')}
      description={t('auth.reset.description')}
      corner={<FiShield className="text-xl text-brand-600 dark:text-brand-300" aria-hidden="true" />}
    >
      <form className="auth-flow-panel mt-6 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
        <PasswordInput
          id="reset-password"
          label={t('auth.reset.password')}
          autoComplete="new-password"
          iconLeft={<FiLock />}
          {...formik.getFieldProps('password')}
          error={errorFor('password')}
        />
        <PasswordInput
          id="reset-password-confirm"
          label={t('auth.reset.confirmPassword')}
          autoComplete="new-password"
          iconLeft={<FiLock />}
          {...formik.getFieldProps('confirmPassword')}
          error={errorFor('confirmPassword')}
        />
        <p className="auth-flow-hint text-xs leading-relaxed text-[var(--app-text-muted)]">
          {t('auth.reset.passwordRules')}
        </p>
        <Button className="w-full" type="submit" loading={formik.isSubmitting}>
          {formik.isSubmitting ? t('auth.reset.submitting') : t('auth.reset.submit')}
        </Button>
        <Link className="auth-flow-link-muted text-center" to="/login">
          {t('auth.reset.backToLogin')}
        </Link>
      </form>
    </AuthCard>
  )
}
