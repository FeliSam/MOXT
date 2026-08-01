import { FiAlertTriangle, FiCheckCircle, FiClock, FiEye, FiUsers, FiXCircle } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { formatMoney } from '../../transfers/transferUtils'
import { moderateOffer, moderateOrder } from '../../p2p/p2pSlice'
import { CARD, ITEM } from '../adminConfig'
import { adminText } from '../adminI18n'
import { statusDotColor } from '../adminUtils'
import { Empty, MetricCard, SectionTitle } from './AdminShared'

export function AdminP2PPanel({ dispatch, offers, orders, setSelected }) {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const activeOffers = offers.filter((i) => i.status === 'active')
  const openOrders = orders.filter((i) => !['completed', 'cancelled'].includes(i.status))
  const disputedOrders = orders.filter((i) => i.status === 'disputed')

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={FiUsers}
          label={adminText(t, 'admin.p2p.metric.activeOffers')}
          value={activeOffers.length}
          gradient="from-teal-600 to-cyan-500"
        />
        <MetricCard
          icon={FiClock}
          label={adminText(t, 'admin.p2p.metric.openOrders')}
          value={openOrders.length}
          gradient="from-amber-500 to-orange-500"
        />
        <MetricCard
          icon={FiAlertTriangle}
          label={adminText(t, 'admin.p2p.metric.disputed')}
          value={disputedOrders.length}
          gradient="from-rose-600 to-red-500"
        />
      </div>

      <div className={`${CARD} p-5 grid gap-3`}>
        <SectionTitle icon={FiUsers} label={adminText(t, 'admin.p2p.offersTitle')} count={offers.length} />
        {offers.length ? (
          offers.map((offer) => (
            <div key={offer.id} className={`${ITEM} grid gap-3`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`size-2.5 shrink-0 rounded-full ${statusDotColor(offer.status)}`} />
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'p2p_offer', item: offer })}
                  className="text-left hover:text-brand-700"
                >
                  <strong className="block text-sm">{offer.id}</strong>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {offer.ownerName || offer.ownerId}
                    {offer.paymentMethod ? ` · ${offer.paymentMethod}` : ''}
                  </p>
                </button>
                <Badge tone={offer.status === 'active' ? 'success' : offer.status === 'archived' ? 'slate' : 'info'}>
                  {offer.status}
                </Badge>
                <div className="ml-auto text-right">
                  <p className="text-sm font-black">{formatMoney(offer.amount, offer.fromCurrency)}</p>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {offer.fromCurrency} → {offer.toCurrency} · {offer.rate}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/p2p">
                  <Button variant="secondary" icon={FiEye}>
                    {adminText(t, 'admin.actions.open')}
                  </Button>
                </Link>
                {offer.status === 'active' ? (
                  <Button
                    variant="secondary"
                    onClick={() => dispatch(moderateOffer({ id: offer.id, status: 'archived' }))}
                  >
                    {adminText(t, 'admin.actions.archive')}
                  </Button>
                ) : null}
                {offer.status === 'archived' ? (
                  <Button onClick={() => dispatch(moderateOffer({ id: offer.id, status: 'active' }))}>
                    {adminText(t, 'admin.actions.reactivate')}
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <Empty
            label={adminText(t, 'admin.p2p.emptyOffers')}
            sub={adminText(t, 'admin.empty.tryFilters')}
            icon={FiUsers}
          />
        )}
      </div>

      <div className={`${CARD} p-5 grid gap-3`}>
        <SectionTitle icon={FiClock} label={adminText(t, 'admin.p2p.ordersTitle')} count={orders.length} />
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id} className={`${ITEM} grid gap-3`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`size-2.5 shrink-0 rounded-full ${statusDotColor(order.status)}`} />
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'p2p_order', item: order })}
                  className="text-left hover:text-brand-700"
                >
                  <strong className="block text-sm">{order.id}</strong>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {order.buyerName} · {order.sellerName}
                  </p>
                </button>
                <Badge
                  tone={
                    order.status === 'completed'
                      ? 'success'
                      : order.status === 'disputed'
                        ? 'warning'
                        : order.status === 'cancelled'
                          ? 'slate'
                          : 'info'
                  }
                >
                  {order.status}
                </Badge>
                <div className="ml-auto text-right">
                  <p className="text-sm font-black">{formatMoney(order.amount, order.fromCurrency)}</p>
                  <p className="text-xs text-[var(--app-text-muted)]">
                    {order.proofs?.length
                      ? adminText(t, 'admin.p2p.proofsCount', { count: order.proofs.length })
                      : adminText(t, 'admin.p2p.noProofs')}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/p2p/orders/${order.id}`}>
                  <Button variant="secondary" icon={FiEye}>
                    {adminText(t, 'admin.actions.open')}
                  </Button>
                </Link>
                {order.status === 'disputed' ? (
                  <Button
                    icon={FiCheckCircle}
                    onClick={() =>
                      dispatch(
                        moderateOrder({
                          id: order.id,
                          status: 'waiting_payment',
                          actorId: user?.id,
                          actorRole: user?.role || 'admin',
                          note: 'admin_restore',
                        }),
                      )
                    }
                  >
                    {adminText(t, 'admin.p2p.restoreOrder')}
                  </Button>
                ) : null}
                {!['completed', 'cancelled', 'disputed'].includes(order.status) ? (
                  <Button
                    variant="secondary"
                    icon={FiAlertTriangle}
                    onClick={() =>
                      dispatch(
                        moderateOrder({
                          id: order.id,
                          status: 'disputed',
                          actorId: user?.id,
                          actorRole: user?.role || 'admin',
                          note: 'admin_dispute',
                        }),
                      )
                    }
                  >
                    {adminText(t, 'admin.p2p.markDisputed')}
                  </Button>
                ) : null}
                {!['completed', 'cancelled'].includes(order.status) ? (
                  <>
                    <Button
                      icon={FiCheckCircle}
                      onClick={() =>
                        dispatch(
                          moderateOrder({
                            id: order.id,
                            status: 'completed',
                            actorId: user?.id,
                            actorRole: user?.role || 'admin',
                            note: 'admin_complete',
                          }),
                        )
                      }
                    >
                      {adminText(t, 'admin.p2p.completeOrder')}
                    </Button>
                    <Button
                      variant="danger"
                      icon={FiXCircle}
                      onClick={() =>
                        dispatch(
                          moderateOrder({
                            id: order.id,
                            status: 'cancelled',
                            actorId: user?.id,
                            actorRole: user?.role || 'admin',
                            note: 'admin_cancel',
                          }),
                        )
                      }
                    >
                      {adminText(t, 'admin.p2p.cancelOrder')}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <Empty
            label={adminText(t, 'admin.p2p.emptyOrders')}
            sub={adminText(t, 'admin.empty.tryFilters')}
            icon={FiClock}
          />
        )}
      </div>
    </div>
  )
}
