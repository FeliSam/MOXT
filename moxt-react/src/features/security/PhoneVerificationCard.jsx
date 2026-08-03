import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiSmartphone } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { flagEmoji } from '../../config/flags'
import { constrainPhone } from '../../config/phone'
import { isPhoneVerified, isValidRussianPhone } from '@moxt/shared/auth/userSecurity.js'
import {
  clearAuthError,
  confirmPhoneVerification,
  requestPhoneVerificationOtp,
} from '../auth/authSlice'
import { authErrorToast } from '../auth/authErrorMessages'
import { submitPhoneAssistRequest } from '../account/accountSlice'
import { addToast } from '../ui/uiSlice'
import { useLanguage } from '../../contexts/useLanguage'
import { OTP_RESEND_COOLDOWN_SECONDS } from '@moxt/shared/auth/otpCooldown.js'

export function PhoneVerificationCard({ className = '' }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const authError = useSelector((state) => state.auth.error)
  const authStatus = useSelector((state) => state.auth.status)
  const phoneAssistRequests = useSelector((state) => state.account.phoneAssistRequests || [])
  const [busy, setBusy] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpType, setOtpType] = useState('phone_change')
  const [phone, setPhone] = useState(user?.phone || '+7')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [assistOpen, setAssistOpen] = useState(false)
  const [assistNote, setAssistNote] = useState('')

  const pendingAssist = useMemo(
    () =>
      phoneAssistRequests.find(
        (item) => item.userId === user?.id && item.status === 'pending',
      ) || null,
    [phoneAssistRequests, user?.id],
  )

  const [prevUserPhone, setPrevUserPhone] = useState(user?.phone)
  if (user?.phone !== prevUserPhone) {
    setPrevUserPhone(user?.phone)
    if (user?.phone && user.phone !== '+7') {
      setPhone(user.phone)
    }
  }

  useEffect(() => {
    if (!authError) return
    dispatch(addToast(authErrorToast(t('security.phone.errorTitle'), authError, 'error', t)))
    dispatch(clearAuthError())
  }, [authError, dispatch, t])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  if (!user) return null

  if (isPhoneVerified(user)) {
    return (
      <Alert variant="success" title={t('security.phone.verifiedTitle')} className={className}>
        {t('security.phone.verifiedBody', { phone: user.phone })}
      </Alert>
    )
  }

  async function sendCode() {
    if (!isValidRussianPhone(phone)) {
      dispatch(
        addToast({
          title: t('security.phone.invalidTitle'),
          message: t('security.phone.invalidBody'),
          tone: 'error',
        }),
      )
      return
    }
    setBusy(true)
    try {
      const result = await dispatch(requestPhoneVerificationOtp(phone))
      if (!requestPhoneVerificationOtp.fulfilled.match(result)) return
      if (result.payload.user) {
        dispatch(
          addToast({
            title: t('security.phone.alreadyConfirmedTitle'),
            message: t('security.phone.alreadyConfirmedBody'),
            tone: 'success',
          }),
        )
        return
      }
      setOtpSent(true)
      setOtp('')
      setOtpType(result.payload.otpType || 'phone_change')
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
      dispatch(clearAuthError())
      dispatch(
        addToast({
          title: t('security.phone.codeSentTitle'),
          message: t('security.phone.codeSentBody', { phone: result.payload.phone }),
          tone: 'info',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  async function confirmCode() {
    if (!/^\d{6}$/.test(otp)) return
    setBusy(true)
    try {
      const result = await dispatch(confirmPhoneVerification({ phone, token: otp, otpType }))
      if (!confirmPhoneVerification.fulfilled.match(result)) return
      setOtp('')
      setOtpSent(false)
      dispatch(
        addToast({
          title: t('security.phone.confirmedTitle'),
          message: t('security.phone.confirmedBody'),
          tone: 'success',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  function openAssist() {
    if (!isValidRussianPhone(phone)) {
      dispatch(
        addToast({
          title: t('security.phone.invalidTitle'),
          message: t('security.phone.invalidBody'),
          tone: 'error',
        }),
      )
      return
    }
    if (pendingAssist) {
      dispatch(
        addToast({
          title: t('security.phone.assistPendingTitle'),
          message: t('security.phone.assistPendingBody'),
          tone: 'warning',
        }),
      )
      return
    }
    setAssistOpen(true)
  }

  function submitAssist() {
    if (pendingAssist) {
      dispatch(
        addToast({
          title: t('security.phone.assistPendingTitle'),
          message: t('security.phone.assistPendingBody'),
          tone: 'warning',
        }),
      )
      setAssistOpen(false)
      return
    }
    dispatch(
      submitPhoneAssistRequest({
        userId: user.id,
        phone,
        note: assistNote,
      }),
    )
    setAssistOpen(false)
    setAssistNote('')
    dispatch(
      addToast({
        title: t('security.phone.assistSentTitle'),
        message: t('security.phone.assistSentBody'),
        tone: 'success',
      }),
    )
  }

  const loading = busy || authStatus === 'loading'
  const sentAlertText = t('security.phone.sentAlert', { phone })
  const sentAlertPhoneIndex = sentAlertText.indexOf(phone)

  return (
    <Card className={`grid min-w-0 gap-4 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <FiSmartphone />
        </span>
        <div className="min-w-0">
          <h2 className="font-black">{t('security.phone.title')}</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">{t('security.phone.description')}</p>
        </div>
      </div>

      {pendingAssist ? (
        <Alert variant="warning" title={t('security.phone.assistPendingTitle')}>
          {t('security.phone.assistPendingBody', { phone: pendingAssist.phone || phone })}
        </Alert>
      ) : null}

      {!otpSent ? (
        <>
          <Input
            id="phone-verify-number"
            label={t('security.phone.numberLabel')}
            type="tel"
            autoComplete="tel"
            placeholder="+7XXXXXXXXXX"
            iconLeft={<span className="text-base leading-none">{flagEmoji('RU')}</span>}
            value={phone}
            onChange={(event) => setPhone(constrainPhone(event.target.value, '+7', 10))}
          />
          <Button type="button" icon={FiSmartphone} loading={loading} onClick={sendCode}>
            {t('security.phone.sendCode')}
          </Button>
        </>
      ) : (
        <>
          <Alert variant="info">
            {sentAlertPhoneIndex >= 0 ? (
              <>
                {sentAlertText.slice(0, sentAlertPhoneIndex)}
                <strong>{phone}</strong>
                {sentAlertText.slice(sentAlertPhoneIndex + phone.length)}
              </>
            ) : (
              sentAlertText
            )}
          </Alert>
          <Input
            id="phone-verify-otp"
            label={t('security.phone.otpLabel')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Button type="button" icon={FiCheckCircle} loading={loading} onClick={confirmCode}>
            {t('security.phone.confirm')}
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="text-sm font-bold text-brand-700 underline-offset-2 hover:underline dark:text-brand-400"
              disabled={resendCooldown > 0 || loading}
              onClick={sendCode}
            >
              {resendCooldown > 0
                ? t('security.phone.resendCooldown', { seconds: resendCooldown })
                : t('security.phone.resend')}
            </button>
          </div>
          <button
            type="button"
            className="text-sm font-bold text-[var(--app-text-muted)] underline-offset-2 hover:underline"
            onClick={() => {
              setOtpSent(false)
              setOtp('')
              setOtpType('phone_change')
              dispatch(clearAuthError())
            }}
          >
            {t('security.phone.changeNumber')}
          </button>
        </>
      )}

      {!pendingAssist ? (
        <button
          type="button"
          onClick={openAssist}
          className="justify-self-start text-left text-sm font-bold text-[var(--app-text-muted)] underline-offset-2 transition hover:text-[var(--app-accent)] hover:underline"
        >
          {t('security.phone.assistCta')}
        </button>
      ) : null}

      <Modal
        open={assistOpen}
        onClose={() => setAssistOpen(false)}
        title={t('security.phone.assistModalTitle')}
      >
        <div className="grid gap-4">
          <p className="text-sm text-[var(--app-text-muted)]">{t('security.phone.assistModalBody')}</p>
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--app-text-faint)]">
              {t('security.phone.assistPhoneLabel')}
            </p>
            <p className="mt-1 text-base font-black">{phone}</p>
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">{t('security.phone.assistNoteLabel')}</span>
            <textarea
              className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
              placeholder={t('security.phone.assistNotePlaceholder')}
              value={assistNote}
              onChange={(e) => setAssistNote(e.target.value.slice(0, 400))}
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setAssistOpen(false)}>
              {t('security.phone.assistCancel')}
            </Button>
            <Button onClick={submitAssist}>{t('security.phone.assistSubmit')}</Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
