import { useFormik } from 'formik'
import { useEffect } from 'react'
import { FiLock, FiUser } from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { GoogleButton } from '../components/auth/GoogleButton'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { useLanguage } from '../contexts/useLanguage'
import { clearAuthError, login } from '../features/auth/authSlice'
import { loadAllData } from '../app/loadAllData'
import { startRealtimeSubscription } from '../services/realtimeService'
import { loginSchema } from '../features/auth/authSchemas'

export function LoginPage() {
  const dispatch = useDispatch()
  const store = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const { error, status } = useSelector((state) => state.auth)

  useEffect(() => () => dispatch(clearAuthError()), [dispatch])

  const formik = useFormik({
    initialValues: { identifier: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      const result = await dispatch(login(values))
      if (login.fulfilled.match(result)) {
        dispatch(loadAllData())
        startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
        navigate(location.state?.from || '/dashboard', { replace: true })
      }
    },
  })

  return (
    <AuthCard title={t('auth.login.title')} description={t('auth.login.description')}>
      <div className="mt-6">
        <GoogleButton to="/dashboard" />
      </div>
      <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[var(--app-text-faint)]">
        <span className="h-px flex-1 bg-[var(--app-border)]" />
        ou avec votre email
        <span className="h-px flex-1 bg-[var(--app-border)]" />
      </div>
      <form className="grid gap-4" onSubmit={formik.handleSubmit} noValidate>
        {location.state?.notice ? <Alert variant="success">{location.state.notice}</Alert> : null}
        {error ? <Alert variant="error">{error}</Alert> : null}
        <Input
          id="identifier"
          label="E-mail ou numéro russe"
          type="text"
          autoComplete="username"
          placeholder="nom@example.com ou +7XXXXXXXXXX"
          iconLeft={<FiUser />}
          {...formik.getFieldProps('identifier')}
          error={formik.touched.identifier ? formik.errors.identifier : undefined}
        />
        <PasswordInput
          id="password"
          label={t('auth.login.password')}
          autoComplete="current-password"
          iconLeft={<FiLock />}
          {...formik.getFieldProps('password')}
          error={formik.touched.password ? formik.errors.password : undefined}
        />
        <div className="flex justify-end">
          <Link
            className="text-sm font-bold text-brand-700 dark:text-brand-300"
            to="/forgot-password"
          >
            {t('auth.login.forgot')}
          </Link>
        </div>
        <Button className="w-full" type="submit" loading={status === 'loading'}>
          {status === 'loading' ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--app-text-muted)]">
        {t('auth.login.newToMoxt')}{' '}
        <Link className="font-bold text-brand-700 dark:text-brand-300" to="/register">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </AuthCard>
  )
}
