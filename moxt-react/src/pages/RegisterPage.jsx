import { useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiGlobe,
  FiMail,
  FiMessageSquare,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'
import { AuthCard } from '../components/auth/AuthCard'
import { GoogleButton } from '../components/auth/GoogleButton'
import { Alert } from '../components/ui/Alert'
import { useActionBurst } from '../components/ui/ActionBurst'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Select } from '../components/ui/Select'
import { CitySelector } from '../components/ui/CitySelector'
import { flagEmoji } from '../config/flags'
import { constrainPhone, phonePrefixForCallingCode } from '../config/phone'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../config/uiTranslations'
import { useLanguage } from '../contexts/useLanguage'
import {
  oauthProfileCompletionSchema,
  oauthProfileStepFields,
  registerSchema,
  registerStepFields,
} from '../features/auth/authSchemas'
import { authService } from '../features/auth/authService'
import {
  clearAuthError,
  completeOAuthProfile,
  register,
  resendEmailRegistrationOtp,
  resendPhoneRegistrationOtp,
  verifyEmailRegistration,
  verifyPhoneRegistration,
} from '../features/auth/authSlice'
import { addToast } from '../features/ui/uiSlice'
import { authErrorToast } from '../features/auth/authErrorMessages'
import { loadAllData } from '../app/loadAllData'
import { startRealtimeSubscription } from '../services/realtimeService'
import { useGeographyOptions } from '../hooks/useGeographyOptions'
import { markWelcomePending } from '../features/onboarding/welcomeStorage'

const STEPS = [
  { key: 'identity', label: 'Identité', icon: FiUser },
  { key: 'language', label: 'Langue & pays', icon: FiGlobe },
  { key: 'security', label: 'Résidence', icon: FiShield },
  { key: 'verification', label: 'Vérification', icon: FiCheck },
]

const LANGUAGE_TILES = LANGUAGE_LABELS
const RESEND_COOLDOWN_SECONDS = 60

/* ─── Stepper visuel — meme pattern que Transfert / Job / Evenement ──────── */
function Stepper({ step, oauthCompletion = false }) {
  const steps = oauthCompletion ? STEPS.slice(0, 3) : STEPS
  return (
    <div className="relative mt-4 flex items-start justify-between">
      <div className="auth-stepper-track" aria-hidden />
      <div
        className="auth-stepper-progress"
        style={{ width: `${steps.length > 1 ? ((step - 1) / (steps.length - 1)) * 100 : 0}%` }}
        aria-hidden
      />
      {steps.map((s, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        const Icon = s.icon
        return (
          <div key={s.key} className="relative z-10 flex flex-col items-center gap-1">
            <span
              className={`grid size-8 place-items-center rounded-full border-2 transition-all duration-300 ${
                done
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : active
                    ? 'border-brand-600 bg-white text-brand-700 shadow-lg shadow-brand-200 dark:bg-slate-900 dark:shadow-none'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-faint)]'
              }`}
            >
              {done ? <FiCheck className="text-sm" /> : <Icon className="text-sm" />}
            </span>
            <span
              className={`text-center text-[10px] font-bold leading-tight ${
                active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-faint)]'
              }`}
            >
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const store = useStore()
  const authUser = useSelector((state) => state.auth.user)
  const { language, setLanguage, t } = useLanguage()
  const { error, status } = useSelector((state) => state.auth)
  const fromGoogle = searchParams.get('from') === 'google'
  const [oauthCompletion, setOauthCompletion] = useState(false)
  const [step, setStep] = useState(1)
  const [pendingVerification, setPendingVerification] = useState(null) // { method, phone?, email }
  const [verificationCode, setVerificationCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()
  const { countries } = useGeographyOptions()
  const alreadyRegistered = error === 'ALREADY_REGISTERED'

  useEffect(() => {
    return () => dispatch(clearAuthError())
  }, [dispatch])

  // Les erreurs d'inscription passent uniquement par des toasts (aucun message
  // inline en double sur la page).
  useEffect(() => {
    if (!error) return
    if (alreadyRegistered) {
      dispatch(
        addToast({
          title: 'Compte déjà existant',
          message:
            'Un compte existe déjà avec cet e-mail ou ce numéro russe. Connectez-vous ou utilisez d’autres identifiants.',
          tone: 'error',
        }),
      )
    } else if (pendingVerification) {
      dispatch(addToast(authErrorToast('Vérification impossible', error)))
    } else if (oauthCompletion) {
      dispatch(addToast(authErrorToast('Profil incomplet', error)))
    } else {
      dispatch(addToast(authErrorToast('Inscription impossible', error)))
    }
    dispatch(clearAuthError())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, alreadyRegistered, pendingVerification])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      avatarUrl: '',
      originCountry: 'BJ',
      residenceCountry: 'RU',
      residenceCity: 'Moscou',
      russianPhone: '+7',
      originPhone: '+229',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      verificationMethod: 'phone',
    },
    validationSchema: oauthCompletion ? oauthProfileCompletionSchema : registerSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (oauthCompletion) {
        const result = await dispatch(completeOAuthProfile(values))
        if (!completeOAuthProfile.fulfilled.match(result)) return
        dispatch(clearAuthError())
        await dispatch(loadAllData())
        startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
        markWelcomePending()
        triggerBurst()
        dispatch(
          addToast({
            title: 'Profil complété',
            message: 'Votre compte Google est prêt. Bienvenue sur MOXT.',
            tone: 'success',
          }),
        )
        navigate('/dashboard', { replace: true })
        return
      }

      const result = await dispatch(register(values))
      if (!register.fulfilled.match(result)) {
        const payload = String(result.payload || '').toLowerCase()
        if (values.verificationMethod === 'email' && payload.includes('e-mail')) {
          formik.setFieldValue('verificationMethod', 'phone')
          dispatch(clearAuthError())
          dispatch(
            addToast({
              title: 'E-mail indisponible',
              message:
                "L'envoi d'e-mail est momentanément indisponible. Nous avons basculé vers la confirmation par SMS.",
              tone: 'warning',
            }),
          )
          return
        }
        if (values.verificationMethod === 'phone' && payload.includes('sms')) {
          formik.setFieldValue('verificationMethod', 'email')
          dispatch(clearAuthError())
          dispatch(
            addToast({
              title: 'SMS indisponible',
              message:
                "L'envoi SMS est momentanément indisponible. Essayez la confirmation par e-mail si vous en avez renseigné une.",
              tone: 'warning',
            }),
          )
        }
        return
      }
      dispatch(clearAuthError())
      if (result.payload.requiresPhoneConfirmation) {
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
        setPendingVerification({ method: 'phone', phone: result.payload.phone, email: result.payload.email })
        return
      }
      if (result.payload.requiresEmailConfirmation) {
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
        setPendingVerification({ method: 'email', email: result.payload.email })
        return
      }
      await dispatch(loadAllData())
      startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
      markWelcomePending()
      navigate('/dashboard', { replace: true })
    },
  })

  useEffect(() => {
    let cancelled = false

    async function hydrateFromGoogle() {
      if (!fromGoogle) return

      try {
        const profile = await authService.fetchGoogleProfile()
        if (cancelled) return
        formik.setValues((current) => ({
          ...current,
          ...profile,
          acceptTerms: false,
        }))

        const sessionUser = store.getState().auth.user
        if (sessionUser && isProfileComplete(sessionUser)) {
          navigate('/dashboard', { replace: true })
          return
        }

        setOauthCompletion(true)
        setStep(2)
      } catch {
        if (!cancelled) {
          dispatch(
            addToast({
              title: 'Connexion Google',
              message:
                'Impossible de récupérer votre profil Google. Réessayez ou inscrivez-vous par e-mail.',
              tone: 'error',
            }),
          )
        }
      } finally {
        if (!cancelled) {
          const nextParams = new URLSearchParams(window.location.search)
          nextParams.delete('from')
          const query = nextParams.toString()
          window.history.replaceState({}, '', query ? `/register?${query}` : '/register')
        }
      }
    }

    if (fromGoogle) {
      hydrateFromGoogle()
    } else if (authUser && !isProfileComplete(authUser)) {
      setOauthCompletion(true)
      setStep(2)
      formik.setValues((current) => ({
        ...current,
        firstName: authUser.firstName || current.firstName,
        lastName: authUser.lastName || current.lastName,
        email: authUser.email || current.email,
        avatarUrl: authUser.avatarUrl || current.avatarUrl,
        originCountry: authUser.originCountry || current.originCountry,
        residenceCity: authUser.city || current.residenceCity,
        russianPhone: authUser.phone || current.russianPhone,
        originPhone: authUser.secondaryPhone || current.originPhone,
      }))
    }

    return () => {
      cancelled = true
    }
  }, [authUser, dispatch, formik.setValues, fromGoogle, navigate, store])

  async function resendVerificationCode() {
    if (!pendingVerification || resendCooldown > 0) return

    const isEmail = pendingVerification.method === 'email'
    const result = isEmail
      ? await dispatch(resendEmailRegistrationOtp(pendingVerification.email))
      : await dispatch(resendPhoneRegistrationOtp(pendingVerification.phone))

    const fulfilled = isEmail
      ? resendEmailRegistrationOtp.fulfilled.match(result)
      : resendPhoneRegistrationOtp.fulfilled.match(result)

    if (fulfilled) {
      dispatch(clearAuthError())
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      dispatch(
        addToast({
          title: t('auth.register.codeResentTitle'),
          message: isEmail
            ? t('auth.register.codeResentEmail', { email: pendingVerification.email })
            : t('auth.register.codeResentSms', { phone: pendingVerification.phone }),
          tone: 'success',
        }),
      )
    }
  }

  async function confirmCode() {
    if (!pendingVerification || !/^\d{6}$/.test(verificationCode)) return

    const thunk =
      pendingVerification.method === 'email' ? verifyEmailRegistration : verifyPhoneRegistration
    const payload = { ...pendingVerification, token: verificationCode }

    const result = await dispatch(thunk(payload))
    if (thunk.fulfilled.match(result)) {
      dispatch(clearAuthError())
      await dispatch(loadAllData())
      startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
      triggerBurst()
      if (result.payload.emailLinkDeferred) {
        dispatch(
          addToast({
            title: 'Compte créé',
            message:
              'Votre compte est actif. Vous pourrez confirmer votre e-mail plus tard dans Sécurité.',
            tone: 'success',
          }),
        )
      } else {
        dispatch(
          addToast({
            title: 'Vérification réussie',
            message: 'Bienvenue sur MOXT.',
            tone: 'success',
          }),
        )
      }
      markWelcomePending()
      window.setTimeout(() => navigate('/dashboard', { replace: true }), 550)
    }
  }

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === formik.values.originCountry),
    [countries, formik.values.originCountry],
  )
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)

  async function nextStep() {
    const errors = await formik.validateForm()
    const fields = (oauthCompletion ? oauthProfileStepFields : registerStepFields)[step] || []
    fields.forEach((field) => formik.setFieldTouched(field, true, false))
    if (!fields.some((field) => errors[field])) {
      const maxStep = oauthCompletion ? 3 : STEPS.length
      setStep((value) => Math.min(value + 1, maxStep))
    }
  }

  return (
    <AuthCard
      compact
      eyebrow={oauthCompletion ? 'MOXT · Profil Google' : 'MOXT · Inscription'}
      title={oauthCompletion ? 'Complétez votre profil' : 'Créer votre compte MOXT'}
      description={
        oauthCompletion
          ? 'Votre compte Google est connecté. Ajoutez votre pays, ville et numéro russe pour utiliser MOXT.'
          : 'Inscription avec e-mail, numéro russe (+7) et confirmation par SMS.'
      }
    >
      {burstNode}
      <Stepper step={step} oauthCompletion={oauthCompletion} />

      {/* @container : le passage en 2 colonnes depend de la largeur reelle de
          la carte, pas du viewport — corrige l'ecrasement des champs sur les
          ecrans intermediaires ou la colonne du formulaire est etroite. */}
      <form className="@container mt-4 grid gap-3" onSubmit={formik.handleSubmit} noValidate>
        {step === 1 && !oauthCompletion ? (
          <>
            <GoogleButton label="S'inscrire avec Google" />
            <p className="auth-flow-divider">ou avec vos informations</p>

            <div className="grid min-w-0 gap-3 @md:grid-cols-2">
              <Input
                id="firstName"
                label="Prénom"
                autoComplete="given-name"
                {...formik.getFieldProps('firstName')}
                error={errorFor('firstName')}
              />
              <Input
                id="lastName"
                label="Nom"
                autoComplete="family-name"
                {...formik.getFieldProps('lastName')}
                error={errorFor('lastName')}
              />
            </div>
            <Input
              id="register-email"
              label="Adresse e-mail"
              type="email"
              autoComplete="email"
              required
              {...formik.getFieldProps('email')}
              error={errorFor('email')}
            />
            <Button type="button" icon={FiArrowRight} onClick={nextStep}>
              Continuer
            </Button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            {oauthCompletion ? (
              <div className="grid min-w-0 gap-3 @md:grid-cols-2">
                <Input
                  id="oauth-firstName"
                  label="Prénom"
                  autoComplete="given-name"
                  {...formik.getFieldProps('firstName')}
                  error={errorFor('firstName')}
                />
                <Input
                  id="oauth-lastName"
                  label="Nom"
                  autoComplete="family-name"
                  {...formik.getFieldProps('lastName')}
                  error={errorFor('lastName')}
                />
                <Input
                  id="oauth-email"
                  className="@md:col-span-2"
                  label="Adresse e-mail"
                  type="email"
                  autoComplete="email"
                  readOnly
                  {...formik.getFieldProps('email')}
                  error={errorFor('email')}
                />
              </div>
            ) : null}

            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--app-text-muted)]">
                Langue de l'interface
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.map((code) => {
                  const meta = LANGUAGE_TILES[code] || { flag: '🏳️', label: code.toUpperCase() }
                  const active = language === code
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLanguage(code)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition-all duration-200 ${
                        active
                          ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-cyan-50 shadow-md dark:from-brand-950/40 dark:to-cyan-950/40'
                          : 'border-[var(--app-border)] hover:border-brand-300 hover:bg-[var(--app-surface-muted)]'
                      }`}
                    >
                      <span className="text-2xl leading-none">{meta.flag}</span>
                      <span
                        className={`text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'}`}
                      >
                        {meta.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Select
              id="originCountry"
              label="Pays de provenance"
              {...formik.getFieldProps('originCountry')}
              onChange={(event) => {
                const country = countries.find((item) => item.code === event.target.value)
                formik.setFieldValue('originCountry', event.target.value)
                formik.setFieldValue(
                  'originPhone',
                  phonePrefixForCallingCode(country?.callingCode || ''),
                )
              }}
              error={errorFor('originCountry')}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {flagEmoji(country.code)} {language === 'en' ? country.englishName : country.name}
                </option>
              ))}
            </Select>

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
              {!oauthCompletion ? (
                <Button type="button" variant="secondary" icon={FiArrowLeft} onClick={() => setStep(1)}>
                  Retour
                </Button>
              ) : (
                <span />
              )}
              <Button type="button" icon={FiArrowRight} onClick={nextStep}>
                Continuer
              </Button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            {oauthCompletion ? (
              <Alert variant="info">
                Dernière étape : renseignez votre résidence en Russie et votre numéro +7 pour activer
                votre compte.
              </Alert>
            ) : null}
            <CitySelector
              id="residenceCity"
              label="Ville de résidence"
              value={formik.values.residenceCity}
              onChange={(city) => formik.setFieldValue('residenceCity', city)}
              error={errorFor('residenceCity')}
            />
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
              <Input
                id="russianPhone"
                label="N° russe"
                type="tel"
                autoComplete="tel"
                placeholder="+7XXXXXXXXXX"
                iconLeft={<span className="text-base leading-none">{flagEmoji('RU')}</span>}
                {...formik.getFieldProps('russianPhone')}
                onChange={(event) =>
                  formik.setFieldValue('russianPhone', constrainPhone(event.target.value, '+7', 10))
                }
                error={errorFor('russianPhone')}
              />
              <Input
                id="originPhone"
                label="N° local"
                type="tel"
                placeholder={`${selectedCountry?.callingCode || ''}...`}
                iconLeft={
                  <span className="text-base leading-none">
                    {flagEmoji(selectedCountry?.code || formik.values.originCountry)}
                  </span>
                }
                {...formik.getFieldProps('originPhone')}
                onChange={(event) =>
                  formik.setFieldValue(
                    'originPhone',
                    constrainPhone(event.target.value, selectedCountry?.callingCode || '', 12),
                  )
                }
                error={errorFor('originPhone')}
              />
            </div>
            {!oauthCompletion ? (
              <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
                <PasswordInput
                  id="register-password"
                  label="Mot de passe"
                  autoComplete="new-password"
                  {...formik.getFieldProps('password')}
                  error={errorFor('password')}
                />
                <PasswordInput
                  id="confirmPassword"
                  label="Confirmer"
                  autoComplete="new-password"
                  {...formik.getFieldProps('confirmPassword')}
                  error={errorFor('confirmPassword')}
                />
              </div>
            ) : null}

            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border-2 p-2.5 transition-all duration-[var(--transition-fast)] sm:gap-3 sm:p-3 ${
                formik.values.acceptTerms
                  ? 'border-brand-500 bg-[var(--app-accent-soft)]'
                  : 'border-[var(--app-border-md)] hover:border-brand-300'
              }`}
            >
              <input
                className="mt-0.5 size-4 shrink-0 accent-brand-700"
                type="checkbox"
                {...formik.getFieldProps('acceptTerms')}
                checked={formik.values.acceptTerms}
              />
              <span className="text-xs leading-5 text-[var(--app-text-2)] sm:text-sm">
                J'accepte les{' '}
                <Link className="auth-flow-link" to="/trust" target="_blank" rel="noreferrer">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link className="auth-flow-link" to="/faq" target="_blank" rel="noreferrer">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>
            {errorFor('acceptTerms') ? (
              <span role="alert" className="-mt-2 text-xs text-red-600">{errorFor('acceptTerms')}</span>
            ) : null}

            <div className="hidden items-center gap-1.5 rounded-2xl bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-bold sm:flex">
              <span className="text-base leading-none">{flagEmoji(formik.values.originCountry)}</span>
              {selectedCountry?.name || 'Pays de provenance'}
              <FiArrowRight className="text-xs text-[var(--app-text-faint)]" />
              <span className="text-base leading-none">{flagEmoji('RU')}</span>
              {formik.values.residenceCity || 'Russie'}
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
              <Button type="button" variant="secondary" icon={FiArrowLeft} onClick={() => setStep(2)}>
                Retour
              </Button>
              {oauthCompletion ? (
                <Button type="submit" icon={FiCheck} loading={status === 'loading'}>
                  {status === 'loading' ? 'Enregistrement...' : 'Terminer mon profil'}
                </Button>
              ) : (
                <Button type="button" icon={FiArrowRight} onClick={nextStep}>
                  Continuer
                </Button>
              )}
            </div>
          </>
        ) : null}

        {step === 4 && !oauthCompletion ? (
          <>
            {pendingVerification ? (
              <>
                <Alert
                  title={
                    pendingVerification.method === 'email'
                      ? 'Confirmez votre e-mail'
                      : 'Confirmez votre numéro'
                  }
                  variant="info"
                >
                  {pendingVerification.method === 'email' ? (
                    <>
                      Un code à 6 chiffres a été envoyé à {pendingVerification.email}. Vérifiez que
                      l’adresse e-mail est correctement saisie. Consultez aussi vos courriers
                      indésirables (spam) si vous ne le recevez pas.
                    </>
                  ) : (
                    `Un code à 6 chiffres a été envoyé au ${pendingVerification.phone} par SMS.`
                  )}
                </Alert>
                <Input
                  id="verification-code"
                  label={
                    pendingVerification.method === 'email'
                      ? 'Code reçu par e-mail'
                      : 'Code reçu par SMS'
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                />
                <Button
                  type="button"
                  icon={FiCheck}
                  loading={status === 'loading'}
                  disabled={verificationCode.length !== 6}
                  onClick={confirmCode}
                >
                  Confirmer et accéder à MOXT
                </Button>
                <div className="grid gap-2 text-center">
                  <p className="text-sm text-[var(--app-text-muted)]">
                    {pendingVerification.method === 'email'
                      ? t('auth.register.codeNotReceivedEmail')
                      : t('auth.register.codeNotReceivedSms')}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={resendCooldown > 0 || status === 'loading'}
                    onClick={resendVerificationCode}
                  >
                    {resendCooldown > 0
                      ? t('auth.register.resendCooldown', { seconds: resendCooldown })
                      : pendingVerification.method === 'email'
                        ? t('auth.register.resendEmail')
                        : t('auth.register.resendSms')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-black text-[var(--app-text)]">
                  Comment souhaitez-vous confirmer votre compte ?
                </p>
                <div className="grid gap-3 @md:grid-cols-2">
                  {[
                    {
                      value: 'phone',
                      icon: FiMessageSquare,
                      title: 'Par SMS (recommandé)',
                      detail: formik.values.russianPhone,
                    },
                    {
                      value: 'email',
                      icon: FiMail,
                      title: 'Par e-mail',
                      detail: formik.values.email,
                    },
                  ].map((method) => {
                    const Icon = method.icon
                    const selected = formik.values.verificationMethod === method.value
                    return (
                      <button
                        key={method.value}
                        type="button"
                        className={`rounded-2xl p-4 text-left shadow-sm transition ${
                          selected
                            ? 'bg-brand-700 text-white shadow-lg shadow-brand-900/15'
                            : 'bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]'
                        }`}
                        onClick={() => {
                          formik.setFieldValue('verificationMethod', method.value)
                        }}
                      >
                        <Icon className="text-xl" />
                        <strong className="mt-3 block">{method.title}</strong>
                        <span
                          className={`mt-1 block truncate text-xs ${selected ? 'text-white/75' : 'text-[var(--app-text-muted)]'}`}
                        >
                          {method.detail}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="grid min-w-0 gap-3 @md:grid-cols-2">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={FiArrowLeft}
                    onClick={() => setStep(3)}
                  >
                    Retour
                  </Button>
                  <Button type="submit" icon={FiCheck} loading={status === 'loading'}>
                    {status === 'loading' ? 'Envoi...' : 'Créer et confirmer'}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : null}
      </form>
      <p className="mt-3 text-center text-sm text-[var(--app-text-muted)]">
        Vous avez déjà un compte ?{' '}
        <Link className="font-bold text-brand-700 dark:text-brand-300" to="/login">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  )
}
