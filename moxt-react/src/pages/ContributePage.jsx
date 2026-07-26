import { useMemo, useState } from 'react'
import {
  FiCheck,
  FiCopy,
  FiHeart,
  FiPhone,
  FiSend,
  FiShield,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { BackButton } from '../components/ui/BackButton'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { CONTRIBUTE_CHANNELS, CONTRIBUTE_CURRENCIES } from '../config/contributeChannels'
import { useLanguage } from '../contexts/useLanguage'
import { openAdminSupportChat } from '../features/communications/adminSupportChat'
import { createSimulatedPayment } from '../features/finance/financeSlice'
import { formatMoney } from '../features/transfers/transferUtils'
import { addToast } from '../features/ui/uiSlice'
import { phase3Text } from '../i18n/phase3I18n'

const PRESETS = [300, 500, 1000, 2500, 5000]

function accentClasses(accent) {
  if (accent === 'amber') {
    return {
      icon: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      ring: 'hover:border-amber-400/60',
    }
  }
  return {
    icon: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    ring: 'hover:border-teal-400/60',
  }
}

export function ContributePage() {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [amount, setAmount] = useState(500)
  const [customAmount, setCustomAmount] = useState('')
  const [currency, setCurrency] = useState('RUB')
  const [message, setMessage] = useState('')
  const [channelId, setChannelId] = useState(CONTRIBUTE_CHANNELS[0]?.id || '')
  const [copiedId, setCopiedId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reference] = useState(() => `MOXT-${Date.now().toString(36).toUpperCase()}`)

  const effectiveAmount = useMemo(() => {
    const custom = Number(customAmount)
    if (customAmount !== '' && Number.isFinite(custom) && custom > 0) return custom
    return Number(amount) || 0
  }, [amount, customAmount])

  const selectedChannel =
    CONTRIBUTE_CHANNELS.find((channel) => channel.id === channelId) || CONTRIBUTE_CHANNELS[0]

  function choosePreset(value) {
    setAmount(value)
    setCustomAmount('')
  }

  async function copyValue(id, value) {
    try {
      await navigator.clipboard?.writeText(value)
      setCopiedId(id)
      dispatch(
        addToast({
          tone: 'success',
          title: p3('contribute.copiedTitle'),
          message: p3('contribute.copiedBody'),
        }),
      )
      window.setTimeout(() => setCopiedId(''), 1800)
    } catch {
      dispatch(
        addToast({
          tone: 'error',
          title: p3('common.error'),
          message: p3('contribute.copyFailed'),
        }),
      )
    }
  }

  async function confirmContribution() {
    if (!user?.id || effectiveAmount <= 0 || submitting || !selectedChannel) return
    setSubmitting(true)
    const amountLabel = formatMoney(effectiveAmount, currency)
    const paymentAction = dispatch(
      createSimulatedPayment({
        userId: user.id,
        relatedType: 'contribution',
        relatedId: reference,
        amount: effectiveAmount,
        currency,
        status: 'pending',
        note: message.trim() || p3('contribute.defaultNote'),
        channelId: selectedChannel.id,
        channelLabel: p3(selectedChannel.titleKey),
        channelNumber: selectedChannel.displayNumber,
        provider: selectedChannel.banks?.join(' · ') || 'MOXT',
        simulation: false,
      }),
    )
    const paymentId = paymentAction.payload?.id
    const supportMessage = [
      p3('contribute.chatIntro', { amount: amountLabel }),
      p3('contribute.chatChannel', {
        channel: p3(selectedChannel.titleKey),
        number: selectedChannel.displayNumber,
      }),
      p3('contribute.chatHolder', { name: selectedChannel.holderName }),
      selectedChannel.banks?.length
        ? p3('contribute.chatBanks', { banks: selectedChannel.banks.join(', ') })
        : null,
      p3('contribute.chatRef', { id: reference }),
      message.trim() ? p3('contribute.chatNote', { note: message.trim() }) : null,
      p3('contribute.chatProofHint'),
      p3('contribute.chatAdminConfirmHint'),
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const result = await dispatch(
        openAdminSupportChat({
          subject: p3('contribute.chatSubject', { amount: amountLabel }),
          message: supportMessage,
          category: 'contribution',
          contributionRef: reference,
          paymentId,
        }),
      ).unwrap()
      dispatch(
        addToast({
          tone: 'success',
          title: p3('contribute.toastTitle'),
          message: p3('contribute.toastBody', { amount: amountLabel }),
        }),
      )
      if (result?.conversationId) {
        navigate(`/messages?c=${encodeURIComponent(result.conversationId)}`)
      } else {
        navigate('/messages?relatedType=support')
      }
    } catch {
      dispatch(
        addToast({
          tone: 'success',
          title: p3('contribute.toastTitle'),
          message: p3('contribute.toastBody', { amount: amountLabel }),
        }),
      )
      navigate('/support')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid min-w-0 max-w-3xl gap-6 overflow-x-clip">
      <PageHeader
        eyebrow={p3('contribute.eyebrow')}
        title={p3('contribute.title')}
        description={p3('contribute.description')}
        actions={<BackButton fallback="/moxt" />}
      />

      <section className="relative overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in srgb, var(--app-teal) 18%, transparent), transparent 55%)',
          }}
          aria-hidden
        />
        <div className="relative grid gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
              <FiHeart className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="info">{p3('contribute.adminOnlyBadge')}</Badge>
              </div>
              <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
                {p3('contribute.heroTitle')}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--app-text-muted)]">
                {p3('contribute.heroBody')}
              </p>
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-3">
            {['use1', 'use2', 'use3'].map((key) => (
              <li
                key={key}
                className="rounded-2xl bg-[var(--app-surface-muted)] px-3.5 py-3 text-xs font-semibold leading-5 text-[var(--app-text-muted)]"
              >
                {p3(`contribute.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-[-0.02em]">{p3('contribute.payTitle')}</h3>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">{p3('contribute.payBody')}</p>
          </div>
        </div>

        <div className="grid gap-3">
          {CONTRIBUTE_CHANNELS.map((channel) => {
            const active = channel.id === selectedChannel?.id
            const tones = accentClasses(channel.accent)
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => {
                  setChannelId(channel.id)
                  if (channel.currencies?.[0]) setCurrency(channel.currencies[0])
                }}
                className={`grid gap-3 rounded-[var(--radius-card)] border bg-[var(--app-surface)] p-4 text-left shadow-[var(--shadow-card)] transition ${tones.ring} ${
                  active
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-[var(--app-border)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`grid size-10 place-items-center rounded-xl ${tones.icon}`}>
                      <FiPhone />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
                        {p3(channel.regionKey)}
                      </p>
                      <p className="mt-0.5 font-black">{p3(channel.titleKey)}</p>
                      <p className="mt-1 text-sm text-[var(--app-text-muted)]">{p3(channel.hintKey)}</p>
                    </div>
                  </div>
                  {active ? (
                    <span className="grid size-7 place-items-center rounded-full bg-brand-700 text-white">
                      <FiCheck className="size-3.5" />
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--app-surface-muted)] px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
                      {channel.holderName}
                    </p>
                    <p className="mt-0.5 font-mono text-lg font-black tabular-nums tracking-wide">
                      {channel.displayNumber}
                    </p>
                    {channel.banks?.length ? (
                      <p className="mt-1 text-xs font-semibold text-[var(--app-text-muted)]">
                        {channel.banks.join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      copyValue(channel.id, channel.copyValue || channel.displayNumber)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        copyValue(channel.id, channel.copyValue || channel.displayNumber)
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-[var(--app-accent-soft)] dark:text-brand-300"
                  >
                    {copiedId === channel.id ? <FiCheck /> : <FiCopy />}
                    {copiedId === channel.id ? p3('contribute.copiedShort') : p3('contribute.copyNumber')}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-5 rounded-[var(--radius-card-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div>
          <p className="mb-2 text-sm font-bold">{p3('contribute.chooseAmount')}</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((value) => {
              const active = customAmount === '' && amount === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => choosePreset(value)}
                  className={`rounded-2xl border px-3.5 py-2 text-sm font-bold tabular-nums transition ${
                    active
                      ? 'border-brand-500 bg-brand-700 text-white'
                      : 'border-[var(--app-border)] hover:border-brand-400'
                  }`}
                >
                  {formatMoney(value, currency)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="contribute-custom"
            label={p3('contribute.customAmount')}
            type="number"
            min="1"
            step="1"
            placeholder={p3('contribute.customPlaceholder')}
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
          />
          <Select
            id="contribute-currency"
            label={p3('contribute.currency')}
            value={currency}
            onChange={(event) => {
              const next = event.target.value
              setCurrency(next)
              const match = CONTRIBUTE_CHANNELS.find((channel) => channel.currencies?.includes(next))
              if (match) setChannelId(match.id)
            }}
          >
            {CONTRIBUTE_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--app-surface-muted)] px-3.5 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--app-text-faint)]">
              {p3('contribute.referenceLabel')}
            </p>
            <p className="mt-0.5 font-mono text-sm font-black">{reference}</p>
            <p className="mt-1 text-xs text-[var(--app-text-muted)]">{p3('contribute.referenceHint')}</p>
          </div>
          <button
            type="button"
            onClick={() => copyValue('ref', reference)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-bold"
          >
            {copiedId === 'ref' ? <FiCheck /> : <FiCopy />}
            {p3('contribute.copyRef')}
          </button>
        </div>

        <Input
          id="contribute-message"
          label={p3('contribute.message')}
          placeholder={p3('contribute.messagePlaceholder')}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />

        <div className="rounded-2xl bg-[var(--app-surface-muted)] p-4 text-sm leading-6 text-[var(--app-text-muted)]">
          <p className="font-bold text-[var(--app-text)]">{p3('contribute.howTitle')}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>{p3('contribute.how1')}</li>
            <li>{p3('contribute.how2')}</li>
            <li>{p3('contribute.how3')}</li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            icon={FiSend}
            loading={submitting}
            disabled={!user?.id || effectiveAmount <= 0 || submitting}
            onClick={confirmContribution}
          >
            {p3('contribute.submit', { amount: formatMoney(effectiveAmount || 0, currency) })}
          </Button>
          <Link to="/support" className="text-sm font-bold text-brand-700 dark:text-brand-300">
            {p3('contribute.contactSupport')}
          </Link>
        </div>

        <p className="flex items-start gap-2 text-xs leading-5 text-[var(--app-text-faint)]">
          <FiShield className="mt-0.5 shrink-0" aria-hidden />
          {p3('contribute.legal')}
        </p>
      </section>
    </div>
  )
}
