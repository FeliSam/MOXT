import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { FiLock, FiMail, FiMessageSquare } from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { GoogleButton } from '../components/auth/GoogleButton'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { flagEmoji } from '../config/flags'
import { constrainPhone } from '../config/phone'
import { useLanguage } from '../contexts/useLanguage'
import { loadAllData } from '../app/loadAllData'
import { authErrorToast } from '../features/auth/authErrorMessages'
import {
  clearAuthError,
  login,
  requestPhoneLoginOtp,
  verifyPhoneLogin,
} from '../features/auth/authSlice'
import { loginEmailSchema, loginPhonePasswordSchema } from '../features/auth/authSchemas'
import { addToast } from '../features/ui/uiSlice'
import { startRealtimeSubscription } from '../services/realtimeService'

const LOGIN_MODES = [
  { id: 'email', label: 'E-mail', icon: FiMail },
  { id: 'phone-password', label: 'Tél. + mot de passe', icon: FiLock },
  { id: 'phone-otp', label: 'Code SMS', icon: FiMessageSquare },
]

function finishLogin(dispatch, store, navigate, location) {
  dispatch(loadAllData())
  startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
  navigate(location.state?.from || '/dashboard', { replace: true })
}

export function LoginPage() {
  const dispatch = useDispatch()
  const store = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const { error, status } = useSelector((state) => state.auth)

  const [mode, setMode] = useState('email')
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('+7')
  const [otpCode, setOtpCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => () => dispatch(clearAuthError()), [dispatch])

  useEffect(() => {
    if (!error) return
    dispatch(addToast(authErrorToast('Connexion impossible', error)))
    dispatch(clearAuthError())
  }, [dispatch, error])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  function switchMode(nextMode) {
    setMode(nextMode)
    setOtpSent(false)
    setOtpCode('')
    dispatch(clearAuthError())
  }

  const emailFormik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginEmailSchema,
    onSubmit: async (values) => {
      const result = await dispatch(login({ identifier: values.email.trim(), password: values.password }))
      if (login.fulfilled.match(result)) {
        finishLogin(dispatch, store, navigate, location)
      }
    },
  })

  const phoneFormik = useFormik({
    initialValues: { phone: '+7', password: '' },
    validationSchema: loginPhonePasswordSchema,
    onSubmit: async (values) => {
      const result = await dispatch(login({ identifier: values.phone, password: values.password }))
      if (login.fulfilled.match(result)) {
        finishLogin(dispatch, store, navigate, location)
      }
    },
  })

  async function sendLoginOtp() {
    const errors = await phoneFormik.validateForm()
    if (errors.phone) {
      phoneFormik.setFieldTouched('phone', true, false)
      return
    }
    const phone = phoneFormik.values.phone
    const result = await dispatch(requestPhoneLoginOtp(phone))
    if (requestPhoneLoginOtp.fulfilled.match(result)) {
      setOtpPhone(result.payload.phone)
      setOtpSent(true)
      setOtpCode('')
      setResendCooldown(60)
      dispatch(clearAuthError())
      dispatch(
        addToast({
          title: 'Code envoyé',
          message: `Vérifiez les SMS reçus au ${result.payload.phone}.`,
          tone: 'info',
        }),
      )
    }
  }

  async function confirmLoginOtp() {
    if (!/^\d{6}$/.test(otpCode)) return
    const result = await dispatch(verifyPhoneLogin({ phone: otpPhone, token: otpCode }))
    if (verifyPhoneLogin.fulfilled.match(result)) {
      finishLogin(dispatch, store, navigate, location)
    }
  }

  const emailError = (field) => (emailFormik.touched[field] ? emailFormik.errors[field] : undefined)
  const phoneError = (field) => (phoneFormik.touched[field] ? phoneFormik.errors[field] : undefined)

  return (
    <AuthCard
      eyebrow="MOXT · Connexion"
      title={t('auth.login.title')}
      titleClassName="max-sm:hidden"
      description="Accédez à votre espace par e-mail, numéro russe (+7) ou code SMS."
    >
      <div className="auth-flow-panel mt-5">
        <GoogleButton label="Continuer avec Google" />
      </div>

      <p className="auth-flow-divider">ou avec vos identifiants</p>

      <div className="grid gap-2 sm:grid-cols-3">
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
            Mot de passe oublié ? Utilisez la connexion par e-mail si votre compte en possède un.
          </p>
          <Button className="w-full" type="submit" loading={status === 'loading'}>
            {status === 'loading' ? t('auth.login.submitting') : 'Se connecter'}
          </Button>
        </form>
      ) : null}

      {mode === 'phone-otp' ? (
        <div className="auth-flow-panel mt-4 grid gap-4">
          {!otpSent ? (
            <>
              <Input
                id="login-phone-otp"
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
              <Button className="w-full" type="button" loading={status === 'loading'} onClick={sendLoginOtp}>
                Envoyer le code SMS
              </Button>
            </>
          ) : (
            <>
              <Alert variant="info">
                Un code à 6 chiffres a été envoyé au <strong>{otpPhone}</strong>.
              </Alert>
              <Input
                id="login-otp-code"
                label="Code reçu par SMS"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <Button
                className="w-full"
                type="button"
                loading={status === 'loading'}
                disabled={otpCode.length !== 6}
                onClick={confirmLoginOtp}
              >
                Valider et se connecter
              </Button>
              <div className="text-center text-sm text-[var(--app-text-muted)]">
                <span>Vous n'avez pas reçu le SMS ? </span>
                <button
                  type="button"
                  className="font-bold text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-300"
                  disabled={resendCooldown > 0 || status === 'loading'}
                  onClick={sendLoginOtp}
                >
                  {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
                </button>
              </div>
              <button
                type="button"
                className="auth-flow-link-muted"
                onClick={() => {
                  setOtpSent(false)
                  setOtpCode('')
                  dispatch(clearAuthError())
                }}
              >
                Modifier le numéro
              </button>
            </>
          )}
        </div>
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
