import { useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiHome,
  FiShield,
  FiUpload,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  isEmailVerified,
  isPhoneVerified,
  verificationRequestIsStale,
} from '@moxt/shared/auth/userSecurity.js'
import { BackButton } from '../components/ui/BackButton'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { statusMeta } from '../config/statuses'
import { useLanguage } from '../contexts/useLanguage'
import { addPersonalDocument, submitVerificationRequest } from '../features/account/accountSlice'
import { PhoneVerificationCard } from '../features/security/PhoneVerificationCard'
import { EmailVerificationCard } from '../features/security/EmailVerificationCard'
import { VerificationGuidePanel } from '../features/verification/VerificationGuidePanel'
import { phase3Text } from '../i18n/phase3I18n'
import { storageService } from '../services/storageService'
import { supabase } from '../services/supabaseClient'
import { addToast } from '../features/ui/uiSlice'
import { UploadProgress } from '../components/ui/UploadProgress'
import { FileNameText } from '../components/ui/FileNameText'
import { useUploadProgress } from '../hooks/useUploadProgress'

const LEVEL_VALUES = ['identity', 'enhanced']

const ID_TYPE_VALUES = [
  { value: 'passport', labelKey: 'verification.idTypes.passport' },
  { value: 'residence', labelKey: 'verification.idTypes.residence' },
  { value: 'migration', labelKey: 'verification.idTypes.migration' },
  { value: 'consular', labelKey: 'verification.idTypes.consular' },
]

const RESIDENCE_TYPE_VALUES = [
  { value: 'visa', labelKey: 'verification.residenceTypes.visa' },
  { value: 'vnj', labelKey: 'verification.residenceTypes.vnj' },
  { value: 'rvp', labelKey: 'verification.residenceTypes.rvp' },
  { value: 'rvpo', labelKey: 'verification.residenceTypes.rvpo' },
]

export function VerificationPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const request = useSelector((state) => {
    const userId = state.auth.user?.id
    if (!userId) return null
    return state.account.verificationRequests.find((item) => item.userId === userId)
  })
  const phoneConfirmed = isPhoneVerified(user)
  const emailConfirmed = isEmailVerified(user)
  const requestStale = verificationRequestIsStale(request)

  const [level, setLevel] = useState(request?.level || 'identity')
  const [step, setStep] = useState(1)
  const [idType, setIdType] = useState('passport')
  const [idDoc, setIdDoc] = useState(null)
  const [selfieDoc, setSelfieDoc] = useState(null)
  const [residenceType, setResidenceType] = useState('visa')
  const [residenceDoc, setResidenceDoc] = useState(null)
  const [addressDoc, setAddressDoc] = useState(null)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const { progress: uploadProgress, track: trackUpload } = useUploadProgress()

  const levels = LEVEL_VALUES.map((value) => ({
    value,
    title: p3(`verification.levels.${value}`),
    description: p3(`verification.levels.${value}Desc`),
  }))

  const steps = useMemo(
    () => [
      { key: 'level', label: phase3Text(t, 'verification.steps.level') },
      ...(phoneConfirmed
        ? []
        : [{ key: 'phone', label: phase3Text(t, 'verification.steps.phone') }]),
      ...(emailConfirmed
        ? []
        : [{ key: 'email', label: phase3Text(t, 'verification.steps.email') }]),
      { key: 'identity', label: phase3Text(t, 'verification.steps.identity') },
      { key: 'selfie', label: phase3Text(t, 'verification.steps.selfie') },
      { key: 'residence', label: phase3Text(t, 'verification.steps.residence') },
      ...(level === 'enhanced'
        ? [{ key: 'address', label: phase3Text(t, 'verification.steps.address') }]
        : []),
      { key: 'review', label: phase3Text(t, 'verification.steps.review') },
    ],
    [level, phoneConfirmed, emailConfirmed, t],
  )

  const current = steps[Math.min(step, steps.length) - 1]
  const ready = Boolean(
    idDoc &&
      selfieDoc &&
      residenceDoc &&
      residenceType &&
      phoneConfirmed &&
      emailConfirmed &&
      (level !== 'enhanced' || addressDoc),
  )

  const canContinue = {
    level: true,
    phone: phoneConfirmed,
    email: emailConfirmed,
    identity: Boolean(idType && idDoc),
    selfie: Boolean(selfieDoc),
    residence: Boolean(residenceType && residenceDoc),
    address: Boolean(addressDoc),
    review: ready && privacyConsent,
  }[current.key]

  function next() {
    setStep((value) => Math.min(value + 1, steps.length))
  }
  function back() {
    setStep((value) => Math.max(value - 1, 1))
  }

  async function submit() {
    const documentIds = []
    const persist = async (doc, category) => {
      if (!doc?.file) return
      try {
        const uploaded = await trackUpload((onProgress) =>
          storageService.uploadDocument(user.id, category, doc.file, { onProgress }),
        )
        const action = dispatch(
          addPersonalDocument({
            userId: user.id,
            category,
            name: doc.file.name,
            size: doc.file.size,
            type: doc.file.type,
            url: uploaded?.url || null,
            storagePath: uploaded?.path || null,
          }),
        )
        documentIds.push(action.payload.id)
        const row = action.payload
        const { error } = await supabase.from('personal_documents').upsert(
          {
            id: row.id,
            user_id: row.userId,
            category: row.category || 'identity',
            name: row.name || '',
            size: Number(row.size) || 0,
            type: row.type || 'application/octet-stream',
            url: row.url || null,
            storage_path: row.storagePath || null,
            status: row.status || 'pending_review',
            created_at: row.createdAt || new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
        if (error) console.warn('[Verification] sync différée:', error.message)
      } catch (err) {
        console.warn('[Storage] doc upload failed:', err.message)
      }
    }
    if (!privacyConsent) return

    // Adressage storage : dossiers `{userId}/{category}/…` (pas de `:` — sinon réparation fragile)
    await persist(idDoc, `identity_${idType || 'passport'}`)
    await persist(selfieDoc, 'selfie')
    await persist(residenceDoc, `residence_${residenceType || 'visa'}`)
    if (level === 'enhanced') await persist(addressDoc, 'address')

    dispatch(submitVerificationRequest({ userId: user.id, level, documentIds }))
    dispatch(
      addToast({
        title: p3('verification.toast.sentTitle'),
        message: p3('verification.toast.sentMessage'),
        tone: 'success',
      }),
    )
    setPrivacyConsent(false)
    setStep(1)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        title={p3('verification.title')}
        actions={<BackButton appearance="link" />}
      />

      {!phoneConfirmed ? <PhoneVerificationCard /> : null}
      {!emailConfirmed ? <EmailVerificationCard /> : null}

      {requestStale ? (
        <Alert variant="warning" title={p3('verification.overdue.title')}>
          {p3('verification.overdue.before')}{' '}
          <Link className="font-bold text-brand-700 hover:underline" to="/support">
            {p3('verification.overdue.link')}
          </Link>
          .
        </Alert>
      ) : null}

      {request ? (
        <Card className="grid gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <FiCheckCircle
              className={`shrink-0 text-2xl ${
                request.status === 'rejected' ? 'text-red-600' : 'text-brand-600'
              }`}
            />
            <div className="min-w-0 flex-1">
              <strong className="break-words">
                {p3('verification.request.heading', {
                  level: p3(`verification.levels.${request.level}`),
                })}
              </strong>
              <p className="text-sm text-[var(--app-text-muted)]">
                {p3('verification.request.docs', {
                  count: Array.isArray(request.documentIds) ? request.documentIds.length : 0,
                })}
              </p>
            </div>
            <Badge tone={statusMeta(request.status, t).tone}>
              {statusMeta(request.status, t).label}
            </Badge>
          </div>
          {request.status === 'rejected' ? (
            <Alert variant="error" title={p3('verification.rejected.title')}>
              <p>
                {request.reviewNote
                  ? p3('verification.rejected.reason', { note: request.reviewNote })
                  : p3('verification.rejected.fallback')}
              </p>
              <p className="mt-2">{p3('verification.rejected.hint')}</p>
            </Alert>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-brand-700">
          {p3('verification.stepProgress', {
            step,
            total: steps.length,
            label: current.label,
          })}
        </div>
        <div className="scrollbar-hidden flex items-center gap-2 overflow-x-auto">
          {steps.map((item, index) => {
            const number = index + 1
            const done = step > number
            const active = step === number
            return (
              <div key={item.key} className="flex items-center gap-2">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-brand-700 text-white'
                        : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                  }`}
                >
                  {done ? <FiCheck /> : number}
                </span>
                <span
                  className={`hidden text-sm font-bold sm:inline ${active || done ? '' : 'text-[var(--app-text-muted)]'}`}
                >
                  {item.label}
                </span>
                {number < steps.length ? (
                  <span className="h-px w-4 bg-[var(--app-border)] sm:w-8" />
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="mt-6">
          {current.key === 'level' ? (
            <div>
              <h2 className="font-black">{p3('verification.chooseLevel')}</h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                {p3('verification.chooseLevelHint')}
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {levels.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`rounded-2xl border p-5 text-left transition ${
                      level === item.value
                        ? 'border-brand-500 bg-[var(--app-accent-soft)]'
                        : 'border-[var(--app-border)] bg-[var(--app-surface)] hover:border-brand-300'
                    }`}
                    onClick={() => setLevel(item.value)}
                  >
                    <FiShield className="text-2xl text-brand-600" />
                    <h3 className="mt-4 font-black">{item.title}</h3>
                    <p className="mt-2 text-sm text-[var(--app-text-muted)]">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {current.key === 'phone' ? <PhoneVerificationCard /> : null}
          {current.key === 'email' ? <EmailVerificationCard /> : null}

          {current.key === 'identity' ? (
            <div className="grid gap-4">
              <div>
                <h2 className="font-black">{p3('verification.identity.heading')}</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {p3('verification.identity.hint', {
                    name: `${user.firstName} ${user.lastName}`,
                  })}
                </p>
              </div>
              <Select
                id="id-type"
                label={p3('verification.identity.docType')}
                value={idType}
                onChange={(event) => setIdType(event.target.value)}
              >
                {ID_TYPE_VALUES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {p3(option.labelKey)}
                  </option>
                ))}
              </Select>
              <UploadField
                icon={FiUpload}
                doc={idDoc}
                onFile={setIdDoc}
                label={p3('verification.identity.upload')}
                hint={p3('verification.identity.uploadHint')}
                kbLabel={p3('common.kb')}
              />
              <VerificationGuidePanel type="identity" />
            </div>
          ) : null}

          {current.key === 'selfie' ? (
            <div className="grid gap-4">
              <div>
                <h2 className="font-black">{p3('verification.selfie.heading')}</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {p3('verification.selfie.hint')}
                </p>
              </div>
              <UploadField
                icon={FiCamera}
                doc={selfieDoc}
                onFile={setSelfieDoc}
                label={p3('verification.selfie.upload')}
                hint={p3('verification.selfie.uploadHint')}
                kbLabel={p3('common.kb')}
              />
              <VerificationGuidePanel type="selfie" />
            </div>
          ) : null}

          {current.key === 'residence' ? (
            <div className="grid gap-4">
              <div>
                <h2 className="font-black">{p3('verification.residence.heading')}</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {p3('verification.residence.hint')}
                </p>
              </div>
              <Select
                id="residence-type"
                label={p3('verification.residence.docType')}
                value={residenceType}
                onChange={(event) => setResidenceType(event.target.value)}
              >
                {RESIDENCE_TYPE_VALUES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {p3(option.labelKey)}
                  </option>
                ))}
              </Select>
              <UploadField
                icon={FiFileText}
                doc={residenceDoc}
                onFile={setResidenceDoc}
                label={p3('verification.residence.upload')}
                hint={p3('verification.residence.uploadHint')}
                kbLabel={p3('common.kb')}
              />
              <VerificationGuidePanel type="residence" />
            </div>
          ) : null}

          {current.key === 'address' ? (
            <div className="grid gap-4">
              <div>
                <h2 className="font-black">{p3('verification.address.heading')}</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {p3('verification.address.hint')}
                </p>
              </div>
              <UploadField
                icon={FiHome}
                doc={addressDoc}
                onFile={setAddressDoc}
                label={p3('verification.address.upload')}
                hint={p3('verification.address.uploadHint')}
                kbLabel={p3('common.kb')}
              />
              <VerificationGuidePanel type="address" />
            </div>
          ) : null}

          {current.key === 'review' ? (
            <div className="grid gap-4">
              <h2 className="font-black">{p3('verification.review.heading')}</h2>
              <div className="grid gap-2">
                <Row
                  label={p3('verification.review.level')}
                  value={levels.find((item) => item.value === level)?.title}
                />
                <Row
                  label={p3('verification.review.idDoc')}
                  value={p3(
                    ID_TYPE_VALUES.find((option) => option.value === idType)?.labelKey ||
                      'verification.idTypes.passport',
                  )}
                  ok={Boolean(idDoc)}
                />
                <Row
                  label={p3('verification.review.selfie')}
                  value={p3('verification.review.provided')}
                  ok={Boolean(selfieDoc)}
                />
                <Row
                  label={p3('verification.review.residence')}
                  value={p3(
                    RESIDENCE_TYPE_VALUES.find((option) => option.value === residenceType)
                      ?.labelKey || 'verification.residenceTypes.visa',
                  )}
                  ok={Boolean(residenceDoc)}
                />
                <Row
                  label={p3('verification.review.phone')}
                  value={p3('verification.review.verified')}
                  ok={phoneConfirmed}
                />
                <Row
                  label={p3('verification.review.email')}
                  value={user.email || p3('verification.review.toConfirm')}
                  ok={emailConfirmed}
                />
                {level === 'enhanced' ? (
                  <Row
                    label={p3('verification.review.address')}
                    value={p3('verification.review.provided')}
                    ok={Boolean(addressDoc)}
                  />
                ) : null}
              </div>
              <p className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-xs text-[var(--app-text-muted)]">
                {p3('verification.review.notice')}
              </p>
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border-2 p-3 transition ${
                  privacyConsent
                    ? 'border-brand-500 bg-[var(--app-accent-soft)]'
                    : 'border-[var(--app-border)] hover:border-brand-300'
                }`}
              >
                <input
                  className="mt-0.5 size-4 shrink-0 accent-brand-700"
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(event) => setPrivacyConsent(event.target.checked)}
                />
                <span className="text-xs leading-5 text-[var(--app-text-muted)] sm:text-sm">
                  {t('verification.consent.before')}{' '}
                  <Link
                    className="font-bold text-brand-700 hover:underline"
                    to="/legal/privacy"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('verification.consent.privacyLink')}
                  </Link>{' '}
                  {t('verification.consent.and')}{' '}
                  <Link
                    className="font-bold text-brand-700 hover:underline"
                    to="/legal/cgu"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('verification.consent.termsLink')}
                  </Link>
                  {t('verification.consent.after')}
                </span>
              </label>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-between gap-3">
          {step > 1 ? (
            <Button variant="secondary" icon={FiArrowLeft} onClick={back}>
              {p3('common.previous')}
            </Button>
          ) : (
            <span />
          )}
          {current.key === 'review' ? (
            <Button
              icon={FiCheckCircle}
              disabled={!ready || !privacyConsent || uploadProgress.active}
              loading={uploadProgress.active}
              onClick={submit}
            >
              {p3('verification.submit')}
            </Button>
          ) : (
            <Button icon={FiArrowRight} disabled={!canContinue} onClick={next}>
              {p3('common.continue')}
            </Button>
          )}
        </div>
        {uploadProgress.active ||
        uploadProgress.phase === 'done' ||
        uploadProgress.phase === 'error' ? (
          <UploadProgress progress={uploadProgress} className="mt-4" />
        ) : null}
      </Card>
    </div>
  )
}

function UploadField({ doc, hint, icon: Icon, kbLabel, label, onFile }) {
  return (
    <label className="flex min-w-0 max-w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-[var(--app-border)] p-4 transition hover:border-brand-400">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-accent)]">
        <Icon />
      </span>
      <span className="min-w-0 flex-1 overflow-hidden">
        {doc ? (
          <FileNameText as="strong" name={doc.file.name} className="block text-sm font-bold" maxLength={36} />
        ) : (
          <strong className="block truncate text-sm">{label}</strong>
        )}
        <span className="text-xs text-[var(--app-text-muted)]">
          {doc ? `${Math.ceil(doc.file.size / 1024)} ${kbLabel}` : hint}
        </span>
      </span>
      {doc ? <FiCheckCircle className="shrink-0 text-emerald-500" /> : null}
      <input
        className="sr-only"
        type="file"
        accept="image/*,.pdf"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile({ file })
        }}
      />
    </label>
  )
}

function Row({ label, ok, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--app-surface-muted)] p-3 sm:gap-4 sm:flex-nowrap">
      <span className="min-w-0 text-sm text-[var(--app-text-muted)]">{label}</span>
      <span className="flex min-w-0 items-center gap-2 text-right text-sm font-bold">
        <span className="min-w-0 truncate">{value}</span>
        {ok ? <FiCheckCircle className="shrink-0 text-emerald-500" /> : null}
      </span>
    </div>
  )
}
