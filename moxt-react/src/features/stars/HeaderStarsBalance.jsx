import { useEffect } from 'react'
import { FiStar } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/useLanguage'
import { loadStarsBalance, loadStarsHistory } from './starsSlice'
import { totalStarsAvailable } from './starsWalletUi'
import { useStarsModuleEnabled } from './useStarsModuleEnabled'

export function HeaderStarsBalance() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const starsEnabled = useStarsModuleEnabled()
  const userId = useSelector((state) => state.auth.user?.id)
  const balance = useSelector((state) => state.stars.balance)

  useEffect(() => {
    if (!starsEnabled || !userId) return
    dispatch(loadStarsBalance({ ownerType: 'user', ownerId: userId }))
    dispatch(loadStarsHistory({ ownerType: 'user', ownerId: userId, limit: 50 }))
  }, [dispatch, starsEnabled, userId])

  if (!starsEnabled) return null

  const total = totalStarsAvailable(balance)

  return (
    <Link
      to="/stars"
      data-tour="header-stars"
      className="header-action-btn relative grid min-w-[2.65rem] px-1.5"
      aria-label={t('nav.stars')}
    >
      <span className="inline-flex items-center gap-0.5 text-[11px] font-black tabular-nums text-amber-700 dark:text-amber-300">
        <FiStar className="shrink-0 text-sm" aria-hidden="true" />
        {balance ? total : '—'}
      </span>
      <span className="header-action-label" role="tooltip">
        {t('nav.stars')}
      </span>
    </Link>
  )
}
