import { useLanguage } from '../../contexts/useLanguage'
import { Button } from './Button'
import { Modal } from './Modal'

export function ConfirmDialog({ description, onCancel, onConfirm, open, title }) {
  const { t } = useLanguage()
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {t('common.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
