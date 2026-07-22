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
import { LanguageSegment } from '../components/ui/LanguageSegment'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Select } from '../components/ui/Select'
import { CitySelector } from '../components/ui/CitySelector'
import { flagEmoji } from '../config/flags'
import { constrainPhone, phonePrefixForCallingCode } from '../config/phone'
import { useLanguage } from '../contexts/useLanguage'
import {
  createAuthSchemas,
  oauthProfileStepFields,
  registerStepFields,
} from '../features/auth/authSchemas'
import { updateAccountPreferences } from '../features/account/accountSlice'
import { addNotification } from '../features/communications/communicationSlice'
import { getAdminUserIds } from '@moxt/shared/utils/notificationUtils.js'
import {
  clearAuthError,
  completeOAuthProfile,
  logout,
  register,
  registerWithEmailAfterSmsDenied,
  resendEmailRegistrationOtp,
  resendPhoneRegistrationOtp,
  verifyEmailRegistration,
  verifyPhoneRegistration,
} from '../features/auth/authSlice'
import { SMS_NUMBER_PROVIDER_DENIED } from '@moxt/shared/auth/translateAuthError.js'
import { addToast } from '../features/ui/uiSlice'
import {
  authErrorToast,
  sanitizeAuthMessage,
  shouldMuteRegisterErrorToast,
} from '../features/auth/authErrorMessages'
import { MOXT_AUTH_DEV_MODE } from '@moxt/shared/auth/otpCooldown.js'
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
  { key: 'identity', labelKey: 'auth.register.steps.identity', icon: FiUser },
  { key: 'language', labelKey: 'auth.register.steps.language', icon: FiGlobe },
  { key: 'security', labelKey: 'auth.register.steps.security', icon: FiShield },
  { key: 'verification', labelKey: 'auth.register.steps.verification', icon: FiCheck },
]

import { OTP_RESEND_COOLDOWN_SECONDS, SMS_REGISTRATION_MAX_RESENDS } from '@moxt/shared/auth/otpCooldown.js'
import {
  clearPendingRegistration,
  loadPendingRegistration,
  savePendingRegistration,
} from '@moxt/shared/auth/pendingRegistration.js'
import { isValidRussianPhone } from '@moxt/shared/auth/userSecurity.js'
import { authService } from '../features/auth/authService'

/* ─── Stepper visuel — meme pattern que Transfert / Job / Evenement ──────── */
function Stepper({ step, oauthCompletion = false }) {
  const { t } = useLanguage()
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
              {t(s.labelKey)}
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
  const { oauthProfileCompletionSchema, registerSchema } = createAuthSchemas(t)
  const { error, status } = useSelector((state) => state.auth)
  const [oauthCompletion, setOauthCompletion] = useState(false)
  const [step, setStep] = useState(1)
  const [pendingVerification, setPendingVerification] = useState(null) // { method, phone?, email, identityChecked? }
  const [restoringOtpGate, setRestoringOtpGate] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [otpCapMessage, setOtpCapMessage] = useState('')
  /** Inline form error when toast is muted (ex. échec SMS) — évite « ça tourne puis rien ». */
  const [formGateMessage, setFormGateMessage] = useState('')
  /** SMSC refused this MSISDN — offer e-mail OTP instead of SMS. */
  const [emailSmsFallback, setEmailSmsFallback] = useState(false)
  /** Successful SMS resends during this signup (initial send excluded). */
  const [phoneResendCount, setPhoneResendCount] = useState(0)
  // Blocks the "already logged-in" auto-landing effect while we navigate to Security after OTP.
  const completingPhoneOtpRef = useRef(false)
  // Sync locks — Formik does not prevent a second submit before React re-renders loading.
  const registerSubmitLockRef = useRef(false)
  const otpActionLockRef = useRef(false)
  const autoEmailFallbackStartedRef = useRef(false)
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

  // Erreurs d'inscription → toasts (SMS inclus). Seuls les blips réseau OTP restent en sourdine.
  useEffect(() => {
    if (!error) return
    const errorText = String(error || '')
    if (errorText === SMS_NUMBER_PROVIDER_DENIED) {
      setEmailSmsFallback(true)
      setFormGateMessage('')
      setPendingVerification(null)
      dispatch(clearAuthError())
      return
    }
    const otpLimited = /Limite atteinte|Patientez \d+ secondes/i.test(errorText)
    const localizedError = sanitizeAuthMessage(errorText, t)
    if (alreadyRegistered) {
      setFormGateMessage('')
      dispatch(
        addToast({
          title: t('auth.register.toasts.alreadyExistsTitle'),
          message: t('auth.register.toasts.alreadyExistsBody'),
          tone: 'error',
        }),
      )
    } else if (identityLimitReached) {
      setFormGateMessage('')
      dispatch(
        addToast({
          title: t('auth.register.toasts.identityLimitTitle'),
          message: t('auth.register.toasts.identityLimitBody'),
          tone: 'error',
        }),
      )
    } else if (otpLimited) {
      // 90s / 4-par-3h : message explicite, jamais le toast opaque « Inscription impossible ».
      // eslint-disable-next-line react-hooks/set-state-in-effect -- surface OTP cap beside toast
      setOtpCapMessage(localizedError)
      setFormGateMessage('')
      dispatch(
        addToast({
          title: t('auth.register.toasts.otpLimitedTitle'),
          message: localizedError,
          tone: 'warning',
        }),
      )
    } else if (pendingVerification) {
      if (MOXT_AUTH_DEV_MODE) {
        console.warn('[MOXT][dev] verify/register error raw:', error)
      }
      if (!shouldMuteRegisterErrorToast(errorText, t)) {
        setFormGateMessage('')
        dispatch(
          addToast(
            authErrorToast(t('auth.register.toasts.verifyFailedTitle'), error, 'error', t),
          ),
        )
      }
    } else if (oauthCompletion) {
      setFormGateMessage('')
      dispatch(
        addToast(
          authErrorToast(t('auth.register.toasts.oauthFailedTitle'), error, 'error', t),
        ),
      )
    } else {
      setFormGateMessage(localizedError)
      dispatch(
        addToast(
          authErrorToast(t('auth.register.toasts.registerFailedTitle'), error, 'error', t),
        ),
      )
    }
    dispatch(clearAuthError())
  }, [
    alreadyRegistered,
    dispatch,
    error,
    identityLimitReached,
    oauthCompletion,
    pendingVerification,
    t,
  ])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  function prefetchIdentities({ phone, email } = {}) {
    if (oauthCompletion) return
    void authService.prefetchRegistrationIdentities({ phone, email }).catch(() => {})
  }

  async function completeRegistration(destination) {
    const registeredUser = store.getState().auth.user
    const registeredUserId = registeredUser?.id

    // Naviguer tout de suite — ne pas bloquer l'UI sur loadAllData (30+ requêtes).
    markWelcomePending()
    clearReturnTo()
    navigate(destination, { replace: true })

    void applyPendingReferral()
    if (registeredUserId) {
      dispatch(
        updateAccountPreferences({
          userId: registeredUserId,
          preferences: { language },
        }),
      )
      startRealtimeSubscription(registeredUserId, dispatch, store.getState)
    }
    void dispatch(loadAllData())

    if (registeredUser) {
      const name = `${registeredUser.firstName || ''} ${registeredUser.lastName || ''}`.trim()
      const adminIds = getAdminUserIds(store.getState()).filter((id) => id !== registeredUserId)
      for (const adminId of adminIds) {
        dispatch(
          addNotification({
            userId: adminId,
            title: t('shared.notifications.account.newTitle'),
            message: t('shared.notifications.account.newBody', {
              name: name || t('shared.notifications.someone'),
            }),
            type: 'moderation',
            link: '/admin?view=users',
            priority: 'normal',
          }),
        )
      }
    }
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
      // Step 4: Enter key / form submit must confirm OTP — never re-trigger SMS signup.
      if (step === 4 && pendingVerification && !oauthCompletion) {
        await confirmCode()
        return
      }
      if (registerSubmitLockRef.current) return
      registerSubmitLockRef.current = true
      try {
        if (oauthCompletion) {
          const result = await dispatch(completeOAuthProfile(values))
          if (!completeOAuthProfile.fulfilled.match(result)) return
          dispatch(clearAuthError())
          triggerBurst()
          dispatch(
            addToast({
              title: t('auth.register.toasts.profileDoneTitle'),
              message: t('auth.register.toasts.profileDoneBody'),
              tone: 'success',
            }),
          )
          const destination = resolveReturnTo(searchParams, location.state)
          await completeRegistration(destination)
          return
        }

        // OTP uniquement si : n° valide + libre, e-mail libre, pas d’erreur réseau
        // (gate identité + signUp réussis). Sinon rester sur le formulaire.
        setOtpCapMessage('')
        setFormGateMessage('')
        setEmailSmsFallback(false)

        const result = await dispatch(register(values))
        if (!register.fulfilled.match(result)) {
          const payload = String(result.payload || '')
          if (payload === SMS_NUMBER_PROVIDER_DENIED) {
            setEmailSmsFallback(true)
            setPendingVerification(null)
            return
          }
          if (/Limite atteinte|Patientez \d+ secondes/i.test(payload)) {
            setOtpCapMessage(payload)
          }
          if (payload && payload !== 'ALREADY_REGISTERED' && payload !== 'IDENTITY_LIMIT_REACHED') {
            console.warn('[MOXT] Inscription rejetée:', payload)
          }
          // Échec identité / réseau / SMS → jamais l’écran OTP
          // (message inline via useEffect si toast SMS en sourdine)
          setPendingVerification(null)
          return
        }
        dispatch(clearAuthError())
        setFormGateMessage('')
        const payload = result.payload || {}
        const canOpenOtp =
          payload.requiresPhoneConfirmation === true &&
          payload.identityChecked === true &&
          Boolean(payload.phone) &&
          Boolean(payload.email)
        if (canOpenOtp) {
          const pending = {
            method: 'phone',
            phone: payload.phone,
            email: payload.email,
            pendingUserId: payload.pendingUserId,
            firstName: values.firstName,
            lastName: values.lastName,
            originPhone: values.originPhone,
            originCountry: values.originCountry,
            residenceCity: values.residenceCity,
            avatarUrl: values.avatarUrl,
            phoneResendCount: 0,
            step: 4,
          }
          savePendingRegistration(pending)
          setPhoneResendCount(0)
          autoEmailFallbackStartedRef.current = false
          setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
          setPendingVerification({
            method: 'phone',
            phone: payload.phone,
            email: payload.email,
            pendingUserId: payload.pendingUserId,
            sendingSms: false,
            identityChecked: true,
          })
          setStep(4)
          return
        }
        setPendingVerification(null)
        const destination = resolveReturnTo(searchParams, location.state)
        await completeRegistration(destination)
      } finally {
        registerSubmitLockRef.current = false
      }
    },
  })

  const authBusy = status === 'loading' || formik.isSubmitting

  // After the only SMS resend + 90s wait without verification → switch to e-mail automatically.
  useEffect(() => {
    if (
      !pendingVerification ||
      pendingVerification.method !== 'phone' ||
      phoneResendCount < SMS_REGISTRATION_MAX_RESENDS ||
      resendCooldown > 0 ||
      authBusy ||
      autoEmailFallbackStartedRef.current
    ) {
      return
    }
    autoEmailFallbackStartedRef.current = true
    void startEmailOtpFallback({ reason: 'sms_resend_limit' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional gate on cooldown/resend count
  }, [authBusy, pendingVerification, phoneResendCount, resendCooldown])

  // Restore pending OTP signup after failed code / refresh (sessionStorage, no password).
  // Never show the OTP step until the phone is re-checked as still eligible.
  useEffect(() => {
    const pending = loadPendingRegistration()
    if (!pending?.phone && !pending?.email) return

    let cancelled = false
    setRestoringOtpGate(true)
    setStep(3)

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

    void (async () => {
      try {
        await authService.assertRegistrationIdentitiesEligible(
          {
            phone: pending.phone,
            email: pending.email,
          },
          { useCache: false },
        )
        if (cancelled) return
        setPendingVerification({
          method: pending.method || 'phone',
          phone: pending.phone,
          email: pending.email,
          pendingUserId: pending.pendingUserId,
          identityChecked: true,
        })
        setPhoneResendCount(Number(pending.phoneResendCount) || 0)
        setStep(pending.step || 4)
      } catch (error) {
        if (cancelled) return
        clearPendingRegistration()
        setPendingVerification(null)
        setStep(3)
        const message = String(error?.message || error || '')
        if (!shouldMuteRegisterErrorToast(message, t)) {
          dispatch(
            addToast(
              authErrorToast(t('auth.register.toasts.registerFailedTitle'), message, 'error', t),
            ),
          )
        }
      } finally {
        if (!cancelled) setRestoringOtpGate(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once on mount
  }, [])
  useEffect(() => {
    if (!authUser || pendingVerification || !needsRegisterProfileCompletion(authUser)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync OAuth profile completion UI
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formik identity changes every render
  }, [authUser, formik.setValues, pendingVerification])

  async function startEmailOtpFallback({ reason } = {}) {
    if (registerSubmitLockRef.current || authBusy) {
      autoEmailFallbackStartedRef.current = false
      return
    }
    registerSubmitLockRef.current = true
    try {
      setOtpCapMessage('')
      setFormGateMessage('')
      const result = await dispatch(
        registerWithEmailAfterSmsDenied({
          ...formik.values,
          skipPhoneEligibilityCheck: reason === 'sms_resend_limit',
          registrationVia:
            reason === 'sms_resend_limit' ? 'email_after_sms_resend_limit' : 'email_after_sms_denied',
        }),
      )
      if (!registerWithEmailAfterSmsDenied.fulfilled.match(result)) {
        autoEmailFallbackStartedRef.current = false
        const payload = String(result.payload || '')
        if (/Limite atteinte|Patientez \d+ secondes/i.test(payload)) {
          setOtpCapMessage(payload)
        }
        return
      }
      const payload = result.payload || {}
      if (!payload.requiresEmailConfirmation || !payload.email) {
        autoEmailFallbackStartedRef.current = false
        return
      }
      dispatch(clearAuthError())
      const pending = {
        method: 'email',
        phone: payload.phone || formik.values.russianPhone,
        email: payload.email,
        pendingUserId: payload.pendingUserId,
        firstName: formik.values.firstName,
        lastName: formik.values.lastName,
        originPhone: formik.values.originPhone,
        originCountry: formik.values.originCountry,
        residenceCity: formik.values.residenceCity,
        avatarUrl: formik.values.avatarUrl,
        identityChecked: true,
        phoneResendCount: 0,
        step: 4,
      }
      savePendingRegistration(pending)
      setPhoneResendCount(0)
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
      setEmailSmsFallback(false)
      setPendingVerification(pending)
      setStep(4)
      setVerificationCode('')
      dispatch(
        addToast({
          title: t('auth.register.emailFallback.switchedTitle'),
          message:
            reason === 'sms_resend_limit'
              ? t('auth.register.emailFallback.afterSmsResends', { email: payload.email })
              : t('auth.register.emailFallback.switchedBody', { email: payload.email }),
          tone: 'info',
        }),
      )
    } finally {
      registerSubmitLockRef.current = false
    }
  }

  async function resendVerificationCode() {
    if (!pendingVerification || authBusy || otpActionLockRef.current) return

    // After 1 initial SMS + 1 resend: offer e-mail immediately (no extra 90s wait).
    const switchToEmail =
      pendingVerification.method === 'phone' &&
      phoneResendCount >= SMS_REGISTRATION_MAX_RESENDS
    if (switchToEmail) {
      await startEmailOtpFallback({ reason: 'sms_resend_limit' })
      return
    }

    if (resendCooldown > 0) return

    otpActionLockRef.current = true

    // Preserve pending profile fields on every resend.
    savePendingRegistration({
      ...pendingVerification,
      firstName: formik.values.firstName,
      lastName: formik.values.lastName,
      originPhone: formik.values.originPhone,
      originCountry: formik.values.originCountry,
      residenceCity: formik.values.residenceCity,
      avatarUrl: formik.values.avatarUrl,
      phoneResendCount,
      step: 4,
    })

    try {
      const isEmail = pendingVerification.method === 'email'
      const result = isEmail
        ? await dispatch(resendEmailRegistrationOtp(pendingVerification.email))
        : await dispatch(resendPhoneRegistrationOtp(pendingVerification.phone))
      const ok = isEmail
        ? resendEmailRegistrationOtp.fulfilled.match(result)
        : resendPhoneRegistrationOtp.fulfilled.match(result)
      if (ok) {
        dispatch(clearAuthError())
        setOtpCapMessage('')
        setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
        let nextPhoneResends = phoneResendCount
        if (!isEmail) {
          nextPhoneResends = phoneResendCount + 1
          setPhoneResendCount(nextPhoneResends)
          savePendingRegistration({
            ...pendingVerification,
            firstName: formik.values.firstName,
            lastName: formik.values.lastName,
            originPhone: formik.values.originPhone,
            originCountry: formik.values.originCountry,
            residenceCity: formik.values.residenceCity,
            avatarUrl: formik.values.avatarUrl,
            phoneResendCount: nextPhoneResends,
            step: 4,
          })
        }
        dispatch(
          addToast({
            title: t('auth.register.codeResentTitle'),
            message: isEmail
              ? t('auth.register.codeResentEmail', { email: pendingVerification.email })
              : t('auth.register.codeResentSms', { phone: pendingVerification.phone }),
            tone: 'success',
          }),
        )
      } else {
        const payload = String(result.payload || t('auth.register.toasts.resendFailedFallback'))
        if (/Limite atteinte|Patientez \d+ secondes/i.test(payload)) {
          setOtpCapMessage(sanitizeAuthMessage(payload, t))
        }
        if (!shouldMuteRegisterErrorToast(payload, t)) {
          dispatch(
            addToast(
              authErrorToast(t('auth.register.toasts.resendFailedTitle'), payload, 'error', t),
            ),
          )
        }
      }
    } finally {
      otpActionLockRef.current = false
    }
  }

  async function confirmCode() {
    if (
      !pendingVerification ||
      !/^\d{6}$/.test(verificationCode) ||
      authBusy ||
      otpActionLockRef.current
    ) {
      return
    }
    otpActionLockRef.current = true

    try {
      const profileDetails = {
        firstName: formik.values.firstName || pendingVerification.firstName,
        lastName: formik.values.lastName || pendingVerification.lastName,
        originPhone: formik.values.originPhone || pendingVerification.originPhone,
        originCountry: formik.values.originCountry || pendingVerification.originCountry,
        residenceCity: formik.values.residenceCity || pendingVerification.residenceCity,
        avatarUrl: formik.values.avatarUrl || pendingVerification.avatarUrl,
        russianPhone: formik.values.russianPhone || pendingVerification.phone,
      }

      if (pendingVerification.method === 'email') {
        const result = await dispatch(
          verifyEmailRegistration({
            email: pendingVerification.email || formik.values.email,
            token: verificationCode,
            profileDetails,
          }),
        )
        if (verifyEmailRegistration.fulfilled.match(result)) {
          completingPhoneOtpRef.current = true
          dispatch(clearAuthError())
          clearPendingRegistration()
          setPendingVerification(null)
          setVerificationCode('')
          setEmailSmsFallback(false)
          triggerBurst()
          dispatch(
            addToast({
              title: t('auth.register.toasts.welcomeTitle'),
              message: t('auth.register.toasts.welcomeEmailBody'),
              tone: 'success',
            }),
          )
          if (result.payload?.phoneLinkDeferred) {
            dispatch(
              addToast({
                title: t('auth.register.toasts.phonePendingTitle'),
                message: t('auth.register.toasts.phonePendingBody'),
                tone: 'info',
                link: '/security',
              }),
            )
            await completeRegistration('/security')
            return
          }
          await completeRegistration(POST_PHONE_OTP_LANDING)
        }
        return
      }

      const result = await dispatch(
        verifyPhoneRegistration({
          phone: pendingVerification.phone,
          email: pendingVerification.email || formik.values.email,
          token: verificationCode,
          profileDetails,
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
            title: t('auth.register.toasts.welcomeTitle'),
            message: result.payload?.emailLinkDeferred
              ? t('auth.register.toasts.welcomeDeferredBody')
              : t('auth.register.toasts.welcomeReadyBody'),
            tone: 'success',
          }),
        )
        if (result.payload?.emailLinkDeferred) {
          dispatch(
            addToast({
              title: t('auth.register.toasts.emailPendingTitle'),
              message: t('auth.register.toasts.emailPendingBody'),
              tone: 'info',
              link: '/security',
            }),
          )
        }
        await completeRegistration(POST_PHONE_OTP_LANDING)
      }
      // Failed OTP: keep pendingVerification + form values for the next code.
    } finally {
      otpActionLockRef.current = false
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
      if (!oauthCompletion && step === 1) {
        prefetchIdentities({ email: formik.values.email })
      }
      if (!oauthCompletion && step === 2) {
        prefetchIdentities({
          email: formik.values.email,
          phone: formik.values.russianPhone,
        })
      }
      const maxStep = oauthCompletion ? 3 : STEPS.length
      setStep((value) => Math.min(value + 1, maxStep))
    }
  }

  /** Leave signup for login — always allowed (OTP wait, cooldown, incomplete OAuth). */
  async function goToLogin(event) {
    const loginState =
      pendingVerification?.method === 'phone'
        ? {
            notice: t('auth.register.loginNoticePendingOtp'),
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
      eyebrow={oauthCompletion ? t('auth.register.oauthEyebrow') : t('auth.register.eyebrow')}
      title={oauthCompletion ? t('auth.register.oauthTitle') : t('auth.register.title')}
      description={
        oauthCompletion ? t('auth.register.oauthDescription') : t('auth.register.description')
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
                label={t('auth.register.firstName')}
                autoComplete="given-name"
                {...formik.getFieldProps('firstName')}
                error={errorFor('firstName')}
              />
              <Input
                id="lastName"
                label={t('auth.register.lastName')}
                autoComplete="family-name"
                {...formik.getFieldProps('lastName')}
                error={errorFor('lastName')}
              />
            </div>
            <Input
              id="register-email"
              label={t('auth.register.email')}
              type="email"
              autoComplete="email"
              required
              {...formik.getFieldProps('email')}
              onBlur={(event) => {
                formik.handleBlur(event)
                const email = String(event.target.value || '').trim()
                if (email.includes('@')) prefetchIdentities({ email })
              }}
              error={errorFor('email')}
            />
            <Button type="button" icon={FiArrowRight} onClick={nextStep}>
              {t('auth.register.continue')}
            </Button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            {oauthCompletion ? (
              <div className="grid min-w-0 gap-3 @md:grid-cols-2">
                <Input
                  id="oauth-firstName"
                  label={t('auth.register.firstName')}
                  autoComplete="given-name"
                  {...formik.getFieldProps('firstName')}
                  error={errorFor('firstName')}
                />
                <Input
                  id="oauth-lastName"
                  label={t('auth.register.lastName')}
                  autoComplete="family-name"
                  {...formik.getFieldProps('lastName')}
                  error={errorFor('lastName')}
                />
                <Input
                  id="oauth-email"
                  className="@md:col-span-2"
                  label={t('auth.register.email')}
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
                {t('auth.register.uiLanguage')}
              </p>
              <LanguageSegment
                className="mt-2"
                size="sm"
                value={language}
                ariaLabel={t('auth.register.uiLanguage')}
                onChange={(code) => {
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
              />
            </div>

            <Select
              id="originCountry"
              label={t('auth.register.originCountry')}
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
                  {t('auth.register.back')}
                </Button>
              ) : (
                <span />
              )}
              <Button type="button" icon={FiArrowRight} onClick={nextStep}>
                {t('auth.register.continue')}
              </Button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            {oauthCompletion ? (
              <Alert variant="info">{t('auth.register.oauthLastStepAlert')}</Alert>
            ) : null}
            <CitySelector
              id="residenceCity"
              label={t('auth.register.residenceCity')}
              value={formik.values.residenceCity}
              onChange={(city) => formik.setFieldValue('residenceCity', city)}
              error={errorFor('residenceCity')}
            />
            <div className="grid min-w-0 gap-3">
              <Input
                id="russianPhone"
                label={t('auth.register.russianPhone')}
                type="tel"
                autoComplete="tel"
                placeholder="+7XXXXXXXXXX"
                iconLeft={<span className="text-base leading-none">{flagEmoji('RU')}</span>}
                {...formik.getFieldProps('russianPhone')}
                onChange={(event) =>
                  formik.setFieldValue('russianPhone', constrainPhone(event.target.value, '+7', 10))
                }
                onBlur={(event) => {
                  formik.handleBlur(event)
                  const phone = constrainPhone(event.target.value, '+7', 10)
                  if (isValidRussianPhone(phone)) {
                    prefetchIdentities({
                      phone,
                      email: formik.values.email,
                    })
                  }
                }}
                error={errorFor('russianPhone')}
              />
              <Input
                id="originPhone"
                label={t('auth.register.originPhone')}
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
                  label={t('auth.register.password')}
                  autoComplete="new-password"
                  {...formik.getFieldProps('password')}
                  error={errorFor('password')}
                />
                <PasswordInput
                  id="confirmPassword"
                  label={t('auth.register.confirmPassword')}
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
                {t('auth.register.acceptTermsPrefix')}{' '}
                <Link className="auth-flow-link" to="/legal/cgu" target="_blank" rel="noreferrer">
                  {t('auth.register.termsOfUse')}
                </Link>{' '}
                {t('auth.register.acceptTermsAnd')}{' '}
                <Link className="auth-flow-link" to="/legal/privacy" target="_blank" rel="noreferrer">
                  {t('auth.register.privacyPolicy')}
                </Link>
              </span>
            </label>
            {errorFor('acceptTerms') ? (
              <span role="alert" className="-mt-2 text-xs text-red-600">{errorFor('acceptTerms')}</span>
            ) : null}

            {formGateMessage ? (
              <Alert title={t('auth.register.toasts.registerFailedTitle')} variant="error">
                {formGateMessage}
              </Alert>
            ) : null}

            {emailSmsFallback && !oauthCompletion ? (
              <Alert title={t('auth.register.emailFallback.title')} variant="warning">
                <div className="grid gap-3">
                  <p>{t('auth.register.emailFallback.body')}</p>
                  <p className="font-bold text-[var(--app-text)]">
                    {t('auth.register.emailFallback.emailLabel')}: {formik.values.email}
                  </p>
                  <Button
                    type="button"
                    icon={FiCheck}
                    loading={authBusy}
                    disabled={authBusy}
                    onClick={startEmailOtpFallback}
                  >
                    {t('auth.register.emailFallback.sendButton')}
                  </Button>
                </div>
              </Alert>
            ) : null}

            <div className="hidden items-center gap-1.5 rounded-2xl bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-bold sm:flex">
              <span className="text-base leading-none">{flagEmoji(formik.values.originCountry)}</span>
              {selectedCountry?.name || t('auth.register.fallbackCountry')}
              <FiArrowRight className="text-xs text-[var(--app-text-faint)]" />
              <span className="text-base leading-none">{flagEmoji('RU')}</span>
              {formik.values.residenceCity || t('auth.register.fallbackRussia')}
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
              <Button type="button" variant="secondary" icon={FiArrowLeft} onClick={() => setStep(2)}>
                {t('auth.register.back')}
              </Button>
              {oauthCompletion ? (
                <Button type="submit" icon={FiCheck} loading={authBusy} disabled={authBusy}>
                  {authBusy ? t('auth.register.oauthSubmitting') : t('auth.register.oauthSubmit')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  icon={FiCheck}
                  loading={authBusy || restoringOtpGate}
                  disabled={authBusy || restoringOtpGate}
                >
                  {authBusy || restoringOtpGate
                    ? t('auth.register.submitting')
                    : t('auth.register.submit')}
                </Button>
              )}
            </div>
          </>
        ) : null}

        {step === 4 &&
        !oauthCompletion &&
        pendingVerification?.identityChecked &&
        (pendingVerification?.phone || pendingVerification?.method === 'email') ? (
          <>
            <Alert
              title={
                pendingVerification.method === 'email'
                  ? t('auth.register.verify.emailTitle')
                  : pendingVerification.sendingSms
                    ? t('auth.register.verify.sendingTitle')
                    : t('auth.register.verify.title')
              }
              variant="info"
            >
              {pendingVerification.method === 'email'
                ? t('auth.register.verify.emailBody', { email: pendingVerification.email })
                : pendingVerification.sendingSms
                  ? t('auth.register.verify.sendingBody', { phone: pendingVerification.phone })
                  : t('auth.register.verify.body', { phone: pendingVerification.phone })}
            </Alert>
            {otpCapMessage ? (
              <Alert title={t('auth.register.otpCapTitle')} variant="warning">
                {otpCapMessage}
              </Alert>
            ) : null}
            <Input
              id="verification-code"
              label={
                pendingVerification.method === 'email'
                  ? t('auth.register.verify.emailCodeLabel')
                  : t('auth.register.verify.codeLabel')
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              disabled={pendingVerification.sendingSms}
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
            />
            <Button
              type="button"
              icon={FiCheck}
              loading={authBusy || pendingVerification.sendingSms}
              disabled={
                authBusy ||
                pendingVerification.sendingSms ||
                verificationCode.length !== 6
              }
              onClick={confirmCode}
            >
              {pendingVerification.sendingSms
                ? t('auth.register.verify.sendingAction')
                : t('auth.register.verify.confirm')}
            </Button>
            <div className="grid gap-2 text-center">
              <p className="text-sm text-[var(--app-text-muted)]">
                {pendingVerification.method === 'email'
                  ? t('auth.register.codeNotReceivedEmail')
                  : phoneResendCount >= SMS_REGISTRATION_MAX_RESENDS
                    ? t('auth.register.emailFallback.smsResendLimitHint')
                    : t('auth.register.codeNotReceivedSms')}
              </p>
              {pendingVerification.method === 'phone' &&
              phoneResendCount >= SMS_REGISTRATION_MAX_RESENDS ? (
                <Button
                  type="button"
                  className="w-full"
                  loading={authBusy}
                  disabled={authBusy || pendingVerification.sendingSms}
                  onClick={() => {
                    autoEmailFallbackStartedRef.current = true
                    void startEmailOtpFallback({ reason: 'sms_resend_limit' })
                  }}
                >
                  {t('auth.register.emailFallback.sendButton')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  loading={authBusy && resendCooldown <= 0}
                  disabled={resendCooldown > 0 || authBusy || pendingVerification.sendingSms}
                  onClick={resendVerificationCode}
                >
                  {resendCooldown > 0
                    ? t('auth.register.resendCooldown', { seconds: resendCooldown })
                    : pendingVerification.method === 'email'
                      ? t('auth.register.resendEmail')
                      : t('auth.register.resendSms')}
                </Button>
              )}
              <button
                type="button"
                className="text-sm font-bold text-[var(--app-text-muted)] underline-offset-2 hover:underline"
                onClick={() => {
                  clearPendingRegistration()
                  setPendingVerification(null)
                  setVerificationCode('')
                  setOtpCapMessage('')
                  setEmailSmsFallback(false)
                  setPhoneResendCount(0)
                  autoEmailFallbackStartedRef.current = false
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
        {t('auth.register.haveAccount')}{' '}
        <Link
          className="font-bold text-brand-700 dark:text-brand-300"
          to="/login"
          onClick={goToLogin}
        >
          {t('auth.register.loginLink')}
        </Link>
      </p>
    </AuthCard>
  )
}
