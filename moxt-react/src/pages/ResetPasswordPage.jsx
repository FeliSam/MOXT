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
  const [showOtpFallback, setShowOtpFallback] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpPassword, setOtpPassword] = useState('')
  const [otpConfirm, setOtpConfirm] = useState('')
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const { resetPasswordSchema } = createAuthSchemas(t)

  useEffect(() => {
    let cancelled = false

    async function ensureRecoverySession() {
      if (!supabase) {
        setInvalidLink(true)
        return
      }

      const search = window.location.search || ''
      const codeMatch = new URLSearchParams(search).get('code')
      if (codeMatch && typeof supabase.auth?.exchangeCodeForSession === 'function') {
        try {
          await supabase.auth.exchangeCodeForSession(codeMatch)
        } catch {
          // ignore error, will check getSession below
        }
      }

      const hash = window.location.hash || ''
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        await new Promise((resolve) => window.setTimeout(resolve, 150))
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

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (!otpEmail.includes('@')) {
      dispatch(addToast({ title: 'Erreur', message: 'Veuillez saisir une adresse e-mail valide.', tone: 'error' }))
      return
    }
    if (!/^\d{6}$/.test(otpCode.trim())) {
      dispatch(addToast({ title: 'Erreur', message: 'Saisissez le code à 6 chiffres reçu par e-mail.', tone: 'error' }))
      return
    }
    if (otpPassword.length < 8) {
      dispatch(addToast({ title: 'Erreur', message: t('auth.reset.passwordRules'), tone: 'error' }))
      return
    }
    if (otpPassword !== otpConfirm) {
      dispatch(addToast({ title: 'Erreur', message: t('auth.forgot.passwordMismatch') || 'Les mots de passe ne correspondent pas.', tone: 'error' }))
      return
    }

    try {
      setOtpSubmitting(true)
      await authService.confirmEmailPasswordReset({
        email: otpEmail.trim(),
        token: otpCode.trim(),
        password: otpPassword,
      })
      const { markIntentionalSignOut } = await import('../services/authSessionSync')
      markIntentionalSignOut()
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
      setOtpSubmitting(false)
    }
  }

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, helpers) => {
      try {
        await authService.updatePassword(values.password)
        const { markIntentionalSignOut } = await import('../services/authSessionSync')
        markIntentionalSignOut()
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
          {showOtpFallback ? (
            <form onSubmit={handleOtpSubmit} className="grid gap-3" noValidate>
              <input
                type="email"
                placeholder="Votre adresse e-mail"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                className="input-field rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                required
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Code à 6 chiffres"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-field rounded-xl border border-slate-300 px-3 py-2 text-sm tracking-widest dark:border-slate-700 dark:bg-slate-800"
                required
              />
              <PasswordInput
                id="otp-fallback-password"
                placeholder="Nouveau mot de passe (8+ car.)"
                value={otpPassword}
                onChange={(e) => setOtpPassword(e.target.value)}
                iconLeft={<FiLock />}
              />
              <PasswordInput
                id="otp-fallback-confirm"
                placeholder="Confirmez le mot de passe"
                value={otpConfirm}
                onChange={(e) => setOtpConfirm(e.target.value)}
                iconLeft={<FiLock />}
              />
              <Button type="submit" loading={otpSubmitting} className="w-full">
                Valider et changer le mot de passe
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowOtpFallback(true)}
              className="w-full text-xs"
            >
              Vous avez reçu un code à 6 chiffres par e-mail ?
            </Button>
          )}
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
