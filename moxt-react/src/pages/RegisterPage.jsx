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
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { GoogleButton } from '../components/auth/GoogleButton'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Select } from '../components/ui/Select'
import { CitySelector } from '../components/ui/CitySelector'
import { flagEmoji } from '../config/flags'
import { constrainPhone, phonePrefixForCallingCode } from '../config/phone'
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../config/uiTranslations'
import { useLanguage } from '../contexts/useLanguage'
import { registerSchema, registerStepFields } from '../features/auth/authSchemas'
import { authService } from '../features/auth/authService'
import {
  clearAuthError,
  register,
  verifyEmailRegistration,
  verifyPhoneRegistration,
} from '../features/auth/authSlice'
import { addToast } from '../features/ui/uiSlice'
import { loadAllData } from '../app/loadAllData'
import { startRealtimeSubscription } from '../services/realtimeService'
import { useGeographyOptions } from '../hooks/useGeographyOptions'

const STEPS = [
  { key: 'identity', label: 'Identité', icon: FiUser },
  { key: 'language', label: 'Langue & pays', icon: FiGlobe },
  { key: 'security', label: 'Résidence', icon: FiShield },
  { key: 'verification', label: 'Vérification', icon: FiCheck },
]

const LANGUAGE_TILES = LANGUAGE_LABELS

/* ─── Stepper visuel — meme pattern que Transfert / Job / Evenement ──────── */
function Stepper({ step }) {
  return (
    <div className="relative mt-4 flex items-start justify-between">
      <div className="absolute left-0 right-0 top-4 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-4 h-px bg-brand-600 transition-all duration-500"
        style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        aria-hidden
      />
      {STEPS.map((s, i) => {
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
  const store = useStore()
  const { language, setLanguage } = useLanguage()
  const { error, status } = useSelector((state) => state.auth)
  const [step, setStep] = useState(1)
  const [pendingVerification, setPendingVerification] = useState(null) // { method, phone?, email }
  const [verificationCode, setVerificationCode] = useState('')
  const { countries } = useGeographyOptions()
  const alreadyRegistered = error === 'ALREADY_REGISTERED'
  const showRegisterError = Boolean(error && !alreadyRegistered && !pendingVerification)

  useEffect(() => {
    return () => dispatch(clearAuthError())
  }, [dispatch])

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
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      const result = await dispatch(register(values))
      if (!register.fulfilled.match(result)) {
        if (
          values.verificationMethod === 'email' &&
          (result.payload || '').toLowerCase().includes('e-mail')
        ) {
          formik.setFieldValue('verificationMethod', 'phone')
          dispatch(clearAuthError())
          dispatch(
            addToast({
              title: 'E-mail indisponible',
              message: 'La vérification par e-mail est indisponible. Nous avons basculé vers le SMS — réessayez.',
              tone: 'warning',
            }),
          )
        }
        return
      }
      dispatch(clearAuthError())
      if (result.payload.requiresPhoneConfirmation) {
        setPendingVerification({ method: 'phone', phone: result.payload.phone, email: result.payload.email })
        return
      }
      if (result.payload.requiresEmailConfirmation) {
        setPendingVerification({ method: 'email', email: result.payload.email })
        return
      }
      await dispatch(loadAllData())
      startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
      navigate('/profile', { replace: true })
    },
  })

  useEffect(() => {
    let cancelled = false

    async function hydrateFromGoogle() {
      const fromGoogle = new URLSearchParams(window.location.search).get('from') === 'google'
      if (!fromGoogle) return

      try {
        const profile = await authService.fetchGoogleProfile()
        if (cancelled) return
        formik.setValues((current) => ({ ...current, ...profile }))
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
          window.history.replaceState({}, '', '/register')
        }
      }
    }

    hydrateFromGoogle()
    return () => {
      cancelled = true
    }
  }, [dispatch, formik.setValues])

  const showVerificationError = Boolean(error && pendingVerification)

  async function confirmCode() {
    if (!/^\d{6}$/.test(verificationCode)) return
    const thunk = pendingVerification.method === 'email' ? verifyEmailRegistration : verifyPhoneRegistration
    const result = await dispatch(thunk({ ...pendingVerification, token: verificationCode }))
    if (thunk.fulfilled.match(result)) {
      dispatch(clearAuthError())
      await dispatch(loadAllData())
      startRealtimeSubscription(store.getState().auth.user.id, dispatch, store.getState)
      if (result.payload.emailLinkDeferred) {
        dispatch(
          addToast({
            title: 'Compte créé',
            message:
              'Votre compte est actif. Vous pourrez confirmer votre e-mail plus tard dans Sécurité.',
            tone: 'success',
          }),
        )
      }
      navigate('/profile', { replace: true })
    }
  }

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === formik.values.originCountry),
    [countries, formik.values.originCountry],
  )
  const errorFor = (field) => (formik.touched[field] ? formik.errors[field] : undefined)

  async function nextStep() {
    const errors = await formik.validateForm()
    const fields = registerStepFields[step] || []
    fields.forEach((field) => formik.setFieldTouched(field, true, false))
    if (!fields.some((field) => errors[field])) setStep((value) => Math.min(value + 1, STEPS.length))
  }

  return (
    <AuthCard
      compact
      eyebrow="Inscription"
      title="Créer votre compte MOXT"
      description="Résidence en Russie : un numéro russe valide est obligatoire."
    >
      <Stepper step={step} />

      {/* @container : le passage en 2 colonnes depend de la largeur reelle de
          la carte, pas du viewport — corrige l'ecrasement des champs sur les
          ecrans intermediaires ou la colonne du formulaire est etroite. */}
      <form className="@container mt-4 grid gap-3" onSubmit={formik.handleSubmit} noValidate>
        {alreadyRegistered ? (
          <Alert variant="error" title="Compte déjà existant">
            Un compte existe déjà avec cet e-mail.{' '}
            <Link className="font-bold underline" to="/login">
              Se connecter
            </Link>{' '}
            ou utilisez un autre e-mail.
          </Alert>
        ) : null}

        {showRegisterError ? <Alert variant="error">{error}</Alert> : null}

        {step === 1 ? (
          <>
            <GoogleButton mode="identity" label="S'inscrire avec Google" />
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-[var(--app-text-faint)]">
              <span className="h-px flex-1 bg-[var(--app-border)]" />
              ou avec votre email
              <span className="h-px flex-1 bg-[var(--app-border)]" />
            </div>

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

            <div className="grid min-w-0 gap-2.5 @md:grid-cols-2">
              <Button type="button" variant="secondary" icon={FiArrowLeft} onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="button" icon={FiArrowRight} onClick={nextStep}>
                Continuer
              </Button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <CitySelector
              id="residenceCity"
              label="Ville de résidence en Russie"
              value={formik.values.residenceCity}
              onChange={(city) => formik.setFieldValue('residenceCity', city)}
              error={errorFor('residenceCity')}
            />
            <div className="grid min-w-0 gap-3 @md:grid-cols-2">
              <Input
                id="russianPhone"
                label="Numéro russe obligatoire"
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
                label="Numéro local (optionnel)"
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
            <div className="grid min-w-0 gap-3 @md:grid-cols-2">
              <PasswordInput
                id="register-password"
                label="Mot de passe"
                autoComplete="new-password"
                {...formik.getFieldProps('password')}
                error={errorFor('password')}
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirmation"
                autoComplete="new-password"
                {...formik.getFieldProps('confirmPassword')}
                error={errorFor('confirmPassword')}
              />
            </div>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 transition-all duration-[var(--transition-fast)] ${
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
              <span className="text-sm text-[var(--app-text-2)]">
                J'accepte les conditions d'utilisation et la politique de confidentialité.
              </span>
            </label>
            {errorFor('acceptTerms') ? (
              <span role="alert" className="-mt-2 text-xs text-red-600">{errorFor('acceptTerms')}</span>
            ) : null}

            <div className="flex items-center gap-1.5 rounded-2xl bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-bold">
              <span className="text-base leading-none">{flagEmoji(formik.values.originCountry)}</span>
              {selectedCountry?.name || 'Pays de provenance'}
              <FiArrowRight className="text-xs text-[var(--app-text-faint)]" />
              <span className="text-base leading-none">{flagEmoji('RU')}</span>
              {formik.values.residenceCity || 'Russie'}
            </div>

            <div className="grid min-w-0 gap-3 @md:grid-cols-2">
              <Button type="button" variant="secondary" icon={FiArrowLeft} onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button type="button" icon={FiArrowRight} onClick={nextStep}>
                Continuer
              </Button>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            {pendingVerification ? (
              <>
                <Alert title={pendingVerification.method === 'email' ? 'Confirmez votre e-mail' : 'Confirmez votre numéro'} variant="info">
                  Un code à 6 chiffres a été envoyé
                  {pendingVerification.method === 'email'
                    ? ` à ${pendingVerification.email}.`
                    : ` au ${pendingVerification.phone}.`}
                </Alert>
                {showVerificationError ? <Alert variant="error">{error}</Alert> : null}
                <Input
                  id="verification-code"
                  label={pendingVerification.method === 'email' ? 'Code reçu par e-mail' : 'Code reçu par SMS'}
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
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-black text-[var(--app-text)]">
                    Comment souhaitez-vous confirmer votre compte ?
                  </p>
                  <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                    Le téléphone russe est recommandé. L’autre identifiant pourra être confirmé
                    ensuite dans Sécurité.
                  </p>
                </div>
                <div className="grid gap-3 @md:grid-cols-2">
                  {[
                    {
                      value: 'phone',
                      icon: FiMessageSquare,
                      title: 'Par SMS',
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
                        onClick={() =>
                          formik.setFieldValue('verificationMethod', method.value)
                        }
                      >
                        <Icon className="text-xl" />
                        <strong className="mt-3 block">{method.title}</strong>
                        <span className={`mt-1 block truncate text-xs ${selected ? 'text-white/75' : 'text-[var(--app-text-muted)]'}`}>
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
