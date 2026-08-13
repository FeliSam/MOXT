import { FiUsers } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Card } from '../../../components/ui/Card'
import { LinkifiedText } from '../../../components/ui/LinkifiedText'
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

export function TransferDetailParticipantsSection({ enablePhoneCopy = false, transfer }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const transferProfiles = useSelector((state) => state.account.transferProfiles || [])
  const originCountry = transfer.originCountry || user?.originCountry || 'BJ'
  const destinationCountry =
    directionInfo(transfer.direction, originCountry).destinationCountry || originCountry

  function copyPhone(phone) {
    if (!phone) return
    navigator.clipboard?.writeText(phone)
    dispatch(
      addToast({
        title: t('transfers.detail.copiedTitle'),
        message: t('transfers.detail.copiedMessage', {
          label: t('transfers.detail.copy.coordinates'),
        }),
        tone: 'info',
      }),
    )
  }

  const onCopyPhone = enablePhoneCopy ? copyPhone : null

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
    <Card className="min-w-0 overflow-hidden ring-1 ring-transparent transition-shadow duration-300 hover:ring-brand-200 dark:hover:ring-brand-800">
      <h2 className="flex min-w-0 items-center gap-2 font-black">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
          <FiUsers className="text-sm" />
        </span>
        <span className="min-w-0 truncate">{t('transfers.detail.participants.title')}</span>
      </h2>
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        <TransferParticipantCard
          title={t('transfers.detail.participants.sender')}
          party={transfer.sender}
          isFavorite={Boolean(senderFavorite)}
          onCopyPhone={onCopyPhone}
          onToggleFavorite={() => toggleFavorite(transfer.sender, originCountry)}
        />
        <TransferParticipantCard
          title={t('transfers.detail.participants.recipient')}
          party={transfer.recipient}
          isFavorite={Boolean(recipientFavorite)}
          onCopyPhone={onCopyPhone}
          onToggleFavorite={() => toggleFavorite(transfer.recipient, destinationCountry)}
        />
      </div>
      {String(transfer.noteToExchanger || '').trim() ? (
        <div className="mt-4 min-w-0 overflow-hidden rounded-xl bg-[var(--app-surface-muted)] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
            {t('transfers.detail.noteToExchanger')}
          </p>
          <LinkifiedText
            as="p"
            text={String(transfer.noteToExchanger).trim()}
            preserveWhitespace="pre-wrap"
            className="mt-1 text-sm text-[var(--app-text)] [overflow-wrap:anywhere]"
          />
        </div>
      ) : null}
    </Card>
  )
}
