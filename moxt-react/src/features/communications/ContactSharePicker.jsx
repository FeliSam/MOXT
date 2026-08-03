import { useMemo, useState } from 'react'
import { FiSearch, FiUserCheck, FiUsers, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Modal } from '../../components/ui/Modal'
import { EntityAvatar } from '../account/EntityAvatar'
import { useLanguage } from '../../contexts/useLanguage'
import { messagesText } from './messagesI18n'
import {
  buildShareableContacts,
  filterShareableContacts,
} from './contactShareUtils'

function ContactSection({ title, icon: Icon, items, emptyLabel, onSelect }) {
  return (
    <section className="grid gap-2">
      <div className="flex items-center gap-2 px-1">
        <Icon className="text-[var(--app-accent)]" />
        <h3 className="text-xs font-black uppercase tracking-wide text-[var(--app-text-muted)]">
          {title}
        </h3>
        <span className="rounded-full bg-[var(--app-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-text-faint)]">
          {items.length}
        </span>
      </div>
      {items.length ? (
        <ul className="grid gap-1.5">
          {items.map((contact, index) => (
            <li
              key={`${contact.section}-${contact.userId}`}
              className="animate-[contactRowIn_280ms_ease-out_both]"
              style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
            >
              <button
                type="button"
                onClick={() => onSelect(contact)}
                className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-[var(--app-surface-muted)] px-3 py-2.5 text-left transition hover:border-brand-300 hover:bg-[var(--app-accent-soft)]"
              >
                <EntityAvatar
                  name={contact.name}
                  src={contact.avatarUrl}
                  size="md"
                  shape="user"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{contact.name}</span>
                  {contact.city ? (
                    <span className="block truncate text-xs text-[var(--app-text-muted)]">
                      {contact.city}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--app-border)] px-3 py-4 text-center text-xs text-[var(--app-text-muted)]">
          {emptyLabel}
        </p>
      )}
    </section>
  )
}

export function ContactSharePicker({ open, onClose, onSelect, userId }) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const subscriptions = useSelector((state) => state.account.subscriptions || [])
  const directory = useSelector((state) => state.profileDirectory?.byId || {})
  const adminUsers = useSelector((state) => state.administration?.users || [])

  const profileById = useMemo(() => {
    const map = { ...directory }
    for (const user of adminUsers) {
      if (!user?.id) continue
      map[user.id] = {
        ...(map[user.id] || {}),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl || map[user.id]?.avatarUrl,
        city: user.city || map[user.id]?.city,
      }
    }
    return map
  }, [adminUsers, directory])

  const { following, followers } = useMemo(
    () => buildShareableContacts({ userId, subscriptions, profileById }),
    [userId, subscriptions, profileById],
  )

  const filteredFollowing = filterShareableContacts(following, query)
  const filteredFollowers = filterShareableContacts(followers, query)

  return (
    <Modal
      open={open}
      onClose={() => {
        setQuery('')
        onClose?.()
      }}
      title={messagesText(t, 'messages.contact.pickerTitle')}
    >
      <div className="grid gap-4">
        <p className="text-sm text-[var(--app-text-muted)]">
          {messagesText(t, 'messages.contact.pickerHint')}
        </p>
        <label className="relative block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-faint)]" />
          <input
            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] py-2.5 pl-10 pr-10 text-sm outline-none focus:border-brand-400"
            placeholder={messagesText(t, 'messages.contact.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-border)]"
              onClick={() => setQuery('')}
              aria-label={messagesText(t, 'messages.contact.clearSearch')}
            >
              <FiX />
            </button>
          ) : null}
        </label>

        <div className="max-h-[min(52vh,24rem)] space-y-5 overflow-y-auto pr-1">
          <ContactSection
            title={messagesText(t, 'messages.contact.following')}
            icon={FiUserCheck}
            items={filteredFollowing}
            emptyLabel={messagesText(t, 'messages.contact.emptyFollowing')}
            onSelect={onSelect}
          />
          <ContactSection
            title={messagesText(t, 'messages.contact.followers')}
            icon={FiUsers}
            items={filteredFollowers}
            emptyLabel={messagesText(t, 'messages.contact.emptyFollowers')}
            onSelect={onSelect}
          />
        </div>
      </div>
      <style>{`
        @keyframes contactRowIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Modal>
  )
}
