import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { BONUS_POOL_CATEGORY } from './starsConfig'
import { loadStarsBalance } from './starsSlice'
import { StarsQuotaBadge } from './StarsQuotaBadge'
import { StarsSpendConfirm } from './StarsSpendConfirm'
import { useStarsModuleEnabled } from './useStarsModuleEnabled'

export function StarsPublishGate({
  category: _category,
  ownerType = 'user',
  ownerId = null,
  pendingQuote,
  onCancel,
  onConfirm,
}) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const starsEnabled = useStarsModuleEnabled()
  const balance = useSelector((state) => state.stars.balance)

  useEffect(() => {
    if (!starsEnabled || !ownerId) return
    dispatch(loadStarsBalance({ ownerType, ownerId }))
  }, [dispatch, ownerId, ownerType, starsEnabled])

  if (!starsEnabled) return null

  const quota = balance?.quotas?.[BONUS_POOL_CATEGORY] ?? balance?.quotas?.pool
  const bonusLeft = Number(
    balance?.bonusPool ?? balance?.bonus?.[BONUS_POOL_CATEGORY] ?? balance?.bonus?.pool ?? 0,
  )
  const used = quota == null ? null : Math.max(0, Number(quota) - bonusLeft)

  return (
    <>
      <StarsQuotaBadge
        enforced={Boolean(balance?.enforced)}
        quota={quota}
        used={used}
        label={t('stars.bonusPoolShort')}
      />
      <StarsSpendConfirm
        open={Boolean(pendingQuote)}
        quote={pendingQuote}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </>
  )
}
