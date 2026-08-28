import { useEffect } from 'react'
import { FiChevronRight, FiGift, FiStar } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { loadStarsBalance } from '../../stars/starsSlice'
import { totalStarsAvailable } from '../../stars/starsWalletUi'
import { useStarsModuleEnabled } from '../../stars/useStarsModuleEnabled'

export function DashboardStarsStrip() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const starsEnabled = useStarsModuleEnabled()
  const userId = useSelector((state) => state.auth.user?.id)
  const balance = useSelector((state) => state.stars.balance)

  useEffect(() => {
    if (!starsEnabled || !userId) return
    dispatch(loadStarsBalance({ ownerType: 'user', ownerId: userId }))
  }, [dispatch, starsEnabled, userId])

  if (!starsEnabled) return null

  const total = totalStarsAvailable(balance)
  const paid = Number(balance?.paid ?? 0)

  return (
    <Link
      to="/stars"
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-500/15 via-orange-400/10 to-violet-500/10 px-4 py-3.5 shadow-[0_10px_30px_-18px_rgba(245,158,11,0.55)] transition hover:border-amber-400/40 hover:from-amber-500/20"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
        <FiStar className="text-xl" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-800/80 dark:text-amber-200/80">
          {t('dashboard.starsStrip.eyebrow')}
        </p>
        <p className="mt-0.5 truncate text-base font-black text-[var(--app-text)]">
          {balance
            ? t('dashboard.starsStrip.balance', { n: total })
            : t('dashboard.starsStrip.loading')}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--app-text-muted)]">
          <FiGift className="shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          {t('dashboard.starsStrip.hint', { n: paid })}
        </p>
      </div>
      <FiChevronRight
        className="shrink-0 text-lg text-amber-700/70 transition group-hover:translate-x-0.5 dark:text-amber-300/70"
        aria-hidden="true"
      />
    </Link>
  )
}
