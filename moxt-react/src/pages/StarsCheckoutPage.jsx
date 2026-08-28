import { useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiCreditCard,
  FiGift,
  FiShield,
  FiStar,
  FiXCircle,
} from 'react-icons/fi'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useLanguage } from '../contexts/useLanguage'
import { packTotalStars } from '../features/stars/starsBuyUtils'
import {
  completeStubPurchase,
  fetchStarsPurchase,
} from '../features/stars/starsRemote'
import { loadStarsBalance, loadStarsCatalog, loadStarsHistory } from '../features/stars/starsSlice'
import { addToast } from '../features/ui/uiSlice'
import { starsPackMeta } from '../features/stars/starsWalletUi'

function CheckoutSkeleton() {
  return <div className="h-72 animate-pulse rounded-[1.75rem] bg-[var(--app-surface-muted)]" />
}

export function StarsCheckoutPage() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { purchaseId } = useParams()
  const location = useLocation()
  const packFromState = location.state?.pack

  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [doneStatus, setDoneStatus] = useState(null)

  const totalStars = useMemo(() => {
    if (packFromState) return packTotalStars(packFromState)
    if (purchase) return Number(purchase.stars || 0) + Number(purchase.bonus_stars || 0)
    return 0
  }, [packFromState, purchase])

  const priceRub = packFromState?.price_rub ?? purchase?.price_rub
  const packageLabel = packFromState?.title || purchase?.package_id || 'MOXT Stars'
  const meta = starsPackMeta(packFromState?.id || purchase?.package_id || '', 0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!purchaseId) {
        setError('missing_purchase')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const row = await fetchStarsPurchase(purchaseId)
        if (cancelled) return
        if (!row) {
          setError('not_found')
          return
        }
        setPurchase(row)
        if (row.status === 'paid') setDoneStatus('paid')
        if (row.status === 'failed') setDoneStatus('failed')
      } catch (err) {
        if (!cancelled) setError(err.message || 'load_failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [purchaseId])

  async function finalize(success) {
    setSubmitting(true)
    setError(null)
    try {
      const result = await completeStubPurchase(purchaseId, success)
      const status = result?.status || (success ? 'paid' : 'failed')
      setDoneStatus(status)
      setPurchase((current) => (current ? { ...current, status } : current))
      if (status === 'paid') {
        dispatch(loadStarsBalance({ ownerType: 'user' }))
        dispatch(loadStarsHistory({ ownerType: 'user', limit: 50 }))
        dispatch(loadStarsCatalog())
        dispatch(
          addToast({
            title: t('stars.checkoutSuccessTitle'),
            message: t('stars.checkoutSuccessBody', { n: result?.stars || totalStars }),
            tone: 'success',
          }),
        )
      } else {
        dispatch(
          addToast({
            title: t('stars.checkoutFailedTitle'),
            message: t('stars.checkoutFailedBody'),
            tone: 'error',
          }),
        )
      }
    } catch (err) {
      setError(err.message || t('stars.checkoutError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-lg gap-4 pb-4">
        <CheckoutSkeleton />
      </div>
    )
  }

  if (error === 'not_found' || error === 'missing_purchase') {
    return (
      <div className="mx-auto grid max-w-lg gap-4 pb-4">
        <Card className="grid gap-3 p-6 text-center">
          <FiAlertTriangle className="mx-auto text-3xl text-amber-600" aria-hidden />
          <p className="text-sm font-bold">{t('stars.checkoutNotFound')}</p>
          <Link to="/stars/buy">
            <Button className="w-full">{t('stars.backToPacks')}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-lg gap-4 pb-4">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-700 via-brand-600 to-amber-500 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/75">
              {t('stars.checkoutEyebrow')}
            </p>
            <h1 className="mt-1 font-display text-xl font-black">{t('stars.checkoutTitle')}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/stars/buy')}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25"
            aria-label={t('stars.backToPacks')}
          >
            <FiArrowLeft aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-sm text-white/85">{t('stars.checkoutDescription')}</p>
      </section>

      <Card className="flex items-start gap-3 border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <FiAlertTriangle className="mt-0.5 shrink-0 text-lg text-amber-700 dark:text-amber-300" aria-hidden />
        <div>
          <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{t('stars.checkoutTestBanner')}</p>
          <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/85">{t('stars.checkoutTestHint')}</p>
        </div>
      </Card>

      <Card variant="flush" className="border border-[var(--app-border)] shadow-[var(--shadow-card)]">
        <div className={`relative bg-gradient-to-br ${meta.gradient} px-5 pb-10 pt-5 text-white`}>
          <div
            className={`pointer-events-none absolute -right-6 -top-8 size-28 rounded-full opacity-25 blur-3xl ${meta.glow}`}
            aria-hidden
          />
          <FiStar className="pointer-events-none absolute right-4 top-4 text-4xl text-white/12" aria-hidden />

          <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            {t('stars.checkoutOrder')}
          </p>
          <p className="relative mt-1 truncate text-base font-bold text-white/95">{packageLabel}</p>

          <div className="relative mt-5 flex items-end gap-2">
            <span className="font-display text-5xl font-black tabular-nums leading-none">
              {packFromState?.stars ?? purchase?.stars ?? totalStars}
            </span>
            {(packFromState?.bonus_stars ?? purchase?.bonus_stars) ? (
              <span className="mb-1 inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-sm font-black">
                <FiGift className="text-xs" aria-hidden />
                +{packFromState?.bonus_stars ?? purchase?.bonus_stars}
              </span>
            ) : null}
          </div>
          <p className="relative mt-2 text-sm text-white/75">{t('stars.packTotal', { n: totalStars })}</p>
        </div>

        <div className="relative z-[1] -mt-5 mx-1 mb-1 rounded-t-2xl bg-[var(--app-surface)] px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--app-border)]/70 bg-[var(--app-surface-muted)]/80 px-4 py-3.5">
            <span className="text-sm font-semibold text-[var(--app-text-muted)]">{t('stars.checkoutAmount')}</span>
            <span className="font-display text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{priceRub} ₽</span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5 text-[11px] font-semibold text-[var(--app-text-muted)]">
              <FiCreditCard className="shrink-0 text-sm text-[var(--app-text-faint)]" aria-hidden />
              {t('stars.buyPayRub')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5 text-[11px] font-semibold text-[var(--app-text-muted)]">
              <FiShield className="shrink-0 text-sm text-[var(--app-text-faint)]" aria-hidden />
              {t('stars.buySecure')}
            </span>
          </div>

          {purchaseId ? (
            <p className="mt-4 border-t border-[var(--app-border)]/60 pt-3 text-center font-mono text-[10px] tracking-wide text-[var(--app-text-faint)]">
              {t('stars.checkoutRef', { ref: String(purchaseId).slice(0, 8) })}
            </p>
          ) : null}
        </div>
      </Card>

      {doneStatus === 'paid' ? (
        <Card className="grid gap-4 p-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-600">
            <FiCheckCircle className="text-3xl" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-black">{t('stars.checkoutSuccessTitle')}</p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {t('stars.checkoutSuccessBody', { n: totalStars })}
            </p>
          </div>
          <Link to="/stars">
            <Button className="w-full" icon={FiStar}>
              {t('stars.backWallet')}
            </Button>
          </Link>
        </Card>
      ) : doneStatus === 'failed' ? (
        <Card className="grid gap-4 p-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-500/12 text-rose-600">
            <FiXCircle className="text-3xl" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-black">{t('stars.checkoutFailedTitle')}</p>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">{t('stars.checkoutFailedBody')}</p>
          </div>
          <div className="grid gap-2">
            <Link to="/stars/buy">
              <Button className="w-full">{t('stars.backToPacks')}</Button>
            </Link>
            <Button variant="secondary" className="w-full" onClick={() => finalize(true)} loading={submitting}>
              {t('stars.checkoutRetry')}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="grid gap-3 p-5">
          <h2 className="text-sm font-black">{t('stars.checkoutPayment')}</h2>
          <p className="text-xs text-[var(--app-text-muted)]">{t('stars.checkoutPaymentHint')}</p>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button className="w-full" icon={FiCheckCircle} loading={submitting} onClick={() => finalize(true)}>
            {t('stars.checkoutConfirmTest')}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            icon={FiXCircle}
            loading={submitting}
            onClick={() => finalize(false)}
          >
            {t('stars.checkoutSimulateFail')}
          </Button>
          <Link to="/stars/buy" className="text-center text-xs font-bold text-[var(--app-text-muted)]">
            {t('stars.checkoutCancel')}
          </Link>
        </Card>
      )}
    </div>
  )
}
