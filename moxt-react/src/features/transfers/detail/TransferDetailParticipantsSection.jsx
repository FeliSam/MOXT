import { FiUsers } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import {
  removeTransferProfile,
  saveTransferProfile,
} from '../../account/accountSlice'
import { addToast } from '../../ui/uiSlice'
import { directionInfo } from '../transferUtils'
import {
  findMatchingTransferProfile,
  partyToTransferProfileInput,
} from '../transferProfileFavorites'
import { TransferParticipantCard } from './TransferDetailParts'

export function TransferDetailParticipantsSection({ transfer }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const transferProfiles = useSelector((state) => state.account.transferProfiles || [])
  const originCountry = transfer.originCountry || user?.originCountry || 'BJ'
  const destinationCountry =
    directionInfo(transfer.direction, originCountry).destinationCountry || originCountry

  function toggleFavorite(party, country) {
    if (!user?.id || !party?.phone) return
    const existing = findMatchingTransferProfile(transferProfiles, party, user.id)
    if (existing) {
      dispatch(removeTransferProfile({ id: existing.id, userId: user.id }))
      dispatch(
        addToast({
          title: t('transfers.detail.participants.favoriteRemovedTitle'),
          message: t('transfers.detail.participants.favoriteRemovedMessage'),
          tone: 'info',
        }),
      )
      return
    }

    const hasName = String(party.firstName || '').trim() && String(party.lastName || '').trim()
    if (!hasName) {
      dispatch(
        addToast({
          title: t('transfers.detail.participants.favoriteErrorTitle'),
          message: t('transfers.detail.participants.favoriteIncomplete'),
          tone: 'error',
        }),
      )
      return
    }

    dispatch(
      saveTransferProfile(
        partyToTransferProfileInput(party, {
          userId: user.id,
          country,
          method: party.method || 'mobile_money',
        }),
      ),
    )
    dispatch(
      addToast({
        title: t('transfers.detail.participants.favoriteSavedTitle'),
        message: t('transfers.detail.participants.favoriteSavedMessage'),
        tone: 'success',
      }),
    )
  }

  const senderFavorite = findMatchingTransferProfile(
    transferProfiles,
    transfer.sender,
    user?.id,
  )
  const recipientFavorite = findMatchingTransferProfile(
    transferProfiles,
    transfer.recipient,
    user?.id,
  )

  return (
    <Card className="ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
      <h2 className="flex items-center gap-2 font-black">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiUsers className="text-sm" />
        </span>
        {t('transfers.detail.participants.title')}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TransferParticipantCard
          title={t('transfers.detail.participants.sender')}
          party={transfer.sender}
          isFavorite={Boolean(senderFavorite)}
          onToggleFavorite={() => toggleFavorite(transfer.sender, originCountry)}
        />
        <TransferParticipantCard
          title={t('transfers.detail.participants.recipient')}
          party={transfer.recipient}
          isFavorite={Boolean(recipientFavorite)}
          onToggleFavorite={() => toggleFavorite(transfer.recipient, destinationCountry)}
        />
      </div>
    </Card>
  )
}
