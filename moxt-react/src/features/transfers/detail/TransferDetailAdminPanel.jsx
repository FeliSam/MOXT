import { FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { confirmAction } from '../../../contexts/confirmBridge'
import { useLanguage } from '../../../contexts/useLanguage'
import { adminText } from '../../admin/adminI18n'
import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from '../transferConfig'
import { moderateTransfer } from '../transferSlice'

export function TransferDetailAdminPanel({ transfer }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const next = TRANSFER_TRANSITIONS[transfer.status]
  const advanceLabel = t('transfers.detail.admin.advanceTo', { status: next })
  const cancelLabel = t('transfers.detail.admin.forceCancel')

  function ask(label, action) {
    confirmAction({
      title: adminText(t, 'admin.confirm.actionTitle'),
      description: adminText(t, 'admin.confirm.actionBody', { action: label }),
      onConfirm: action,
    })
  }

  return (
    <Card className="border border-brand-100 bg-brand-50/60 dark:border-brand-900/40 dark:bg-brand-950/20">
      <h2 className="flex items-center gap-2 font-black">
        <FiShield className="text-brand-700" />
        {t('transfers.detail.admin.title')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
        {t('transfers.detail.admin.description')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {next ? (
          <Button
            onClick={() =>
              ask(advanceLabel, () =>
                dispatch(
                  moderateTransfer({
                    id: transfer.id,
                    status: next,
                    actorId: user?.id,
                    actorRole: user?.role || 'admin',
                    proof:
                      next === TRANSFER_STATUS.PAID_OUT
                        ? transfer.businessProof || {
                            name: 'admin-advance.pdf',
                            uploadedAt: new Date().toISOString(),
                          }
                        : undefined,
                  }),
                ),
              )
            }
          >
            {advanceLabel}
          </Button>
        ) : null}
        {transfer.status !== TRANSFER_STATUS.CANCELLED ? (
          <Button
            variant="danger"
            onClick={() =>
              ask(cancelLabel, () =>
                dispatch(
                  moderateTransfer({
                    id: transfer.id,
                    status: TRANSFER_STATUS.CANCELLED,
                    actorId: user?.id,
                    actorRole: user?.role || 'admin',
                  }),
                ),
              )
            }
          >
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
