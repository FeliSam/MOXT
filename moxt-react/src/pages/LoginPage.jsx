import { clearPendingRegistration } from '@moxt/shared/auth/pendingRegistration.js'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { FiLock, FiMail, FiPhone } from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { flagEmoji } from '../config/flags'
import { constrainPhone } from '../config/phone'
import { useLanguage } from '../contexts/useLanguage'
import { authErrorToast } from '../features/auth/authErrorMessages'
import { clearAuthError, login } from '../features/auth/authSlice'
import { createAuthSchemas } from '../features/auth/authSchemas'
import { addToast } from '../features/ui/uiSlice'
import { resolveReturnTo, clearReturnTo } from '../features/guest/guestNavigation'

const LOGIN_MODES = [
  { id: 'phone-password', labelKey: 'auth.login.modePhonePassword', icon: FiPhone },
  { id: 'email', labelKey: 'auth.login.modeEmail', icon: FiMail },
]

function finishLogin(dispatch, store, navigate, location, searchParams) {
  const destination = resolveReturnTo(searchParams, location.state)
  clearReturnTo()
  navigate(destination, { replace: true })

  // Imports lourds hors du chunk Login — ne bloquent ni l'ouverture ni la navigation.
  void import('../app/loadAllData').then(({ loadAllData }) => {
    dispatch(loadAllData())
  })
  void import('../services/realtimeService').then(({ startRealtimeSubscription }) => {
    const userId = store.getState().auth.user?.id
    if (userId) startRealtimeSubscription(userId, dispatch, store.getState)
  })
}

export function LoginPage() {
  const dispatch = useDispatch()
  const store = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { t } = useLanguage()
  const { error } = useSelector((state) => state.auth)

  const [mode, setMode] = useState('phone-password')
  const { loginEmailSchema, loginPhonePasswordSchema } = createAuthSchemas(t)

  useEffect(() => () => dispatch(clearAuthError()), [dispatch])

  // Abandon in-progress signup OTP when arriving on login (register → Se connecter).
  useEffect(() => {
    clearPendingRegistration()
  }, [])

  useEffect(() => {
    if (!error) return
    dispatch(addToast(authErrorToast(t('auth.login.errorTitle'), error, 'error', t)))
    dispatch(clearAuthError())
  }, [dispatch, error, t])

  function switchMode(nextMode) {
    setMode(nextMode)
    dispatch(clearAuthError())
  }

  const emailFormik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginEmailSchema,
    onSubmit: async (values) => {
      const result = await dispatch(login({ identifier: values.email.trim(), password: values.password }))
      if (login.fulfilled.match(result)) {
        finishLogin(dispatch, store, navigate, location, searchParams)
      }
    },
  })

  const phoneFormik = useFormik({
    initialValues: { phone: '+7', password: '' },
    validationSchema: loginPhonePasswordSchema,
    onSubmit: async (values) => {
      const result = await dispatch(login({ identifier: values.phone, password: values.password }))
      if (login.fulfilled.match(result)) {
        finishLogin(dispatch, store, navigate, location, searchParams)
      }
    },
  })

  const emailError = (field) => (emailFormik.touched[field] ? emailFormik.errors[field] : undefined)
  const phoneError = (field) => (phoneFormik.touched[field] ? phoneFormik.errors[field] : undefined)

  return (
    <AuthCard
      eyebrow={t('auth.login.eyebrow')}
      title={t('auth.login.title')}
      titleClassName="max-sm:hidden"
      description={t('auth.login.description')}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {LOGIN_MODES.map((item) => {
          const Icon = item.icon
          const active = mode === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchMode(item.id)}
              className={`auth-mode-tab ${active ? 'auth-mode-tab--active' : ''}`}
            >
              <Icon className="shrink-0 text-sm" aria-hidden="true" />
              {t(item.labelKey)}
            </button>
          )
        })}
      </div>

      {location.state?.notice ? (
        <Alert className="mt-4" variant="success">
          {location.state.notice}
        </Alert>
      ) : null}

      {mode === 'phone-password' ? (
        <form className="auth-flow-panel mt-4 grid gap-4" onSubmit={phoneFormik.handleSubmit} noValidate>
          <Input
            id="login-phone-password"
            label={t('auth.login.phoneLabel')}
            type="tel"
            autoComplete="tel"
            placeholder="+7XXXXXXXXXX"
            iconLeft={<span className="text-base leading-none">{flagEmoji('RU')}</span>}
            {...phoneFormik.getFieldProps('phone')}
            onChange={(event) =>
              phoneFormik.setFieldValue('phone', constrainPhone(event.target.value, '+7', 10))
            }
            error={phoneError('phone')}
          />
          <PasswordInput
            id="login-phone-password-field"
            label={t('auth.login.password')}
            autoComplete="current-password"
            iconLeft={<FiLock />}
            {...phoneFormik.getFieldProps('password')}
            error={phoneError('password')}
          />
          <p className="auth-flow-hint text-xs text-[var(--app-text-muted)]">
            {t('auth.login.phoneHint')}
          </p>
          <Button className="w-full" type="submit" loading={phoneFormik.isSubmitting}>
            {phoneFormik.isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
      ) : null}

      {mode === 'email' ? (
        <form className="auth-flow-panel mt-4 grid gap-4" onSubmit={emailFormik.handleSubmit} noValidate>
          <Input
            id="login-email"
            label={t('auth.login.email')}
            type="email"
            autoComplete="username"
            placeholder="nom@example.com"
            iconLeft={<FiMail />}
            {...emailFormik.getFieldProps('email')}
            error={emailError('email')}
          />
          <PasswordInput
            id="login-password"
            label={t('auth.login.password')}
            autoComplete="current-password"
            iconLeft={<FiLock />}
            {...emailFormik.getFieldProps('password')}
            error={emailError('password')}
          />
          <div className="flex justify-end">
            <Link className="auth-flow-link" to="/forgot-password">
              {t('auth.login.forgot')}
            </Link>
          </div>
          <Button className="w-full" type="submit" loading={emailFormik.isSubmitting}>
            {emailFormik.isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
      ) : null}

      <p className="mt-5 text-center text-sm text-[var(--app-text-muted)]">
        {t('auth.login.newToMoxt')}{' '}
        <Link className="auth-flow-link" to="/register">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </AuthCard>
  )
}
