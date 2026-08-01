import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { FiHelpCircle, FiLock, FiMail, FiPhone } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { OTP_RESEND_COOLDOWN_SECONDS } from '@moxt/shared/auth/otpCooldown.js'
import { isValidRussianPhone } from '@moxt/shared/auth/userSecurity.js'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthLoginHelpModal } from '../components/auth/AuthLoginHelpModal'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { constrainPhone } from '../config/phone'
import { flagEmoji } from '../config/flags'
import { useLanguage } from '../contexts/useLanguage'
import { authErrorToast } from '../features/auth/authErrorMessages'
import { authService } from '../features/auth/authService'
import { createAuthSchemas } from '../features/auth/authSchemas'
import { addToast } from '../features/ui/uiSlice'

const MODES = [
  { id: 'email', labelKey: 'auth.forgot.modeEmail', icon: FiMail },
  { id: 'phone', labelKey: 'auth.forgot.modePhone', icon: FiPhone },
]

export function ForgotPasswordPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'phone' ? 'phone' : 'email'
  const [mode, setMode] = useState(initialMode)
  const [sent, setSent] = useState(false)
  const [phoneStep, setPhoneStep] = useState('request') // request | confirm | done
  const [cooldown, setCooldown] = useState(0)
  const [pendingPhone, setPendingPhone] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const { forgotPasswordSchema } = createAuthSchemas(t)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const emailFormik = useFormik({
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

  const phoneRequestFormik = useFormik({
    initialValues: { phone: '+7' },
    onSubmit: async (values, helpers) => {
      const phone = constrainPhone(values.phone, '+7', 10)
      if (!isValidRussianPhone(phone)) {
        helpers.setFieldError('phone', t('auth.forgot.phoneInvalid'))
        helpers.setSubmitting(false)
        return
      }
      try {
        const result = await authService.requestPhonePasswordReset(phone)
        setPendingPhone(result.phone)
        setPhoneStep('confirm')
        setCooldown(OTP_RESEND_COOLDOWN_SECONDS)
        dispatch(
          addToast({
            title: t('auth.forgot.phoneCodeSentTitle'),
            message: t('auth.forgot.phoneCodeSentBody', { phone: result.phone }),
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

  const phoneConfirmFormik = useFormik({
    initialValues: { code: '', password: '', confirmPassword: '' },
    onSubmit: async (values, helpers) => {
      if (values.password !== values.confirmPassword) {
        helpers.setFieldError('confirmPassword', t('auth.forgot.passwordMismatch'))
        helpers.setSubmitting(false)
        return
      }
      if (String(values.password || '').length < 8) {
        helpers.setFieldError('password', t('auth.reset.passwordRules'))
        helpers.setSubmitting(false)
        return
      }
      if (!/^\d{6}$/.test(String(values.code || '').trim())) {
        helpers.setFieldError('code', t('auth.forgot.phoneCodeInvalid'))
        helpers.setSubmitting(false)
        return
      }
      try {
        await authService.confirmPhonePasswordReset({
          phone: pendingPhone,
          token: values.code.trim(),
          password: values.password,
        })
        setPhoneStep('done')
        dispatch(
          addToast({
            title: t('auth.reset.toastSuccessTitle'),
            message: t('auth.reset.toastSuccessBody'),
            tone: 'success',
          }),
        )
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

  function switchMode(next) {
    setMode(next)
    setSent(false)
    setPhoneStep('request')
    setPendingPhone('')
    setCooldown(0)
  }

  return (
    <AuthCard
      eyebrow={t('auth.forgot.eyebrow')}
      title={t('auth.forgot.title')}
      description={
        mode === 'phone' ? t('auth.forgot.phoneDescription') : t('auth.forgot.description')
      }
      corner={
        mode === 'phone' ? (
          <FiPhone className="text-xl text-brand-600 dark:text-brand-300" aria-hidden="true" />
        ) : (
          <FiMail className="text-xl text-brand-600 dark:text-brand-300" aria-hidden="true" />
        )
      }
    >
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-1">
        {MODES.map((item) => {
          const Icon = item.icon
          const active = mode === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchMode(item.id)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                active
                  ? 'bg-[var(--app-surface)] text-brand-700 shadow-sm dark:text-brand-300'
                  : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
              }`}
            >
              <Icon className="text-sm" />
              {t(item.labelKey)}
            </button>
          )
        })}
      </div>

      {mode === 'email' ? (
        sent ? (
          <div className="auth-flow-panel mt-4 grid gap-4">
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
              disabled={cooldown > 0 || emailFormik.isSubmitting}
              onClick={() => emailFormik.handleSubmit()}
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
          <form
            className="auth-flow-panel mt-4 grid gap-4"
            onSubmit={emailFormik.handleSubmit}
            noValidate
          >
            <Input
              id="forgot-email"
              label={t('auth.forgot.email')}
              type="email"
              autoComplete="email"
              placeholder="nom@example.com"
              iconLeft={<FiMail />}
              {...emailFormik.getFieldProps('email')}
              error={emailFormik.touched.email ? emailFormik.errors.email : undefined}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className="auth-flow-link inline-flex items-center gap-1 text-xs"
                onClick={() => setHelpOpen(true)}
              >
                <FiHelpCircle className="text-sm" /> {t('auth.login.needHelp')}
              </button>
            </div>
            <Button className="w-full" type="submit" disabled={emailFormik.isSubmitting}>
              {emailFormik.isSubmitting ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
            </Button>
            <Link className="auth-flow-link-muted text-center" to="/login">
              {t('auth.forgot.backToLogin')}
            </Link>
          </form>
        )
      ) : null}

      {mode === 'phone' && phoneStep === 'done' ? (
        <div className="auth-flow-panel mt-4 grid gap-4">
          <Alert variant="success" title={t('auth.reset.toastSuccessTitle')}>
            {t('auth.forgot.phoneDoneBody')}
          </Alert>
          <Link className="auth-flow-link text-center" to="/login">
            {t('auth.forgot.backToLogin')}
          </Link>
        </div>
      ) : null}

      {mode === 'phone' && phoneStep === 'request' ? (
        <form
          className="auth-flow-panel mt-4 grid gap-4"
          onSubmit={phoneRequestFormik.handleSubmit}
          noValidate
        >
          <Input
            id="forgot-phone"
            label={t('auth.forgot.phoneLabel')}
            type="tel"
            autoComplete="tel"
            placeholder="+7XXXXXXXXXX"
            iconLeft={<span className="text-base leading-none">{flagEmoji('RU')}</span>}
            value={phoneRequestFormik.values.phone}
            onChange={(event) =>
              phoneRequestFormik.setFieldValue(
                'phone',
                constrainPhone(event.target.value, '+7', 10),
              )
            }
            onBlur={phoneRequestFormik.handleBlur}
            error={phoneRequestFormik.touched.phone ? phoneRequestFormik.errors.phone : undefined}
          />
          <p className="auth-flow-hint text-xs text-[var(--app-text-muted)]">
            {t('auth.forgot.phoneHint')}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="auth-flow-link inline-flex items-center gap-1 text-xs"
              onClick={() => setHelpOpen(true)}
            >
              <FiHelpCircle className="text-sm" /> {t('auth.login.needHelp')}
            </button>
          </div>
          <Button className="w-full" type="submit" loading={phoneRequestFormik.isSubmitting}>
            {phoneRequestFormik.isSubmitting
              ? t('auth.forgot.phoneSending')
              : t('auth.forgot.phoneSubmit')}
          </Button>
          <Link className="auth-flow-link-muted text-center" to="/login">
            {t('auth.forgot.backToLogin')}
          </Link>
        </form>
      ) : null}

      {mode === 'phone' && phoneStep === 'confirm' ? (
        <form
          className="auth-flow-panel mt-4 grid gap-4"
          onSubmit={phoneConfirmFormik.handleSubmit}
          noValidate
        >
          <Alert variant="info" title={t('auth.forgot.phoneCodeSentTitle')}>
            {t('auth.forgot.phoneCodeSentBody', { phone: pendingPhone })}
          </Alert>
          <Input
            id="forgot-phone-code"
            label={t('auth.forgot.phoneCodeLabel')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={phoneConfirmFormik.values.code}
            onChange={(event) =>
              phoneConfirmFormik.setFieldValue(
                'code',
                event.target.value.replace(/\D/g, '').slice(0, 6),
              )
            }
            error={phoneConfirmFormik.touched.code ? phoneConfirmFormik.errors.code : undefined}
          />
          <PasswordInput
            id="forgot-phone-password"
            label={t('auth.reset.password')}
            autoComplete="new-password"
            iconLeft={<FiLock />}
            {...phoneConfirmFormik.getFieldProps('password')}
            error={
              phoneConfirmFormik.touched.password ? phoneConfirmFormik.errors.password : undefined
            }
          />
          <PasswordInput
            id="forgot-phone-confirm"
            label={t('auth.reset.confirmPassword')}
            autoComplete="new-password"
            iconLeft={<FiLock />}
            {...phoneConfirmFormik.getFieldProps('confirmPassword')}
            error={
              phoneConfirmFormik.touched.confirmPassword
                ? phoneConfirmFormik.errors.confirmPassword
                : undefined
            }
          />
          <p className="auth-flow-hint text-xs text-[var(--app-text-muted)]">
            {t('auth.reset.passwordRules')}
          </p>
          <Button className="w-full" type="submit" loading={phoneConfirmFormik.isSubmitting}>
            {phoneConfirmFormik.isSubmitting
              ? t('auth.reset.submitting')
              : t('auth.forgot.phoneConfirmSubmit')}
          </Button>
          <Button
            className="w-full"
            variant="secondary"
            type="button"
            disabled={cooldown > 0 || phoneRequestFormik.isSubmitting}
            onClick={() => phoneRequestFormik.handleSubmit()}
          >
            {cooldown > 0
              ? t('auth.forgot.resendCooldown', { seconds: cooldown })
              : t('auth.forgot.phoneResend')}
          </Button>
          <button
            type="button"
            className="text-center text-sm font-bold text-[var(--app-text-muted)] underline-offset-2 hover:underline"
            onClick={() => {
              setPhoneStep('request')
              setPendingPhone('')
            }}
          >
            {t('auth.forgot.phoneChangeNumber')}
          </button>
        </form>
      ) : null}

      <AuthLoginHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} t={t} />
    </AuthCard>
  )
}
