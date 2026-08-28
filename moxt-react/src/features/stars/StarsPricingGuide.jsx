import { useState } from 'react'
import {
  FiChevronDown,
  FiChevronUp,
  FiStar,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { BOOST_DURATIONS } from './publicationBoostUtils'
import {
  DEFAULT_QUOTA_CONFIG,
  monthlyBonusPoolForPlan,
  STARS_CATEGORIES,
} from './starsConfig'
import { PUBLISH_FORMULAS, resolveBoostCost, resolveStarsActionCost } from './starsPricing'
import { STARS_CATEGORY_META } from './starsWalletUi'

const PUBLISH_CATEGORIES = STARS_CATEGORIES.filter((key) => key !== 'status')

const FORMULA_UI = {
  standard: FiStar,
  featured_24h: FiTrendingUp,
  featured_7d: FiZap,
}

function PriceChip({ children, compact = false }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-lg bg-brand-500/10 font-black tabular-nums text-brand-800 dark:text-brand-200 ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      {children}
    </span>
  )
}

export function StarsPricingGuide({ config = DEFAULT_QUOTA_CONFIG, ownerType = 'user' }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const poolQuota = monthlyBonusPoolForPlan(ownerType, config)
  const sampleCategory = 'marketplace'
  const publishCost = resolveStarsActionCost({ category: 'marketplace', config })
  const videoCost = resolveStarsActionCost({ category: 'video', config })
  const statusCost = resolveStarsActionCost({ category: 'status', durationKey: '24h', config })
  const boostCost = resolveBoostCost({ entityType: 'marketplace', durationKey: '24h', config })

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[var(--app-border)]/70 bg-[var(--app-surface)] px-4 py-3 text-left shadow-sm transition hover:border-brand-300/60"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-black">
            <FiStar className="shrink-0 text-brand-600" aria-hidden />
            {t('stars.pricingTitle')}
          </span>
          <span className="mt-1 block text-xs text-[var(--app-text-muted)]">{t('stars.pricingDebitHint')}</span>
          {!open ? (
            <span className="mt-2 flex flex-wrap gap-1.5">
              <PriceChip compact>{t('stars.pricingChipPool', { n: poolQuota })}</PriceChip>
              <PriceChip compact>{t('stars.pricingChipPublish', { n: publishCost })}</PriceChip>
              <PriceChip compact>{t('stars.pricingChipVideo', { n: videoCost })}</PriceChip>
              <PriceChip compact>{t('stars.pricingChipStatus', { n: statusCost })}</PriceChip>
              <PriceChip compact>{t('stars.pricingChipBoost', { n: boostCost })}</PriceChip>
            </span>
          ) : null}
        </span>
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
          {open ? <FiChevronUp aria-hidden /> : <FiChevronDown aria-hidden />}
        </span>
      </button>

      {open ? (
        <div className="mt-3 grid gap-3">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-[var(--app-border)]/70 px-4 py-3">
              <p className="text-xs font-black">{t('stars.pricingPublishSection')}</p>
            </div>
            <ul className="divide-y divide-[var(--app-border)]/50">
              {PUBLISH_CATEGORIES.map((category) => {
                const meta = STARS_CATEGORY_META[category]
                const Icon = meta?.icon
                const cost = resolveStarsActionCost({ category, config })
                return (
                  <li key={category} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                      {Icon ? (
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-lg text-white ${meta.iconBg}`}
                        >
                          <Icon className="text-sm" aria-hidden />
                        </span>
                      ) : null}
                      {t(`stars.categories.${category}`)}
                    </span>
                    <PriceChip>{t('stars.formulas.costStars', { n: cost })}</PriceChip>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[var(--app-border)]/70 px-4 py-3">
              <p className="text-xs font-black">{t('stars.pricingFormulasSection')}</p>
            </div>
            <ul className="divide-y divide-[var(--app-border)]/50">
              {PUBLISH_FORMULAS.map((formulaKey) => {
                const Icon = FORMULA_UI[formulaKey] || FiStar
                const cost = resolveStarsActionCost({ category: sampleCategory, formulaKey, config })
                const featuredVideoCost = resolveStarsActionCost({
                  category: 'video',
                  formulaKey,
                  config,
                })
                const showVideo = formulaKey !== 'standard' && featuredVideoCost !== cost
                return (
                  <li key={formulaKey} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                        <Icon className="text-sm" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{t(`stars.formulas.${formulaKey}`)}</span>
                        <span className="mt-0.5 block text-[10px] text-[var(--app-text-faint)]">
                          {t(`stars.formulas.${formulaKey}Desc`)}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <PriceChip>{t('stars.formulas.costStars', { n: cost })}</PriceChip>
                      {showVideo ? (
                        <span className="text-[10px] font-semibold text-[var(--app-text-faint)]">
                          {t('stars.pricingVideoCost', { n: featuredVideoCost })}
                        </span>
                      ) : null}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[var(--app-border)]/70 px-4 py-3">
                <p className="text-xs font-black">{t('stars.pricingStatusSection')}</p>
              </div>
              <ul className="divide-y divide-[var(--app-border)]/50">
                {['24h', '3d', '7d'].map((durationKey) => {
                  const cost = resolveStarsActionCost({ category: 'status', durationKey, config })
                  const labelKey =
                    durationKey === '24h'
                      ? 'stars.duration24h'
                      : durationKey === '3d'
                        ? 'stars.duration3d'
                        : 'stars.duration7d'
                  return (
                    <li key={durationKey} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="text-sm font-semibold">{t(labelKey)}</span>
                      <PriceChip>{t('stars.formulas.costStars', { n: cost })}</PriceChip>
                    </li>
                  )
                })}
              </ul>
            </Card>

            <Card className="overflow-hidden p-0">
              <div className="border-b border-[var(--app-border)]/70 px-4 py-3">
                <p className="text-xs font-black">{t('stars.pricingBoostSection')}</p>
              </div>
              <ul className="divide-y divide-[var(--app-border)]/50">
                {BOOST_DURATIONS.map((durationKey) => {
                  const labelKey =
                    durationKey === '24h'
                      ? 'stars.duration24h'
                      : durationKey === '3d'
                        ? 'stars.duration3d'
                        : 'stars.duration7d'
                  const defaultCost = resolveBoostCost({ entityType: 'marketplace', durationKey, config })
                  const videoBoostCost = resolveBoostCost({ entityType: 'video', durationKey, config })
                  return (
                    <li key={durationKey} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="text-sm font-semibold">{t(labelKey)}</span>
                      <span className="flex gap-1">
                        <PriceChip compact>{t('stars.formulas.costStars', { n: defaultCost })}</PriceChip>
                        <PriceChip compact>{t('stars.formulas.costStars', { n: videoBoostCost })}</PriceChip>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  )
}
