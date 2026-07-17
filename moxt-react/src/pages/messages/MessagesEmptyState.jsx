import { FiBriefcase, FiMessageSquare, FiPackage } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useLanguage } from '../../contexts/useLanguage'
import { messagesText } from '../../features/communications/messagesI18n'

export function MessagesEmptyState() {
  const { t } = useLanguage()
  return (
    <div className="mx-2 mt-2 rounded-[1.35rem] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-center shadow-sm">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--app-accent-soft)] text-xl text-[var(--app-accent)]">
        <FiMessageSquare />
      </span>
      <h2 className="mt-4 font-display text-base font-extrabold">
        {messagesText(t, 'messages.empty.title')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
        {messagesText(t, 'messages.empty.description')}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to="/marketplace">
          <Button variant="secondary" className="gap-2">
            <FiBriefcase /> {messagesText(t, 'messages.empty.marketplace')}
          </Button>
        </Link>
        <Link to="/parcels">
          <Button variant="secondary" className="gap-2">
            <FiPackage /> {messagesText(t, 'messages.empty.parcels')}
          </Button>
        </Link>
        <Link to="/activities">
          <Button>{messagesText(t, 'messages.empty.activities')}</Button>
        </Link>
      </div>
    </div>
  )
}
