import { useState } from 'react'
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiRepeat,
  FiShield,
  FiUsers,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { createOffer } from '../features/p2p/p2pSlice'
import { calculateP2PFee, p2pLimit } from '../features/p2p/p2pUtils'
import { SecurityGatePanel } from '../features/security/SecurityGatePanel'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { transferCurrenciesForCountry } from '../features/transfers/transferConfig'
import { formatMoney } from '../features/transfers/transferUtils'
import { addToast } from '../features/ui/uiSlice'
import { useScrollToTopOnStep } from '../hooks/useScrollToTopOnStep'

const STEPS = [
  { key: 'pair', label: 'Devises', icon: FiRepeat },
  { key: 'amount', label: 'Montant', icon: FiDollarSign },
  { key: 'terms', label: 'Modalités', icon: FiCheckCircle },
]

function Stepper({ step, onGoTo }) {
  return (
    <div className="relative flex items-start justify-between">
      <div className="absolute left-0 right-0 top-5 h-px bg-[var(--app-border)]" aria-hidden />
      <div
        className="absolute left-0 top-5 h-px bg-brand-600 transition-all duration-500"
        style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        aria-hidden
      />
      {STEPS.map((s, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        const Icon = s.icon
        return (
          <button
            key={s.key}
            type="button"
            disabled={n > step}
            onClick={() => n < step && onGoTo(n)}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <span
              className={`grid size-10 place-items-center rounded-full border-2 transition-all duration-300 ${
                done
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : active
                    ? 'border-brand-600 bg-white text-brand-700 shadow-lg shadow-brand-200 dark:bg-slate-900 dark:shadow-none'
                    : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]'
              }`}
            >
              {done ? <FiCheck className="text-sm" /> : <Icon className="text-sm" />}
            </span>
            <span
              className={`text-xs font-bold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-[var(--app-text-muted)]'}`}
            >
              {s.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--app-border)] pb-4">
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
        <Icon className="text-base" />
      </span>
      <h2 className="font-black">{label}</h2>
    </div>
  )
}

export function PublishP2PPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { requireP2PPublish } = useSecurityGate()
  const user = useSelector((state) => state.auth.user)
  const business = useSelector((state) =>
    state.businesses.items.find((item) => item.ownerId === user.id),
  )
  const originCountry = user.originCountry || (user.country !== 'RU' ? user.country : 'BJ')
  const availableCurrencies = transferCurrenciesForCountry(originCountry)

  const [step, setStep] = useState(1)
  useScrollToTopOnStep(step)
  const [errors, setErrors] = useState({})
  const [publishing, setPublishing] = useState(false)
  const [form, setForm] = useState({
    fromCurrency: availableCurrencies[0] || 'RUB',
    toCurrency: availableCurrencies[1] || availableCurrencies[0] || 'XOF',
    amount: '',
    rate: '',
    method: '',
    comment: '',
  })

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(n) {
    const errs = {}
    if (n === 1) {
      if (!form.fromCurrency) errs.fromCurrency = 'Devise proposée obligatoire.'
      if (!form.toCurrency) errs.toCurrency = 'Devise recherchée obligatoire.'
      if (form.fromCurrency === form.toCurrency) {
        errs.toCurrency = 'Choisissez une autre devise.'
      }
    }
    if (n === 2) {
      const amount = Number(form.amount)
      const rate = Number(form.rate)
      if (!form.amount || !(amount > 0)) errs.amount = 'Montant obligatoire.'
      else if (amount > p2pLimit(user, form.fromCurrency)) {
        errs.amount = `Votre plafond est ${formatMoney(p2pLimit(user, form.fromCurrency), form.fromCurrency)}.`
      }
      if (!form.rate || !(rate > 0)) errs.rate = 'Taux obligatoire.'
    }
    if (n === 3) {
      if (!form.method.trim()) errs.method = 'Méthode obligatoire.'
      if (form.comment.trim().length > 300) errs.comment = '300 caractères maximum.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(s + 1, STEPS.length))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1))
  }

  function publish() {
    if (!requireP2PPublish()) return
    if (!validate(1)) {
      setStep(1)
      return
    }
    if (!validate(2)) {
      setStep(2)
      return
    }
    if (!validate(3)) {
      setStep(3)
      return
    }
    setPublishing(true)
    const action = dispatch(
      createOffer({
        ...form,
        ownerId: user.id,
        ownerName: business?.name || `${user.firstName} ${user.lastName}`,
        businessId: business?.id || null,
      }),
    )
    setPublishing(false)
    dispatch(
      addToast({
        title: 'Offre P2P publiée',
        message: 'Votre offre est visible dans les échanges P2P.',
        tone: 'success',
      }),
    )
    navigate(action.payload?.id ? `/p2p/${action.payload.id}` : '/p2p')
  }

  const amountNumber = Number(form.amount)
  const estimatedFee =
    amountNumber > 0 ? calculateP2PFee(amountNumber, form.fromCurrency) : 0

  return (
    <SecurityGatePanel kind="p2p" backTo="/p2p">
      <div className="mx-auto grid max-w-2xl gap-7">
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/p2p')}>
            P2P
          </Button>
          <h1 className="text-xl font-black">Proposer une offre P2P</h1>
        </div>

        <Card className="px-6 py-5">
          <Stepper step={step} onGoTo={setStep} />
        </Card>

        {step === 1 ? (
          <div className="grid gap-5">
            <Card className="grid gap-5">
              <SectionTitle icon={FiRepeat} label="Paire de devises" />
              <p className="text-sm text-[var(--app-text-muted)]">
                Vos échanges P2P sont limités aux devises de votre profil :{' '}
                {availableCurrencies.join(', ')}.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  id="p2p-publish-from"
                  label="Je propose"
                  value={form.fromCurrency}
                  onChange={(event) => set('fromCurrency', event.target.value)}
                  error={errors.fromCurrency}
                >
                  {availableCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
                <Select
                  id="p2p-publish-to"
                  label="Je recherche"
                  value={form.toCurrency}
                  onChange={(event) => set('toCurrency', event.target.value)}
                  error={errors.toCurrency}
                >
                  {availableCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] p-3">
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-xs font-black uppercase tracking-wide">
                    {form.fromCurrency}
                  </p>
                </div>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-white dark:bg-brand-600">
                  <FiArrowRight className="text-xs" />
                </span>
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-xs font-black uppercase tracking-wide">
                    {form.toCurrency}
                  </p>
                </div>
              </div>
            </Card>
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <FiShield className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
              <p className="text-sm text-amber-900 dark:text-amber-200">
                Ne payez jamais en dehors de MOXT et vérifiez l’identité de votre interlocuteur
                avant toute transaction.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5">
            <Card className="grid gap-5">
              <SectionTitle icon={FiDollarSign} label="Montant et taux" />
              <p className="text-sm text-[var(--app-text-muted)]">
                Plafond actuel :{' '}
                {formatMoney(p2pLimit(user, form.fromCurrency), form.fromCurrency)}
              </p>
              <Input
                id="p2p-publish-amount"
                label={`Montant (${form.fromCurrency})`}
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => set('amount', event.target.value)}
                error={errors.amount}
              />
              <Input
                id="p2p-publish-rate"
                label={`Taux proposé (${form.fromCurrency} → ${form.toCurrency})`}
                type="number"
                step="0.0001"
                inputMode="decimal"
                value={form.rate}
                onChange={(event) => set('rate', event.target.value)}
                error={errors.rate}
              />
              {amountNumber > 0 ? (
                <Alert variant="info">
                  Frais estimés : {formatMoney(estimatedFee, form.fromCurrency)}
                </Alert>
              ) : null}
            </Card>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-5">
            <Card className="grid gap-5">
              <SectionTitle icon={FiUsers} label="Modalités de l’échange" />
              <Input
                id="p2p-publish-method"
                label="Méthode"
                placeholder="Mobile Money, banque…"
                value={form.method}
                onChange={(event) => set('method', event.target.value)}
                error={errors.method}
              />
              <Input
                id="p2p-publish-comment"
                label="Conditions (optionnel)"
                placeholder="Horaires, délais, précisions…"
                value={form.comment}
                onChange={(event) => set('comment', event.target.value)}
                error={errors.comment}
              />
            </Card>
            <Card className="grid gap-4">
              <SectionTitle icon={FiCheckCircle} label="Récapitulatif" />
              {[
                ['Je propose', `${form.amount || '—'} ${form.fromCurrency}`],
                ['Je recherche', form.toCurrency],
                ['Taux', form.rate || '—'],
                ['Méthode', form.method || '—'],
                [
                  'Frais estimés',
                  amountNumber > 0 ? formatMoney(estimatedFee, form.fromCurrency) : '—',
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] px-4 py-3"
                >
                  <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
                  <span className="text-right text-sm font-bold">{value}</span>
                </div>
              ))}
              {form.comment.trim() ? (
                <p className="text-sm text-[var(--app-text-muted)]">{form.comment}</p>
              ) : null}
            </Card>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="secondary" icon={FiArrowLeft} onClick={back}>
              Précédent
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length ? (
            <Button icon={FiArrowRight} onClick={next}>
              Continuer
            </Button>
          ) : (
            <Button
              icon={FiCheckCircle}
              onClick={publish}
              loading={publishing}
              disabled={publishing}
            >
              Publier l’offre
            </Button>
          )}
        </div>
      </div>
    </SecurityGatePanel>
  )
}
