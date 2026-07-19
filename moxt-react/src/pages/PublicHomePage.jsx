import { useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiSearch } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PUBLIC_RECENT_LIMIT, PUBLIC_SERVICES, TRUST_PRINCIPLES } from '../config/publicContent'
import { useLanguage } from '../contexts/useLanguage'
import { selectSearchIndex } from '../features/searchSelectors'
import { currencyForCountry, DIRECTIONS } from '../features/transfers/transferConfig'
import { calculateTransfer, formatMoney } from '../features/transfers/transferUtils'
import { useExchangeRate } from '../features/transfers/useExchangeRate'

export function PublicHomePage() {
  const { t } = useLanguage()
  const user = useSelector((state) => state.auth.user)
  const originCountry = user?.originCountry || (user?.country && user.country !== 'RU' ? user.country : 'BJ')
  const [amount, setAmount] = useState(10000)
  const [direction, setDirection] = useState(DIRECTIONS.BJ_TO_RU)
  const searchIndex = useSelector(selectSearchIndex)
  const recent = searchIndex.slice(0, PUBLIC_RECENT_LIMIT)
  const liveRate = useExchangeRate(currencyForCountry(originCountry))
  const selectedRate = direction === DIRECTIONS.BJ_TO_RU ? liveRate.originToRub : liveRate.rubToOrigin
  const calculation = useMemo(
    () => calculateTransfer(amount, direction, undefined, selectedRate, originCountry),
    [amount, direction, selectedRate, originCountry],
  )

  return (
    <>
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-[var(--app-accent-soft)] px-4 py-2 text-xs font-black uppercase tracking-wider text-[var(--app-accent)]">
              {t('public.home.badge')}
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
              {t('public.home.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--app-text-muted)]">
              {t('public.home.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button icon={FiArrowRight}>{t('public.home.ctaStart')}</Button>
              </Link>
              <Link to="/presentation">
                <Button variant="secondary" icon={FiArrowRight}>
                  {t('public.home.ctaDiscover')}
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="secondary" icon={FiSearch}>
                  {t('public.home.ctaExplore')}
                </Button>
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-[var(--app-text-muted)]">
              <FiCheckCircle className="text-emerald-600" />
              {t('public.home.freeNote')}
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
              {t('public.home.estimatorEyebrow')}
            </span>
            <h2 className="mt-2 text-2xl font-black">{t('public.home.estimatorTitle')}</h2>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">
                {t('public.home.direction')}
                <select
                  className="min-h-12 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3"
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                >
                  <option value={DIRECTIONS.BJ_TO_RU}>{t('public.home.bjToRu')}</option>
                  <option value={DIRECTIONS.RU_TO_BJ}>{t('public.home.ruToBj')}</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                {t('public.home.amount')}
                <input
                  className="min-h-12 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3"
                  min="0"
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
              <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-5 text-white">
                <span className="text-xs text-brand-100">{t('public.home.receivedLabel')}</span>
                <strong className="mt-1 block text-3xl">
                  {formatMoney(calculation.amountReceived, calculation.currencyTo)}
                </strong>
                <p className="mt-2 text-xs text-brand-100">
                  {t('public.home.feesLabel', {
                    fees: formatMoney(calculation.fees, calculation.currencyFrom),
                  })}
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-brand-800"
              >
                {t('public.home.createToSend')} <FiArrowRight />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black">{t('public.home.servicesTitle')}</h2>
          <p className="mt-2 text-[var(--app-text-muted)]">{t('public.home.servicesSubtitle')}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_SERVICES.map(({ icon: Icon, id: serviceId }) => (
              <Card key={serviceId} className="h-full">
                <span className="grid size-12 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-xl text-[var(--app-accent)]">
                  <Icon />
                </span>
                <h3 className="mt-5 text-lg font-black">{t(`public.services.${serviceId}.label`)}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                  {t(`public.services.${serviceId}.description`)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">{t('public.home.recentTitle')}</h2>
              <p className="mt-2 text-[var(--app-text-muted)]">{t('public.home.recentSubtitle')}</p>
            </div>
            <Link to="/discover" className="font-bold text-brand-700 dark:text-brand-300">
              {t('public.home.showAll')}
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => (
              <Card key={`${item.type}-${item.id}`} className="h-full">
                <span className="text-xs font-black uppercase text-brand-700 dark:text-brand-300">
                  {item.typeLabel}
                </span>
                <h3 className="mt-2 font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">{item.subtitle}</p>
                <Link
                  className="mt-5 inline-flex text-sm font-bold text-brand-700 dark:text-brand-300"
                  to="/login"
                >
                  {t('public.home.signInToView')}
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black">{t('public.home.trustTitle')}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TRUST_PRINCIPLES.map(({ icon: Icon, id }) => (
              <div key={id} className="h-full rounded-2xl border border-white/10 bg-white/5 p-5">
                <Icon className="text-2xl text-brand-300" />
                <h3 className="mt-4 font-black">{t(`public.trust.${id}.title`)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {t(`public.trust.${id}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
