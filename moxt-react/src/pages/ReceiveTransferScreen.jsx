import { useState } from 'react'
import { FiArrowLeft, FiCheckCircle, FiClock, FiCopy } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { addToast } from '../features/ui/uiSlice'
import { useTransferReceiveForm } from '../features/transfers/useTransferReceiveForm'
import { canClientDeclareReception } from '../features/transfers/transferActionUtils'
import { formatMoney } from '../features/transfers/transferUtils'
import { ReceiveTransferForm } from '../features/transfers/ReceiveTransferForm'

function copyText(text, dispatch, label, t) {
  if (!text || !navigator.clipboard) return
  navigator.clipboard.writeText(text).then(
    () =>
      dispatch(
        addToast({
          title: t('transfers.receive.copiedTitle'),
          message: t('transfers.receive.copiedMessage', { label }),
          tone: 'success',
        }),
      ),
    () => {},
  )
}

export function ReceiveTransferScreen() {
  const { t } = useLanguage()
  const { transferId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const transfer = useSelector((state) =>
    state.transfers.items.find((item) => item.id === transferId),
  )

  const [submitted, setSubmitted] = useState(false)

  const isSender = Boolean(user?.id && transfer?.userId === user.id)
  const canDeclare = canClientDeclareReception(transfer, isSender)

  const form = useTransferReceiveForm({
    transfer,
    user,
    onSuccess: () => setSubmitted(true),
  })

  if (!transfer) {
    return (
      <div className="grid gap-6">
        <PageHeader title={t('transfers.receive.notFoundTitle')} eyebrow={t('transfers.receive.eyebrowTransfer')} />
        <Card>
          <p className="text-sm text-[var(--app-text-muted)]">
            {t('transfers.receive.notFoundDescription')}
          </p>
          <Link to="/transfers" className="mt-4 inline-flex text-sm font-bold text-brand-700">
            {t('transfers.receive.backToTransfers')}
          </Link>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="mx-auto grid max-w-lg gap-6">
        <Card className="grid gap-4 p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
            <FiCheckCircle className="text-3xl" />
          </span>
          <h1 className="text-xl font-black">{t('transfers.receive.successTitle')}</h1>
          <p className="text-sm text-[var(--app-text-muted)]">
            {t('transfers.receive.successDescription')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" onClick={() => navigate(`/transfers/${transfer.id}`)}>
              {t('transfers.receive.viewTransfer')}
            </Button>
            <Button onClick={() => navigate('/transfers')}>{t('transfers.receive.myTransfers')}</Button>
          </div>
        </Card>
      </div>
    )
  }

  const backLink = (
    <Link
      to={`/transfers/${transfer.id}`}
      state={{ transferView: 'client' }}
      className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm hover:bg-[var(--app-surface-muted)]"
    >
      <FiArrowLeft /> {t('common.back')}
    </Link>
  )

  // Wait for the business to confirm payout before the client can declare receipt.
  if (!canDeclare) {
    const alreadyDeclared = Boolean(transfer.receivedAt)
    return (
      <div className="mx-auto grid max-w-lg gap-6">
        <PageHeader
          eyebrow={t('transfers.receive.eyebrow')}
          title={t('transfers.receive.title')}
          description={t('transfers.receive.description', { id: transfer.id })}
          actions={backLink}
        />
        <Card className="grid gap-4 p-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <FiClock className="text-xl" />
          </span>
          <div>
            <h2 className="text-lg font-black">
              {alreadyDeclared
                ? t('transfers.receive.alreadyDeclaredTitle')
                : t('transfers.receive.waitBusinessTitle')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              {alreadyDeclared
                ? t('transfers.receive.alreadyDeclaredMessage')
                : t('transfers.receive.waitBusinessMessage')}
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate(`/transfers/${transfer.id}`, { state: { transferView: 'client' } })}>
            {t('transfers.receive.viewTransfer')}
          </Button>
        </Card>
      </div>
    )
  }

  const paymentAccount = transfer.exchanger?.paymentAccount
  const paymentDetails = transfer.exchanger?.paymentDetails

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader
        eyebrow={t('transfers.receive.eyebrow')}
        title={t('transfers.receive.title')}
        description={t('transfers.receive.description', { id: transfer.id })}
        actions={backLink}
      />

      <Card className="grid gap-3 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
          {t('transfers.receive.summary')}
        </p>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-[var(--app-text-muted)]">{t('transfers.receive.expectedAmount')}</span>
            <p className="font-black text-brand-700">
              {formatMoney(transfer.amountReceived ?? transfer.receivedAmount, transfer.currencyTo || transfer.toCurrency)}
            </p>
          </div>
          <div>
            <span className="text-[var(--app-text-muted)]">{t('transfers.receive.exchanger')}</span>
            <p className="font-bold">{transfer.exchanger?.name || '—'}</p>
          </div>
        </div>
      </Card>

      {paymentAccount ? (
        <Card className="grid gap-3 border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900 dark:bg-brand-950/20">
          <p className="text-xs font-black uppercase tracking-wide text-brand-800 dark:text-brand-300">
            {t('transfers.receive.receivingAccount')}
          </p>
          <p className="text-sm font-medium">{paymentAccount}</p>
          {paymentDetails ? (
            <dl className="grid gap-1 text-xs text-[var(--app-text-muted)]">
              {paymentDetails.recipientName ? (
                <div>
                  <dt className="inline font-bold">{t('transfers.receive.holder')}: </dt>
                  <dd className="inline">{paymentDetails.recipientName}</dd>
                </div>
              ) : null}
              {paymentDetails.phone ? (
                <div>
                  <dt className="inline font-bold">{t('transfers.receive.phone')}: </dt>
                  <dd className="inline">{paymentDetails.phone}</dd>
                </div>
              ) : null}
              {paymentDetails.method || paymentDetails.bankName ? (
                <div>
                  <dt className="inline font-bold">{t('transfers.receive.method')}: </dt>
                  <dd className="inline">
                    {[paymentDetails.method, paymentDetails.bankName].filter(Boolean).join(' · ')}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={FiCopy}
            onClick={() =>
              copyText(paymentAccount, dispatch, t('transfers.receive.coordinates'), t)
            }
          >
            {t('transfers.receive.copyCoordinates')}
          </Button>
        </Card>
      ) : null}

      <Card className="p-5 sm:p-6">
        <ReceiveTransferForm
          values={form.values}
          errors={form.errors}
          onChange={form.setField}
          onSubmit={form.submit}
          submitting={form.submitting}
          submitLabel={t('transfers.receive.confirm')}
        />
      </Card>
    </div>
  )
}
