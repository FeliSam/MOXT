import { FiArrowLeft, FiMessageSquare } from 'react-icons/fi'
import { Button } from '../../components/ui/Button'

export function ConversationNotFound({ onBack }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-[var(--app-surface-muted)] text-2xl text-[var(--app-text-muted)]">
        <FiMessageSquare />
      </span>
      <div>
        <h2 className="font-display text-lg font-extrabold">Conversation indisponible</h2>
        <p className="mt-2 max-w-sm text-sm text-[var(--app-text-muted)]">
          Ce fil de discussion n’existe pas ou n’est plus accessible depuis ce lien.
        </p>
      </div>
      <Button type="button" className="gap-2" onClick={onBack}>
        <FiArrowLeft /> Retour aux conversations
      </Button>
    </div>
  )
}
