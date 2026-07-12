import { useState } from 'react'
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiStar,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { BackButton } from '../components/ui/BackButton'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { openDispute } from '../features/disputes/disputeSlice'
import { createReceipt } from '../features/finance/financeSlice'
import { addOrderProof, rateOrder, updateOrderStatus } from '../features/p2p/p2pSlice'
import { formatDate, formatMoney } from '../features/transfers/transferUtils'

const orderStatusLabels = {
  created: 'Créée',
  waiting_payment: 'Paiement en cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}
const orderStatusLabel = (status) => orderStatusLabels[status] || status

export function P2POrderPage() {
  const dispatch = useDispatch()
  const [disputeReason, setDisputeReason] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const { orderId } = useParams()
  const user = useSelector((state) => state.auth.user)
  const order = useSelector((state) => state.p2p.orders.find((item) => item.id === orderId))
  const dispute = useSelector((state) =>
    state.disputes.items.find(
      (item) =>
        item.relatedType === 'p2p_order' &&
        item.relatedId === orderId &&
        !['resolved', 'closed'].includes(item.status),
    ),
  )
  if (!order || ![order.buyerId, order.sellerId].includes(user.id))
    return <Card>Transaction introuvable.</Card>

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={order.id}
        title="Transaction P2P"
        description={`${order.sellerName} vers ${order.buyerName}`}
        actions={<BackButton fallback="/p2p" />}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex justify-between gap-3">
            <h2 className="font-black">Résumé</h2>
            <Badge tone={order.status === 'completed' ? 'success' : 'info'}>
              {orderStatusLabel(order.status)}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <Row label="Montant" value={formatMoney(order.amount, order.fromCurrency)} />
            <Row label="Devise reçue" value={order.toCurrency} />
            <Row label="Taux" value={order.rate} />
            <Row label="Frais" value={formatMoney(order.fee, order.fromCurrency)} />
          </div>
          {['created', 'waiting_payment'].includes(order.status) ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                icon={FiClock}
                variant="secondary"
                onClick={() =>
                  dispatch(updateOrderStatus({ id: order.id, status: 'waiting_payment' }))
                }
              >
                Paiement en cours
              </Button>
              <Button
                icon={FiCheckCircle}
                onClick={() => dispatch(updateOrderStatus({ id: order.id, status: 'completed' }))}
              >
                Terminer
              </Button>
              <Button
                icon={FiXCircle}
                variant="danger"
                onClick={() => dispatch(updateOrderStatus({ id: order.id, status: 'cancelled' }))}
              >
                Annuler
              </Button>
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--app-border)] px-4 text-sm font-bold">
              <FiUpload /> Ajouter une preuve
              <input
                className="sr-only"
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    dispatch(
                      addOrderProof({
                        id: order.id,
                        userId: user.id,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      }),
                    )
                  }
                }}
              />
            </label>
            <Button
              variant="secondary"
              icon={FiFileText}
              onClick={() =>
                dispatch(
                  createReceipt({
                    userId: user.id,
                    relatedType: 'p2p_order',
                    relatedId: order.id,
                    title: `Transaction P2P ${order.id}`,
                    amount: order.amount,
                    currency: order.fromCurrency,
                    status: order.status,
                    details: { sellerName: order.sellerName, buyerName: order.buyerName },
                  }),
                )
              }
            >
              Enregistrer le reçu
            </Button>
          </div>
          {order.proofs?.length ? (
            <div className="mt-5 grid gap-2">
              {order.proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm"
                >
                  <FiFileText /> {proof.name}
                </div>
              ))}
            </div>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-black">Chronologie</h2>
          <div className="mt-5 grid gap-4">
            {order.timeline.map((event) => (
              <div key={`${event.status}-${event.at}`} className="flex gap-3">
                <FiCheckCircle className="mt-0.5 text-brand-700" />
                <div>
                  <strong className="block text-sm">{orderStatusLabel(event.status)}</strong>
                  <span className="text-xs text-slate-500">{formatDate(event.at)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-black">Litige</h2>
          {dispute ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              Litige {dispute.status} : {dispute.reason}
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              <textarea
                className="min-h-24 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
                placeholder="Décrivez précisément le problème"
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
              />
              <Button
                variant="danger"
                icon={FiAlertTriangle}
                disabled={disputeReason.trim().length < 10}
                onClick={() => {
                  dispatch(
                    openDispute({
                      openedBy: user.id,
                      relatedType: 'p2p_order',
                      relatedId: order.id,
                      reason: disputeReason,
                    }),
                  )
                  setDisputeReason('')
                }}
              >
                Ouvrir un litige
              </Button>
            </div>
          )}
        </Card>
        {order.status === 'completed' ? (
          <Card>
            <h2 className="font-black">Évaluer la transaction</h2>
            <div className="mt-4 grid gap-3">
              <select
                className="min-h-11 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3"
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}/5
                  </option>
                ))}
              </select>
              <textarea
                className="min-h-20 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Votre commentaire"
              />
              <Button
                icon={FiStar}
                onClick={() =>
                  dispatch(rateOrder({ id: order.id, userId: user.id, rating, comment }))
                }
              >
                Enregistrer l’évaluation
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
