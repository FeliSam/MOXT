import { FiArrowLeft, FiMessageSquare } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { messagesText } from '../../features/communications/messagesI18n'

export function ConversationNotFound({ onBack }) {
  const { t } = useLanguage()
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-2xl text-[var(--app-text-muted)]">
        <FiMessageSquare />
      </span>
      <div>
        <h2 className="font-display text-lg font-extrabold">
          {messagesText(t, 'messages.notFound.title')}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-[var(--app-text-muted)]">
          {messagesText(t, 'messages.notFound.description')}
        </p>
      </div>
      <Button type="button" className="gap-2" onClick={onBack}>
        <FiArrowLeft /> {messagesText(t, 'messages.notFound.back')}
      </Button>
    </div>
  )
}
