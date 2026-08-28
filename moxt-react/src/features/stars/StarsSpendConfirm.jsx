import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useLanguage } from '../../contexts/useLanguage'

export function StarsSpendConfirm({ open, quote, onCancel, onConfirm }) {
  const { t } = useLanguage()
  if (!open || !quote) return null
  return (
    <Modal open={open} onClose={onCancel} title={t('stars.confirmTitle')}>
      <p className="text-sm leading-6 text-[var(--app-text-muted)]">
        {t('stars.confirmBody', { split: quote.splitLabel || `${quote.bonus} + ${quote.paid}` })}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button onClick={onConfirm}>{t('stars.confirmPay')}</Button>
      </div>
    </Modal>
  )
}
