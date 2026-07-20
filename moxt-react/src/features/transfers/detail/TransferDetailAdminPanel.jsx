import { FiShield } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { useLanguage } from '../../../contexts/useLanguage'
import { TRANSFER_STATUS, TRANSFER_TRANSITIONS } from '../transferConfig'
import { moderateTransfer } from '../transferSlice'

export function TransferDetailAdminPanel({ transfer }) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

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
        {TRANSFER_TRANSITIONS[transfer.status] ? (
          <Button
            onClick={() => {
              const next = TRANSFER_TRANSITIONS[transfer.status]
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
              )
            }}
          >
            {t('transfers.detail.admin.advanceTo', {
              status: TRANSFER_TRANSITIONS[transfer.status],
            })}
          </Button>
        ) : null}
        {transfer.status !== TRANSFER_STATUS.CANCELLED ? (
          <Button
            variant="danger"
            onClick={() =>
              dispatch(
                moderateTransfer({
                  id: transfer.id,
                  status: TRANSFER_STATUS.CANCELLED,
                  actorId: user?.id,
                  actorRole: user?.role || 'admin',
                }),
              )
            }
          >
            {t('transfers.detail.admin.forceCancel')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
