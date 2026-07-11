import { useMemo, useState } from 'react'
import { FiArrowLeft, FiCheckCircle, FiCopy, FiInfo } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { addToast } from '../features/ui/uiSlice'
import { useTransferReceiveForm } from '../features/transfers/useTransferReceiveForm'
import { formatMoney } from '../features/transfers/transferUtils'
import { ReceiveTransferForm } from '../features/transfers/ReceiveTransferForm'

function copyText(text, dispatch, label) {
  if (!text || !navigator.clipboard) return
  navigator.clipboard.writeText(text).then(
    () =>
      dispatch(
        addToast({
          title: 'Copié',
          message: `${label} copié dans le presse-papiers.`,
          tone: 'success',
        }),
      ),
    () => {},
  )
}

export function ReceiveTransferScreen() {
  const { transferId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const transfer = useSelector((state) =>
    state.transfers.items.find((item) => item.id === transferId),
  )
  const walletEntries = useSelector((state) => state.finance.walletEntries)

  const [submitted, setSubmitted] = useState(false)

  const form = useTransferReceiveForm({
    transfer,
    user,
    onSuccess: () => setSubmitted(true),
  })

  const walletBalance = useMemo(() => {
    if (!user?.id) return 0
    return walletEntries
      .filter((entry) => entry.userId === user.id)
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  }, [user?.id, walletEntries])

  if (!transfer) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Réception introuvable" eyebrow="Transfert" />
        <Card>
          <p className="text-sm text-[var(--app-text-muted)]">
            Ce transfert n’existe pas ou n’est plus accessible.
          </p>
          <Link to="/transfers" className="mt-4 inline-flex text-sm font-bold text-brand-700">
            Retour aux transferts
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
          <h1 className="text-xl font-black">Réception enregistrée</h1>
          <p className="text-sm text-[var(--app-text-muted)]">
            Votre déclaration a été transmise. Le changeur pourra valider la réception.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" onClick={() => navigate(`/transfers/${transfer.id}`)}>
              Voir le transfert
            </Button>
            <Button onClick={() => navigate('/transfers')}>Mes transferts</Button>
          </div>
        </Card>
      </div>
    )
  }

  const paymentAccount = transfer.exchanger?.paymentAccount
  const paymentDetails = transfer.exchanger?.paymentDetails

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader
        eyebrow="Réception"
        title="Déclarer la réception"
        description={`Transfert ${transfer.id}`}
        actions={
          <Link
            to={`/transfers/${transfer.id}`}
            state={{ transferView: 'client' }}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm hover:bg-[var(--app-surface-muted)]"
          >
            <FiArrowLeft /> Retour
          </Link>
        }
      />

      <Card className="grid gap-3 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
          Récapitulatif
        </p>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-[var(--app-text-muted)]">Montant reçu attendu</span>
            <p className="font-black text-brand-700">
              {formatMoney(transfer.receivedAmount, transfer.toCurrency)}
            </p>
          </div>
          <div>
            <span className="text-[var(--app-text-muted)]">Changeur</span>
            <p className="font-bold">{transfer.exchanger?.name || '—'}</p>
          </div>
        </div>
      </Card>

      {paymentAccount ? (
        <Card className="grid gap-3 border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900 dark:bg-brand-950/20">
          <p className="text-xs font-black uppercase tracking-wide text-brand-800 dark:text-brand-300">
            Compte de réception
          </p>
          <p className="text-sm font-medium">{paymentAccount}</p>
          {paymentDetails ? (
            <dl className="grid gap-1 text-xs text-[var(--app-text-muted)]">
              {paymentDetails.recipientName ? (
                <div>
                  <dt className="inline font-bold">Titulaire : </dt>
                  <dd className="inline">{paymentDetails.recipientName}</dd>
                </div>
              ) : null}
              {paymentDetails.phone ? (
                <div>
                  <dt className="inline font-bold">Téléphone : </dt>
                  <dd className="inline">{paymentDetails.phone}</dd>
                </div>
              ) : null}
              {paymentDetails.method || paymentDetails.bankName ? (
                <div>
                  <dt className="inline font-bold">Méthode : </dt>
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
            onClick={() => copyText(paymentAccount, dispatch, 'Coordonnées')}
          >
            Copier les coordonnées
          </Button>
        </Card>
      ) : null}

      <Alert variant="info" title="Solde portefeuille (simulation)">
        <span className="flex items-center gap-2">
          <FiInfo />
          Solde actuel : {formatMoney(walletBalance, transfer.toCurrency)} — la réception déclarée
          n’ajuste pas automatiquement ce solde dans cette version.
        </span>
      </Alert>

      <Card className="p-5 sm:p-6">
        <ReceiveTransferForm
          values={form.values}
          errors={form.errors}
          onChange={form.setField}
          onSubmit={form.submit}
          submitting={form.submitting}
          submitLabel="Confirmer la réception"
        />
      </Card>
    </div>
  )
}
