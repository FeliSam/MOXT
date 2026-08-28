import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCreditCard,
  FiGift,
  FiShield,
  FiStar,
  FiXCircle,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useLanguage } from '../contexts/useLanguage'
import { createId } from '../services/createId'
import {
  packTotalStars,
  packUnitPriceRub,
  purchaseDisplayLabel,
  sortStarsPacks,
} from '../features/stars/starsBuyUtils'
import { loadStarsCatalog, requestStarsPurchase } from '../features/stars/starsSlice'
import { addToast } from '../features/ui/uiSlice'
import { starsPackMeta } from '../features/stars/starsWalletUi'

function PackSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-52 animate-pulse rounded-2xl bg-[var(--app-surface-muted)]" />
      ))}
    </div>
  )
}

function PurchaseStatusBadge({ status, t }) {
  const key = String(status || 'pending').toLowerCase()
  if (key === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
        <FiCheckCircle aria-hidden />
        {t('stars.purchaseStatus.paid')}
      </span>
    )
  }
  if (key === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-2.5 py-0.5 text-[11px] font-black text-rose-700 dark:text-rose-300">
        <FiXCircle aria-hidden />
        {t('stars.purchaseStatus.failed')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2.5 py-0.5 text-[11px] font-black text-amber-800 dark:text-amber-200">
      <FiClock aria-hidden />
      {t('stars.purchaseStatus.pending')}
    </span>
  )
}

function StarsPackCard({ pack, index, buyingId, onBuy, t }) {
  const meta = starsPackMeta(pack.id, index)
  const totalStars = packTotalStars(pack)
  const unitPrice = packUnitPriceRub(pack)
  const loading = buyingId === pack.id

  return (
    <Card
      variant="flush"
      className={`relative flex h-full flex-col overflow-hidden border border-[var(--app-border)] shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-lg)] ${
        meta.badge === 'popular' ? 'ring-2 ring-brand-400/35' : ''
      } ${meta.badge === 'best' ? 'ring-2 ring-amber-400/40' : ''}`}
    >
      <div className={`relative bg-gradient-to-br ${meta.gradient} px-3.5 pb-8 pt-4 text-white`}>
        <div
          className={`pointer-events-none absolute -right-4 -top-6 size-20 rounded-full opacity-30 blur-2xl ${meta.glow}`}
          aria-hidden
        />
        <FiStar className="pointer-events-none absolute right-2 top-2 text-2xl text-white/15" aria-hidden />

        {meta.badge === 'popular' ? (
          <span className="relative mb-2 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide">
            {t('stars.packPopular')}
          </span>
        ) : null}
        {meta.badge === 'best' ? (
          <span className="relative mb-2 inline-flex rounded-full bg-amber-300/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-50">
            {t('stars.packBestValue')}
          </span>
        ) : null}

        <div className="relative flex items-end gap-1.5">
          <span className="font-display text-3xl font-black tabular-nums leading-none">{pack.stars}</span>
          {pack.bonus_stars ? (
            <span className="mb-0.5 inline-flex items-center gap-0.5 rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-black">
              <FiGift className="text-[10px]" aria-hidden />+{pack.bonus_stars}
            </span>
          ) : null}
        </div>
        <p className="relative mt-1 text-[11px] text-white/80">{t('stars.packTotal', { n: totalStars })}</p>
      </div>

      <div className="relative z-[1] -mt-3 m-1 flex flex-1 flex-col gap-3 rounded-t-2xl bg-[var(--app-surface)] p-3.5 pt-4">
        <div>
          <p className="font-display text-xl font-black tabular-nums">{pack.price_rub} ₽</p>
          {unitPrice ? (
            <p className="mt-0.5 text-[10px] font-semibold text-[var(--app-text-faint)]">
              {t('stars.buyPerStar', { price: unitPrice })}
            </p>
          ) : null}
        </div>
        <Button className="mt-auto w-full" size="sm" loading={loading} icon={FiStar} onClick={() => onBuy(pack)}>
          {t('stars.buyPack')}
        </Button>
      </div>
    </Card>
  )
}

function PurchaseHistory({ purchases, packages, t }) {
  const [open, setOpen] = useState(true)
  if (!purchases?.length) return null

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 border-b border-[var(--app-border)]/70 px-4 py-3 text-left sm:px-5"
      >
        <h2 className="flex items-center gap-2 text-sm font-black">
          <FiCreditCard className="text-[var(--app-text-muted)]" aria-hidden />
          {t('stars.purchasesTitle')}
          <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-black tabular-nums text-[var(--app-text-muted)]">
            {purchases.length}
          </span>
        </h2>
        {open ? <FiChevronUp aria-hidden /> : <FiChevronDown aria-hidden />}
      </button>
      {open ? (
        <ul className="divide-y divide-[var(--app-border)]/60">
          {purchases.slice(0, 10).map((item) => {
            const label = purchaseDisplayLabel(item, packages)
            const stars =
              (Number(item.stars) || 0) + (Number(item.bonus_stars) || Number(item.bonusStars) || 0)
            return (
              <li key={item.id || item.purchaseId} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-sm">
                    <FiStar aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{label}</p>
                    <p className="text-xs text-[var(--app-text-muted)]">
                      {stars > 0 ? t('stars.packTotal', { n: stars }) : t('stars.purchaseLine')}
                      {item.created_at
                        ? ` · ${new Date(item.created_at).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.price_rub ? (
                    <span className="text-sm font-black tabular-nums">{item.price_rub} ₽</span>
                  ) : null}
                  <PurchaseStatusBadge status={item.status} t={t} />
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </Card>
  )
}

export function StarsBuyPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { packages, purchases, status } = useSelector((state) => state.stars)
  const user = useSelector((state) => state.auth.user)
  const [buyingId, setBuyingId] = useState(null)

  const sortedPacks = useMemo(() => sortStarsPacks(packages), [packages])

  useEffect(() => {
    dispatch(loadStarsCatalog())
  }, [dispatch])

  async function buy(pack) {
    setBuyingId(pack.id)
    try {
      const result = await dispatch(
        requestStarsPurchase({
          packageId: pack.id,
          idempotencyKey: createId('BUY'),
          ownerType: 'user',
          ownerId: user?.id,
        }),
      ).unwrap()
      const purchaseId = result?.purchaseId || result?.purchase_id
      if (!purchaseId) {
        throw new Error(t('stars.purchaseFailedBody'))
      }
      navigate(`/stars/buy/checkout/${purchaseId}`, { state: { pack } })
    } catch (error) {
      dispatch(
        addToast({
          title: t('stars.purchaseFailedTitle'),
          message: error?.message || t('stars.purchaseFailedBody'),
          tone: 'error',
        }),
      )
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4 pb-4">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-700 via-brand-600 to-amber-500 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-6">
        <div className="pointer-events-none absolute -left-10 top-0 size-44 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <FiStar className="pointer-events-none absolute bottom-3 right-4 text-5xl text-white/10" aria-hidden />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/75">{t('stars.eyebrow')}</p>
            <h1 className="mt-1 font-display text-xl font-black tracking-tight sm:text-2xl">{t('stars.buyTitle')}</h1>
          </div>
          <Link
            to="/stars"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
            aria-label={t('stars.backWallet')}
          >
            <FiArrowLeft className="text-lg" aria-hidden />
          </Link>
        </div>

        <p className="relative mt-2 text-sm text-white/85">{t('stars.buyDescription')}</p>

        <div className="relative mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
            <FiCreditCard aria-hidden />
            {t('stars.buyPayRub')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
            <FiShield aria-hidden />
            {t('stars.buySecure')}
          </span>
        </div>
      </section>

      {status === 'loading' && !sortedPacks.length ? <PackSkeleton /> : null}

      {sortedPacks.length ? (
        <section>
          <h2 className="mb-3 text-sm font-black">{t('stars.buyChoosePack')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sortedPacks.map((pack, index) => (
              <StarsPackCard
                key={pack.id}
                pack={pack}
                index={index}
                buyingId={buyingId}
                onBuy={buy}
                t={t}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!sortedPacks.length && status !== 'loading' ? (
        <Card className="grid place-items-center gap-3 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-[var(--app-text-faint)]">
            <FiStar className="text-xl" aria-hidden />
          </span>
          <p className="text-sm text-[var(--app-text-muted)]">{t('stars.noPacks')}</p>
          <Link to="/stars" className="text-xs font-bold text-brand-700">
            {t('stars.backWallet')}
          </Link>
        </Card>
      ) : null}

      <PurchaseHistory purchases={purchases} packages={sortedPacks} t={t} />
    </div>
  )
}
