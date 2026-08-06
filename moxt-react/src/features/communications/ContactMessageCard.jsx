import { FiMapPin, FiUser } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { EntityAvatar } from '../account/EntityAvatar'
import { useLanguage } from '../../contexts/useLanguage'
import { messagesText } from './messagesI18n'
import {
  resolveContactDisplayName,
  resolveContactProfileName,
} from './contactShareUtils'

export function ContactMessageCard({ attachment, mine = false }) {
  const { t } = useLanguage()
  const profile = useSelector((state) => state.profileDirectory?.byId?.[attachment?.userId])
  if (!attachment?.userId) return null
  const path = attachment.path || `/users/${attachment.userId}/publications`
  const name = resolveContactDisplayName(
    resolveContactProfileName(profile),
    attachment.name,
    messagesText(t, 'messages.contact.fallbackName'),
  )
  const avatarUrl = attachment.avatarUrl || profile?.avatarUrl || null
  const city = attachment.city || profile?.city || ''

  return (
    <Link
      to={path}
      className={`contact-message-card group flex min-w-[12.5rem] max-w-[16rem] items-center gap-3 rounded-2xl border px-3 py-2.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${
        mine
          ? 'border-white/25 bg-white/10 text-inherit'
          : 'border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]'
      }`}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="relative shrink-0">
        <EntityAvatar name={name} src={avatarUrl} size="md" shape="user" />
        <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border border-[var(--app-surface)] bg-[var(--app-accent)] text-white shadow-sm">
          <FiUser className="text-[10px]" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black leading-tight">{name}</span>
        {city ? (
          <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] opacity-80">
            <FiMapPin className="shrink-0 text-[10px]" />
            {city}
          </span>
        ) : (
          <span className="mt-0.5 block text-[11px] opacity-70">
            {messagesText(t, 'messages.contact.openProfile')}
          </span>
        )}
      </span>
    </Link>
  )
}
