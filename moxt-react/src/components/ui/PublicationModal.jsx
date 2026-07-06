import { FiPlus } from 'react-icons/fi'
import { Modal } from './Modal'

export function PublicationModal({
  children,
  description,
  icon: Icon = FiPlus,
  onClose,
  open,
  title,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="large">
      <div className="mb-6 flex items-start gap-4 rounded-[1.5rem] bg-gradient-to-br from-brand-50 to-blue-50 p-4 dark:from-brand-950/50 dark:to-blue-950/40">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-700 text-xl text-white">
          <Icon />
        </span>
        <div>
          <strong className="block">{title}</strong>
          <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
        </div>
      </div>
      {children}
    </Modal>
  )
}
