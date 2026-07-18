import { FiRefreshCw, FiWifiOff } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { phase3Text } from '../../i18n/phase3I18n'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function NetworkReconnectModal({
  open,
  onClose,
  onRetry,
  titleKey = 'errors.network.title',
  bodyKey = 'errors.network.body',
}) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)

  function handleRetry() {
    if (onRetry) {
      onRetry()
      return
    }
    window.location.reload()
  }

  return (
    <Modal open={open} onClose={onClose} title={p3(titleKey)}>
      <div className="grid gap-5">
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <FiWifiOff className="size-5" aria-hidden />
          </span>
          <p className="text-sm leading-6 text-[var(--app-text-muted)]">{p3(bodyKey)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={FiRefreshCw} onClick={handleRetry}>
            {p3('errors.network.retry')}
          </Button>
          {onClose ? (
            <Button variant="secondary" onClick={onClose}>
              {p3('errors.network.close')}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
