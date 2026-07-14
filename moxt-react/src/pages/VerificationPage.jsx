import { useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCamera,
  FiCheck,
  FiCheckCircle,
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
import { storageService } from '../services/storageService'
import { addToast } from '../features/ui/uiSlice'

const levels = [
  {
    value: 'identity',
    title: 'Identité',
    description: 'Pièce d’identité et selfie. Débloque la création d’entreprise et les transferts.',
  },
  {
    value: 'enhanced',
    title: 'Renforcée',
    description: 'Identité + justificatif de domicile. Débloque les plafonds élevés.',
  },
]

const ID_TYPES = [
  { value: 'passport', label: 'Passeport' },
  { value: 'residence', label: 'Carte de séjour russe (ВНЖ / РВП)' },
  { value: 'migration', label: 'Carte de migration / patente' },
  { value: 'consular', label: 'Carte consulaire' },
]

export function VerificationPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const request = useSelector((state) =>
    state.account.verificationRequests.find((item) => item.userId === user.id),
  )
  const phoneConfirmed = isPhoneVerified(user)
  const emailConfirmed = isEmailVerified(user)
  const requestStale = verificationRequestIsStale(request)

  const [level, setLevel] = useState(request?.level || 'identity')
  const [step, setStep] = useState(1)
  const [idType, setIdType] = useState('passport')
  const [idDoc, setIdDoc] = useState(null)
  const [selfieDoc, setSelfieDoc] = useState(null)
  const [addressDoc, setAddressDoc] = useState(null)
  const [privacyConsent, setPrivacyConsent] = useState(false)

  const steps = useMemo(() => {
    const base = [
      { key: 'level', label: 'Niveau' },
      ...(phoneConfirmed ? [] : [{ key: 'phone', label: 'Téléphone' }]),
      ...(emailConfirmed ? [] : [{ key: 'email', label: 'E-mail' }]),
      { key: 'identity', label: 'Identité' },
      { key: 'selfie', label: 'Selfie' },
      ...(level === 'enhanced' ? [{ key: 'address', label: 'Domicile' }] : []),
      { key: 'review', label: 'Confirmation' },
    ]
    return base
  }, [level, phoneConfirmed, emailConfirmed])

  const current = steps[Math.min(step, steps.length) - 1]
  const ready = Boolean(
    idDoc && selfieDoc && phoneConfirmed && emailConfirmed && (level !== 'enhanced' || addressDoc),
  )

  const canContinue = {
    level: true,
    phone: phoneConfirmed,
    email: emailConfirmed,
    identity: Boolean(idType && idDoc),
    selfie: Boolean(selfieDoc),
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
        const uploaded = await storageService.uploadDocument(user.id, category, doc.file)
        const action = dispatch(
          addPersonalDocument({
            userId: user.id,
            category,
            name: doc.file.name,
            size: doc.file.size,
            type: doc.file.type,
            url: uploaded?.url || uploaded,
            storagePath: uploaded?.path || null,
          }),
        )
        documentIds.push(action.payload.id)
      } catch (err) {
        console.warn('[Storage] doc upload failed:', err.message)
      }
    }
    if (!privacyConsent) return

    await persist(idDoc, `identity:${idType}`)
    await persist(selfieDoc, 'selfie')
    if (level === 'enhanced') await persist(addressDoc, 'address')

    dispatch(submitVerificationRequest({ userId: user.id, level, documentIds }))
    dispatch(
      addToast({
        title: 'Dossier envoyé',
        message: 'Votre dossier a été transmis. Notre équipe le traite sous 24 à 48 h.',
        tone: 'success',
      }),
    )
    setPrivacyConsent(false)
    setStep(1)
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Vérification"
        description="Trois niveaux : numéro russe (publication), identité MOXT (entreprise/transferts), renforcée (plafonds élevés)."
        actions={<BackButton appearance="link" />}
      />

      {!phoneConfirmed ? <PhoneVerificationCard /> : null}
      {!emailConfirmed ? <EmailVerificationCard /> : null}

      {requestStale ? (
        <Alert variant="warning" title="Délai de traitement dépassé">
          Votre dossier est en attente depuis plus de 24 h. Contactez l’administrateur via{' '}
          <Link className="font-bold text-brand-700 hover:underline" to="/support">
            le support MOXT
          </Link>
          .
        </Alert>
      ) : null}

      {request ? (
        <Card className="flex items-center gap-4">
          <FiCheckCircle className="text-2xl text-brand-600" />
          <div className="flex-1">
            <strong>Demande {request.level}</strong>
            <p className="text-sm text-[var(--app-text-muted)]">
              {request.documentIds.length} document(s) associé(s)
            </p>
          </div>
          <Badge tone={statusMeta(request.status).tone}>{statusMeta(request.status).label}</Badge>
        </Card>
      ) : null}

      <Card>
        <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-brand-700">
          Étape {step}/{steps.length} · {current.label}
        </div>
        <div className="flex items-center gap-2">
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
              <h2 className="font-black">Choisissez votre niveau</h2>
              <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                Le numéro russe doit déjà être confirmé. Le niveau renforcé débloque des plafonds plus
                élevés.
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
                <h2 className="font-black">Pièce d’identité</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Au nom de <strong>{`${user.firstName} ${user.lastName}`}</strong>.
                </p>
              </div>
              <Select
                id="id-type"
                label="Type de document"
                value={idType}
                onChange={(event) => setIdType(event.target.value)}
              >
                {ID_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <UploadField
                icon={FiUpload}
                doc={idDoc}
                onFile={setIdDoc}
                label="Photo de la pièce d’identité"
                hint="Image ou PDF, recto lisible."
              />
              <VerificationGuidePanel type="identity" />
            </div>
          ) : null}

          {current.key === 'selfie' ? (
            <div className="grid gap-4">
              <div>
                <h2 className="font-black">Selfie de vérification</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Une photo de vous tenant votre pièce, pour confirmer qu’elle vous appartient.
                </p>
              </div>
              <UploadField
                icon={FiCamera}
                doc={selfieDoc}
                onFile={setSelfieDoc}
                label="Ajouter un selfie"
                hint="Visage et document visibles."
              />
              <VerificationGuidePanel type="selfie" />
            </div>
          ) : null}

          {current.key === 'address' ? (
            <div className="grid gap-4">
              <div>
                <h2 className="font-black">Justificatif de domicile</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Enregistrement migratoire, bail ou facture récente en Russie.
                </p>
              </div>
              <UploadField
                icon={FiHome}
                doc={addressDoc}
                onFile={setAddressDoc}
                label="Ajouter un justificatif"
                hint="Document de moins de 3 mois."
              />
              <VerificationGuidePanel type="address" />
            </div>
          ) : null}

          {current.key === 'review' ? (
            <div className="grid gap-4">
              <h2 className="font-black">Confirmation</h2>
              <div className="grid gap-2">
                <Row label="Niveau demandé" value={levels.find((l) => l.value === level)?.title} />
                <Row
                  label="Pièce d’identité"
                  value={ID_TYPES.find((t) => t.value === idType)?.label}
                  ok={Boolean(idDoc)}
                />
                <Row label="Selfie de vérification" value="Fourni" ok={Boolean(selfieDoc)} />
                <Row label="Téléphone russe" value="Vérifié" ok={phoneConfirmed} />
                <Row label="E-mail" value={user.email || 'À confirmer'} ok={emailConfirmed} />
                {level === 'enhanced' ? (
                  <Row label="Justificatif de domicile" value="Fourni" ok={Boolean(addressDoc)} />
                ) : null}
              </div>
              <p className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-xs text-[var(--app-text-muted)]">
                Vérifiez que vos documents respectent les exemples acceptés. Le traitement prend
                généralement 24 à 48 h ouvrées. Au-delà de 24 h en attente, contactez l’administrateur.
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
              Précédent
            </Button>
          ) : (
            <span />
          )}
          {current.key === 'review' ? (
            <Button icon={FiCheckCircle} disabled={!ready || !privacyConsent} onClick={submit}>
              Envoyer le dossier
            </Button>
          ) : (
            <Button icon={FiArrowRight} disabled={!canContinue} onClick={next}>
              Continuer
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function UploadField({ doc, hint, icon: Icon, label, onFile }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[var(--app-border)] p-4 transition hover:border-brand-400">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-accent)]">
        <Icon />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm">{doc ? doc.file.name : label}</strong>
        <span className="text-xs text-[var(--app-text-muted)]">
          {doc ? `${Math.ceil(doc.file.size / 1024)} Ko` : hint}
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
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] p-3">
      <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
      <span className="flex items-center gap-2 text-sm font-bold">
        {value}
        {ok ? <FiCheckCircle className="text-emerald-500" /> : null}
      </span>
    </div>
  )
}
