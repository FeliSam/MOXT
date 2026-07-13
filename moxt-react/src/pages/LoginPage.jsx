import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { FiLock, FiMail } from 'react-icons/fi'
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
import { loadAllData } from '../app/loadAllData'
import { authErrorToast } from '../features/auth/authErrorMessages'
import { clearAuthError, login } from '../features/auth/authSlice'
import { loginEmailSchema, loginPhonePasswordSchema } from '../features/auth/authSchemas'
import { addToast } from '../features/ui/uiSlice'
import { startRealtimeSubscription } from '../services/realtimeService'
import { resolveReturnTo, clearReturnTo } from '../features/guest/guestNavigation'

const LOGIN_MODES = [
  { id: 'email', label: 'E-mail', icon: FiMail },
  { id: 'phone-password', label: 'Tél. + mot de passe', icon: FiLock },
]

function finishLogin(dispatch, store, navigate, location, searchParams) {
  dispatch(loadAllData())
  startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
  const destination = resolveReturnTo(searchParams, location.state)
  clearReturnTo()
  navigate(destination, { replace: true })
}

export function LoginPage() {
  const dispatch = useDispatch()
  const store = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { t } = useLanguage()
  const { error, status } = useSelector((state) => state.auth)

  const [mode, setMode] = useState('email')

  useEffect(() => () => dispatch(clearAuthError()), [dispatch])

  useEffect(() => {
    if (!error) return
    dispatch(addToast(authErrorToast('Connexion impossible', error)))
    dispatch(clearAuthError())
  }, [dispatch, error])

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
      eyebrow="MOXT · Connexion"
      title={t('auth.login.title')}
      titleClassName="max-sm:hidden"
      description="Accédez à votre espace par e-mail ou par numéro russe (+7) et mot de passe."
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
              {item.label}
            </button>
          )
        })}
      </div>

      {location.state?.notice ? (
        <Alert className="mt-4" variant="success">
          {location.state.notice}
        </Alert>
      ) : null}

      {mode === 'email' ? (
        <form className="auth-flow-panel mt-4 grid gap-4" onSubmit={emailFormik.handleSubmit} noValidate>
          <Input
            id="login-email"
            label="Adresse e-mail"
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
          <Button className="w-full" type="submit" loading={status === 'loading'}>
            {status === 'loading' ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
      ) : null}

      {mode === 'phone-password' ? (
        <form className="auth-flow-panel mt-4 grid gap-4" onSubmit={phoneFormik.handleSubmit} noValidate>
          <Input
            id="login-phone-password"
            label="Numéro russe"
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
            Utilisez le numéro +7 et votre mot de passe.
          </p>
          <Button className="w-full" type="submit" loading={status === 'loading'}>
            {status === 'loading' ? t('auth.login.submitting') : 'Se connecter'}
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
