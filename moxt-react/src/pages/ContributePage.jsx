import { useMemo, useState } from 'react'
import { FiHeart, FiSend } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { useLanguage } from '../contexts/useLanguage'
import { openAdminSupportChat } from '../features/communications/adminSupportChat'
import { createSimulatedPayment } from '../features/finance/financeSlice'
import { formatMoney } from '../features/transfers/transferUtils'
import { addToast } from '../features/ui/uiSlice'
import { phase3Text } from '../i18n/phase3I18n'

const PRESETS = [100, 300, 500, 1000, 2500, 5000]

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
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const effectiveAmount = useMemo(() => {
    const custom = Number(customAmount)
    if (customAmount !== '' && Number.isFinite(custom) && custom > 0) return custom
    return Number(amount) || 0
  }, [amount, customAmount])

  function choosePreset(value) {
    setAmount(value)
    setCustomAmount('')
  }

  async function submitContribution() {
    if (!user?.id || effectiveAmount <= 0 || submitting) return
    setSubmitting(true)
    const relatedId = `MOXT-${Date.now().toString(36).toUpperCase()}`
    const amountLabel = formatMoney(effectiveAmount, currency)
    dispatch(
      createSimulatedPayment({
        userId: user.id,
        relatedType: 'contribution',
        relatedId,
        amount: effectiveAmount,
        currency,
        status: 'pending',
        note: message.trim() || p3('contribute.defaultNote'),
      }),
    )
    const supportMessage = [
      p3('contribute.chatIntro', { amount: amountLabel }),
      message.trim() ? p3('contribute.chatNote', { note: message.trim() }) : null,
      p3('contribute.chatRef', { id: relatedId }),
    ]
      .filter(Boolean)
      .join('\n')
    try {
      const result = await dispatch(
        openAdminSupportChat({
          subject: p3('contribute.chatSubject', { amount: amountLabel }),
          message: supportMessage,
        }),
      ).unwrap()
      setSubmitted(true)
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
      setSubmitted(true)
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
    <div className="grid min-w-0 max-w-full gap-6 overflow-x-clip">
      <PageHeader
        eyebrow={p3('contribute.eyebrow')}
        title={p3('contribute.title')}
        description={p3('contribute.description')}
        actions={<BackButton fallback="/moxt" />}
      />

      <Card className="grid gap-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            <FiHeart />
          </span>
          <div className="min-w-0">
            <h2 className="font-black">{p3('contribute.heroTitle')}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
              {p3('contribute.heroBody')}
            </p>
          </div>
        </div>

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
            onChange={(event) => setCurrency(event.target.value)}
          >
            <option value="RUB">RUB</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="XOF">XOF</option>
          </Select>
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
          <p className="mt-1">{p3('contribute.howBody')}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{p3('contribute.how1')}</li>
            <li>{p3('contribute.how2')}</li>
            <li>{p3('contribute.how3')}</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            icon={FiSend}
            loading={submitting}
            disabled={!user?.id || effectiveAmount <= 0 || submitting}
            onClick={submitContribution}
          >
            {p3('contribute.submit', { amount: formatMoney(effectiveAmount || 0, currency) })}
          </Button>
          <Link to="/support" className="text-sm font-bold text-brand-700 dark:text-brand-300">
            {p3('contribute.contactSupport')}
          </Link>
        </div>

        {submitted ? (
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {p3('contribute.thanks')}
          </p>
        ) : null}
      </Card>
    </div>
  )
}
