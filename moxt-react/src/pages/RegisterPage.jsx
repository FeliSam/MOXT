import { useFormik } from 'formik'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiGlobe,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { needsOAuthProfileCompletion, needsRegisterProfileCompletion, isProfileComplete } from '@moxt/shared/auth/profileCompletion.js'
import { AuthCard } from '../components/auth/AuthCard'
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
import { updateAccountPreferences } from '../features/account/accountSlice'
import {
  clearAuthError,
  completeOAuthProfile,
  logout,
  register,
  resendPhoneRegistrationOtp,
  verifyPhoneRegistration,
} from '../features/auth/authSlice'
import { addToast } from '../features/ui/uiSlice'
import { authErrorToast } from '../features/auth/authErrorMessages'
import { loadAllData } from '../app/loadAllData'
import { startRealtimeSubscription } from '../services/realtimeService'
import { useGeographyOptions } from '../hooks/useGeographyOptions'
import { markWelcomePending } from '../features/onboarding/welcomeStorage'
import {
  storePendingInviteCode,
  resolveReturnTo,
  clearReturnTo,
  resolveAuthenticatedLanding,
  POST_PHONE_OTP_LANDING,
} from '../features/guest/guestNavigation'
import { applyPendingReferral } from '../features/referral/referralService'

const STEPS = [
  { key: 'identity', label: 'Identité', icon: FiUser },
  { key: 'language', label: 'Langue & pays', icon: FiGlobe },
  { key: 'security', label: 'Résidence', icon: FiShield },
  { key: 'verification', label: 'Vérification', icon: FiCheck },
]

const LANGUAGE_TILES = LANGUAGE_LABELS
import { OTP_RESEND_COOLDOWN_SECONDS } from '@moxt/shared/auth/otpCooldown.js'
import {
  clearPendingRegistration,
  loadPendingRegistration,
  savePendingRegistration,
} from '@moxt/shared/auth/pendingRegistration.js'

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
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const store = useStore()
  const authUser = useSelector((state) => state.auth.user)
  const { language, setLanguage, t } = useLanguage()
  const { error, status } = useSelector((state) => state.auth)
  const [oauthCompletion, setOauthCompletion] = useState(false)
  const [step, setStep] = useState(1)
  const [pendingVerification, setPendingVerification] = useState(null) // { method, phone?, email }
  const [verificationCode, setVerificationCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [otpCapMessage, setOtpCapMessage] = useState('')
  // Blocks the "already logged-in" auto-landing effect while we navigate to Security after OTP.
  const completingPhoneOtpRef = useRef(false)
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()
  const { countries } = useGeographyOptions()
  const alreadyRegistered = error === 'ALREADY_REGISTERED'
  const identityLimitReached = error === 'IDENTITY_LIMIT_REACHED'

  useEffect(() => {
    return () => dispatch(clearAuthError())
  }, [dispatch])

  useEffect(() => {
    const inviteCode = searchParams.get('invite')
    if (inviteCode) {
      storePendingInviteCode(inviteCode)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'loading' || !authUser || !isProfileComplete(authUser)) return
    if (oauthCompletion || pendingVerification || completingPhoneOtpRef.current) return

    void (async () => {
      await applyPendingReferral()
      navigate(resolveAuthenticatedLanding(searchParams, location.state), { replace: true })
    })()
  }, [authUser, location.state, navigate, oauthCompletion, pendingVerification, searchParams, status])

  // Les erreurs d'inscription passent uniquement par des toasts (aucun message
  // inline en double sur la page).
  useEffect(() => {
    if (!error) return
    const errorText = String(error || '')
    const otpLimited = /Limite atteinte|Patientez \d+ secondes/i.test(errorText)
    if (alreadyRegistered) {
      dispatch(
        addToast({
          title: 'Compte déjà existant',
          message:
            'Un compte existe déjà avec cet e-mail ou ce numéro russe. Allez sur Connexion avec votre mot de passe, ou utilisez d’autres identifiants. Si l’inscription SMS était inachevée, réessayez : le code OTP peut reprendre.',
          tone: 'error',
        }),
      )
    } else if (identityLimitReached) {
      dispatch(
        addToast({
          title: 'Réinscription impossible',
          message:
            'Cet e-mail ou ce numéro a déjà servi à deux comptes MOXT. Après suppression, une seule réinscription est possible avec les mêmes identifiants.',
          tone: 'error',
        }),
      )
    } else if (otpLimited) {
      // 90s / 3-par-3h : message explicite, jamais le toast opaque « Inscription impossible ».
      setOtpCapMessage(errorText)
      dispatch(
        addToast({
          title: 'Envoi limité',
          message: errorText,
          tone: 'warning',
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

  async function completeRegistration(destination) {
    await applyPendingReferral()
    await dispatch(loadAllData())
    const registeredUserId = store.getState().auth.user?.id
    if (registeredUserId) {
      dispatch(
        updateAccountPreferences({
          userId: registeredUserId,
          preferences: { language },
        }),
      )
    }
    startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
    markWelcomePending()
    clearReturnTo()
    navigate(destination, { replace: true })
  }

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
        triggerBurst()
        dispatch(
          addToast({
            title: 'Profil complété',
            message: 'Votre profil est complet. Bienvenue sur MOXT.',
            tone: 'success',
          }),
        )
        const destination = resolveReturnTo(searchParams, location.state)
        await completeRegistration(destination)
        return
      }

      // If OTP already pending, never re-signUp — keep form state and stay on step 4.
      if (pendingVerification?.phone) {
        setStep(4)
        dispatch(
          addToast({
            title: 'Code déjà envoyé',
            message: 'Saisissez le code SMS reçu, ou renvoyez-en un après le délai.',
            tone: 'info',
          }),
        )
        return
      }

      const result = await dispatch(register(values))
      if (!register.fulfilled.match(result)) {
        const payload = String(result.payload || '')
        if (/Limite atteinte|Patientez \d+ secondes/i.test(payload)) {
          setOtpCapMessage(payload)
        }
        // Ensure the toast always carries the real rejected payload (not a blank generic).
        if (payload && payload !== 'ALREADY_REGISTERED' && payload !== 'IDENTITY_LIMIT_REACHED') {
          console.warn('[MOXT] Inscription rejetée:', payload)
        }
        return
      }
      dispatch(clearAuthError())
      setOtpCapMessage('')
      if (result.payload.requiresPhoneConfirmation) {
        const pending = {
          method: 'phone',
          phone: result.payload.phone,
          email: result.payload.email,
          pendingUserId: result.payload.pendingUserId,
          firstName: values.firstName,
          lastName: values.lastName,
          originPhone: values.originPhone,
          originCountry: values.originCountry,
          residenceCity: values.residenceCity,
          avatarUrl: values.avatarUrl,
          step: 4,
        }
        savePendingRegistration(pending)
        setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
        setPendingVerification({
          method: 'phone',
          phone: result.payload.phone,
          email: result.payload.email,
          pendingUserId: result.payload.pendingUserId,
        })
        setStep(4)
        return
      }
      const destination = resolveReturnTo(searchParams, location.state)
      await completeRegistration(destination)
    },
  })

  // Restore pending OTP signup after failed code / refresh (sessionStorage, no password).
  useEffect(() => {
    const pending = loadPendingRegistration()
    if (!pending?.phone && !pending?.email) return
    setPendingVerification({
      method: pending.method || 'phone',
      phone: pending.phone,
      email: pending.email,
      pendingUserId: pending.pendingUserId,
    })
    setStep(pending.step || 4)
    formik.setValues((current) => ({
      ...current,
      firstName: pending.firstName || current.firstName,
      lastName: pending.lastName || current.lastName,
      email: pending.email || current.email,
      russianPhone: pending.phone || current.russianPhone,
      originPhone: pending.originPhone || current.originPhone,
      originCountry: pending.originCountry || current.originCountry,
      residenceCity: pending.residenceCity || current.residenceCity,
      avatarUrl: pending.avatarUrl || current.avatarUrl,
      verificationMethod: 'phone',
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once on mount
  }, [])
  useEffect(() => {
    if (!authUser || pendingVerification || !needsRegisterProfileCompletion(authUser)) return
    setOauthCompletion(true)
    const missingPhone = needsOAuthProfileCompletion(authUser)
    const missingIdentity =
      String(authUser.firstName || '').trim().length < 2 ||
      String(authUser.lastName || '').trim().length < 2
    setStep(missingIdentity || missingPhone ? 2 : 3)
    formik.setValues((current) => ({
      ...current,
      firstName: authUser.firstName || current.firstName,
      lastName: authUser.lastName || current.lastName,
      email: authUser.email || current.email,
      avatarUrl: authUser.avatarUrl || current.avatarUrl,
      originCountry: authUser.originCountry || current.originCountry,
      residenceCity: authUser.city || current.residenceCity,
      russianPhone:
        authUser.phone && authUser.phone !== '+7' ? authUser.phone : current.russianPhone,
      originPhone: authUser.secondaryPhone || current.originPhone,
    }))
  }, [authUser, formik.setValues, pendingVerification])

  async function resendVerificationCode() {
    if (!pendingVerification || resendCooldown > 0) return

    // Preserve pending profile fields on every resend.
    savePendingRegistration({
      ...pendingVerification,
      firstName: formik.values.firstName,
      lastName: formik.values.lastName,
      originPhone: formik.values.originPhone,
      originCountry: formik.values.originCountry,
      residenceCity: formik.values.residenceCity,
      avatarUrl: formik.values.avatarUrl,
      step: 4,
    })

    const result = await dispatch(resendPhoneRegistrationOtp(pendingVerification.phone))
    if (resendPhoneRegistrationOtp.fulfilled.match(result)) {
      dispatch(clearAuthError())
      setOtpCapMessage('')
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
      dispatch(
        addToast({
          title: t('auth.register.codeResentTitle'),
          message: t('auth.register.codeResentSms', { phone: pendingVerification.phone }),
          tone: 'success',
        }),
      )
    } else {
      const payload = String(result.payload || '')
      if (/Limite atteinte|Patientez \d+ secondes/i.test(payload)) {
        setOtpCapMessage(payload)
      }
    }
  }

  async function confirmCode() {
    if (!pendingVerification || !/^\d{6}$/.test(verificationCode)) return

    const result = await dispatch(
      verifyPhoneRegistration({
        phone: pendingVerification.phone,
        email: pendingVerification.email || formik.values.email,
        token: verificationCode,
        profileDetails: {
          firstName: formik.values.firstName || pendingVerification.firstName,
          lastName: formik.values.lastName || pendingVerification.lastName,
          originPhone: formik.values.originPhone || pendingVerification.originPhone,
          originCountry: formik.values.originCountry || pendingVerification.originCountry,
          residenceCity: formik.values.residenceCity || pendingVerification.residenceCity,
          avatarUrl: formik.values.avatarUrl || pendingVerification.avatarUrl,
        },
      }),
    )
    if (verifyPhoneRegistration.fulfilled.match(result)) {
      // Set before clearing pendingVerification so the auto-landing effect cannot
      // race to /profile or returnTo ahead of Security email verify.
      completingPhoneOtpRef.current = true
      dispatch(clearAuthError())
      clearPendingRegistration()
      setPendingVerification(null)
      setVerificationCode('')
      triggerBurst()
      dispatch(
        addToast({
          title: 'Compte créé',
          message:
            'Numéro confirmé. Il ne reste plus qu’à confirmer votre e-mail dans Sécurité (pas de re-vérification téléphone).',
          tone: 'success',
        }),
      )
      await completeRegistration(POST_PHONE_OTP_LANDING)
    }
    // Failed OTP: keep pendingVerification + form values for the next code.
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

  /** Leave signup for login — always allowed (OTP wait, cooldown, incomplete OAuth). */
  async function goToLogin(event) {
    const loginState =
      pendingVerification?.method === 'phone'
        ? {
            notice:
              'Si l’inscription est terminée, connectez-vous avec votre numéro +7 et le mot de passe choisi. Sinon, saisissez d’abord le code SMS reçu ci-dessus.',
          }
        : undefined
    clearPendingRegistration()
    setPendingVerification(null)
    setVerificationCode('')
    setOtpCapMessage('')
    setResendCooldown(0)
    dispatch(clearAuthError())

    // Let the browser open a new tab (ctrl/meta/middle-click).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }

    event.preventDefault()
    // Incomplete OAuth / stray signup session would bounce login → dashboard → register.
    if (authUser) {
      await dispatch(logout())
    }
    navigate('/login', { replace: true, state: loginState })
  }

  return (
    <AuthCard
      compact
      eyebrow={oauthCompletion ? 'MOXT · Profil' : 'MOXT · Inscription'}
      title={oauthCompletion ? 'Complétez votre profil' : 'Créer votre compte MOXT'}
      description={
        oauthCompletion
          ? 'Ajoutez votre pays, ville et numéro russe pour utiliser MOXT.'
          : 'E-mail obligatoire, confirmation du compte par SMS sur votre numéro +7.'
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
                  required
                  readOnly={Boolean(String(formik.values.email || '').includes('@'))}
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
                      onClick={() => {
                        setLanguage(code)
                        const uid = authUser?.id || store.getState().auth.user?.id
                        if (uid) {
                          dispatch(
                            updateAccountPreferences({
                              userId: uid,
                              preferences: { language: code },
                            }),
                          )
                        }
                      }}
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
            <div className="grid min-w-0 gap-3">
              <Input
                id="russianPhone"
                label="Numéro russe (+7)"
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
                label="Numéro local (pays d'origine)"
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
                <Link className="auth-flow-link" to="/legal/cgu" target="_blank" rel="noreferrer">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link className="auth-flow-link" to="/legal/privacy" target="_blank" rel="noreferrer">
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
                <Button type="submit" icon={FiCheck} loading={status === 'loading'}>
                  {status === 'loading' ? 'Envoi du SMS...' : 'Créer mon compte'}
                </Button>
              )}
            </div>
          </>
        ) : null}

        {step === 4 && !oauthCompletion && pendingVerification ? (
          <>
            <Alert title="Confirmez votre numéro" variant="info">
              Un code à 6 chiffres a été envoyé au {pendingVerification.phone} par SMS. Un seul code
              à la fois — le compte est créé après confirmation.
            </Alert>
            {otpCapMessage ? (
              <Alert title="Envoi limité" variant="warning">
                {otpCapMessage}
              </Alert>
            ) : null}
            <Input
              id="verification-code"
              label="Code reçu par SMS"
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
              disabled={status === 'loading' || verificationCode.length !== 6}
              onClick={confirmCode}
            >
              Confirmer et accéder à MOXT
            </Button>
            <div className="grid gap-2 text-center">
              <p className="text-sm text-[var(--app-text-muted)]">
                {t('auth.register.codeNotReceivedSms')}
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
                  : t('auth.register.resendSms')}
              </Button>
              <button
                type="button"
                className="text-sm font-bold text-[var(--app-text-muted)] underline-offset-2 hover:underline"
                onClick={() => {
                  clearPendingRegistration()
                  setPendingVerification(null)
                  setVerificationCode('')
                  setOtpCapMessage('')
                  setStep(3)
                  dispatch(clearAuthError())
                }}
              >
                {t('auth.register.abandonOtp')}
              </button>
            </div>
          </>
        ) : null}
      </form>
      <p className="mt-3 text-center text-sm text-[var(--app-text-muted)]">
        Vous avez déjà un compte ?{' '}
        <Link
          className="font-bold text-brand-700 dark:text-brand-300"
          to="/login"
          onClick={goToLogin}
        >
          Se connecter
        </Link>
      </p>
    </AuthCard>
  )
}
