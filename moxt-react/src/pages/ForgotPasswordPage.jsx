import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { FiHelpCircle, FiLock, FiMail, FiPhone, FiMessageSquare } from 'react-icons/fi'
import { FaTelegramPlane } from 'react-icons/fa'
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
import { clearSession } from '../features/auth/authSlice'
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
  const [otpChannel, setOtpChannel] = useState('sms') // sms | telegram | flashcall
  const [channelSending, setChannelSending] = useState(false)
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
      const raw = String(values.phone || '').trim()
      let phone = raw
      if (raw.startsWith('+7') || raw.startsWith('8') || raw.startsWith('7')) {
        phone = constrainPhone(raw, '+7', 10)
      }
      if (!isValidRussianPhone(phone) && !/^\+[1-9]\d{7,14}$/.test(phone)) {
        helpers.setFieldError('phone', t('auth.forgot.phoneInvalid'))
        helpers.setSubmitting(false)
        return
      }
      setPendingPhone(phone)
      setPhoneStep('choose_channel')
      helpers.setSubmitting(false)
    },
  })

  async function sendOtpWithChannel(channelToUse) {
    if (channelSending) return
    setChannelSending(true)
    try {
      const result = await authService.requestPhonePasswordReset(pendingPhone, channelToUse)
      setOtpChannel(channelToUse)
      setPhoneStep('confirm')
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS)
      let successTitle = t('auth.forgot.phoneCodeSentTitle')
      let successBody = t('auth.forgot.phoneCodeSentBody', { phone: result.phone })
      if (channelToUse === 'flashcall') {
        successTitle = t('auth.register.channel.callTitle') || 'Par appel'
        successBody =
          t('security.phone.codeSentBodyCall', { phone: result.phone }) ||
          `Un appel court va arriver au ${result.phone}. Notez les 4 derniers chiffres du numéro appelant.`
      } else if (channelToUse === 'telegram') {
        successTitle = t('auth.register.channel.telegramTitle') || 'Par Telegram'
        successBody =
          t('security.phone.codeSentBodyTelegram', { phone: result.phone }) ||
          `Le code de validation a été envoyé sur Telegram au ${result.phone}.`
      }
      dispatch(
        addToast({
          title: successTitle,
          message: successBody,
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
      setChannelSending(false)
    }
  }

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
      const trimmedCode = String(values.code || '').trim()
      if (otpChannel === 'flashcall') {
        if (!/^\d{4}$/.test(trimmedCode)) {
          helpers.setFieldError('code', 'Saisissez les 4 derniers chiffres du numéro qui appelle.')
          helpers.setSubmitting(false)
          return
        }
      } else if (!/^\d{6}$/.test(trimmedCode)) {
        helpers.setFieldError('code', t('auth.forgot.phoneCodeInvalid'))
        helpers.setSubmitting(false)
        return
      }
      try {
        await authService.confirmPhonePasswordReset({
          phone: pendingPhone,
          token: trimmedCode,
          password: values.password,
          otpChannel,
        })
        const { markIntentionalSignOut } = await import('../services/authSessionSync')
        markIntentionalSignOut()
        dispatch(clearSession())
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
    setOtpChannel('sms')
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
            iconLeft={
              <span className="text-base leading-none">
                {phoneRequestFormik.values.phone.startsWith('+7') ||
                phoneRequestFormik.values.phone.startsWith('8')
                  ? flagEmoji('RU')
                  : '🌐'}
              </span>
            }
            value={phoneRequestFormik.values.phone}
            onChange={(event) => {
              const val = event.target.value
              if (val.startsWith('+7') || val.startsWith('8') || val.startsWith('7')) {
                phoneRequestFormik.setFieldValue(
                  'phone',
                  constrainPhone(val, '+7', 10),
                )
              } else {
                phoneRequestFormik.setFieldValue('phone', val)
              }
            }}
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
            {t('common.continue') || 'Continuer'}
          </Button>
          <Link className="auth-flow-link-muted text-center" to="/login">
            {t('auth.forgot.backToLogin')}
          </Link>
        </form>
      ) : null}

      {mode === 'phone' && phoneStep === 'choose_channel' ? (
        <div className="auth-flow-panel mt-4 grid gap-4">
          <div className="flex items-center justify-between rounded-2xl bg-[var(--app-surface-muted)] p-3">
            <div>
              <span className="text-xs text-[var(--app-text-muted)]">Numéro de téléphone :</span>
              <p className="text-sm font-bold text-[var(--app-text)]">{pendingPhone}</p>
            </div>
            <button
              type="button"
              onClick={() => setPhoneStep('request')}
              className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
            >
              Modifier
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--app-text)]">
              {t('auth.register.channel.title') || 'Comment recevoir votre code ?'}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
              Choisissez le mode qui vous convient le mieux :
            </p>
          </div>

          <div className="grid gap-2.5">
            <button
              type="button"
              disabled={channelSending}
              onClick={() => sendOtpWithChannel('sms')}
              className="flex w-full items-start gap-3 rounded-2xl border-2 border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 text-left transition hover:border-brand-600 hover:bg-[var(--app-accent-soft)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-300">
                <FiMessageSquare className="text-lg" />
              </span>
              <span className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="block text-sm font-black">{t('auth.register.channel.smsTitle') || 'Par SMS'}</strong>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Recommandé
                  </span>
                </div>
                <span className="mt-1 block text-xs text-[var(--app-text-muted)]">
                  {t('auth.register.channel.smsHint') || 'Code à 6 chiffres par SMS standard (idéal si vous n’avez pas Telegram).'}
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={channelSending}
              onClick={() => sendOtpWithChannel('telegram')}
              className="flex w-full items-start gap-3 rounded-2xl border-2 border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 text-left transition hover:border-brand-600 hover:bg-[var(--app-accent-soft)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FaTelegramPlane className="text-lg" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-black">{t('auth.register.channel.telegramTitle') || 'Par Telegram'}</strong>
                <span className="mt-1 block text-xs text-[var(--app-text-muted)]">
                  {t('auth.register.channel.telegramHint') || 'Code à 6 chiffres envoyé dans Telegram (nécessite un compte Telegram lié).'}
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={channelSending}
              onClick={() => sendOtpWithChannel('flashcall')}
              className="flex w-full items-start gap-3 rounded-2xl border-2 border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 text-left transition hover:border-brand-600 hover:bg-[var(--app-accent-soft)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <FiPhone className="text-lg" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-black">{t('auth.register.channel.callTitle') || 'Par appel (FlashCall)'}</strong>
                <span className="mt-1 block text-xs text-[var(--app-text-muted)]">
                  {t('auth.register.channel.callHint') || 'Un court appel entrant : saisissez les 4 derniers chiffres du numéro qui appelle.'}
                </span>
              </span>
            </button>
          </div>

          {channelSending ? (
            <p className="text-center text-xs text-brand-600 animate-pulse font-bold">
              Envoi du code en cours...
            </p>
          ) : null}

          <button
            type="button"
            className="text-center text-sm font-bold text-[var(--app-text-muted)] hover:underline"
            onClick={() => setPhoneStep('request')}
          >
            ← Retour
          </button>
        </div>
      ) : null}

      {mode === 'phone' && phoneStep === 'confirm' ? (
        <form
          className="auth-flow-panel mt-4 grid gap-4"
          onSubmit={phoneConfirmFormik.handleSubmit}
          noValidate
        >
          <Alert
            variant="info"
            title={
              otpChannel === 'flashcall'
                ? t('auth.register.channel.callTitle') || 'Appel en cours'
                : otpChannel === 'telegram'
                  ? t('auth.register.channel.telegramTitle') || 'Code Telegram envoyé'
                  : t('auth.forgot.phoneCodeSentTitle')
            }
          >
            {otpChannel === 'flashcall'
              ? t('security.phone.codeSentBodyCall', { phone: pendingPhone }) ||
                `Un appel court va arriver au ${pendingPhone}. Entrez les 4 derniers chiffres du numéro appelant.`
              : otpChannel === 'telegram'
                ? t('security.phone.codeSentBodyTelegram', { phone: pendingPhone }) ||
                  `Le code a été envoyé sur Telegram au ${pendingPhone}. Si vous n'avez pas de compte Telegram, vous pouvez changer de méthode ci-dessous.`
                : t('auth.forgot.phoneCodeSentBody', { phone: pendingPhone })}
          </Alert>
          <Input
            id="forgot-phone-code"
            label={
              otpChannel === 'flashcall'
                ? '4 derniers chiffres du numéro qui appelle'
                : t('auth.forgot.phoneCodeLabel')
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={otpChannel === 'flashcall' ? 4 : 6}
            placeholder={otpChannel === 'flashcall' ? '0000' : '000000'}
            value={phoneConfirmFormik.values.code}
            onChange={(event) =>
              phoneConfirmFormik.setFieldValue(
                'code',
                event.target.value.replace(/\D/g, '').slice(0, otpChannel === 'flashcall' ? 4 : 6),
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
            disabled={cooldown > 0 || channelSending}
            onClick={() => sendOtpWithChannel(otpChannel)}
          >
            {cooldown > 0
              ? t('auth.forgot.resendCooldown', { seconds: cooldown })
              : t('auth.forgot.phoneResend')}
          </Button>

          <button
            type="button"
            className="text-center text-sm font-bold text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
            onClick={() => setPhoneStep('choose_channel')}
          >
            {t('security.phone.tryAnotherMethod') || 'Essayer une autre méthode (SMS, Telegram, appel)'}
          </button>

          <button
            type="button"
            className="text-center text-xs font-bold text-[var(--app-text-muted)] underline-offset-2 hover:underline"
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
