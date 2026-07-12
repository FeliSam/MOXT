import { FiUsers } from 'react-icons/fi'
import { Button } from '../../../components/ui/Button'
import { updateUserRole } from '../../administration/administrationSlice'
import { CARD, ITEM, ROLE_COLORS } from '../adminConfig'
import { avatarColor, initials } from '../adminUtils'
import { Empty, SectionTitle } from './AdminShared'

export function AdminUsersPanel({ dispatch, onSuspendUser, setSelected, users }) {
  return (
    <div className={`${CARD} p-5 grid gap-4`}>
      <SectionTitle icon={FiUsers} label="Utilisateurs et roles" count={users.length} />
      {users.length ? (
        users.map((user) => {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
          return (
            <div key={user.id} className={`${ITEM} grid gap-3`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black ${avatarColor(name)}`}>
                  {initials(name)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'user', item: user })}
                  className="min-w-0 text-left hover:text-brand-700"
                >
                  <strong className="block text-sm">{name || user.email}</strong>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">{user.email}</p>
                </button>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                  {user.role}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                    user.status === 'suspended'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                      : user.status === 'pending_deletion'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  }`}
                >
                  {user.status === 'pending_deletion' ? 'suppression demandée' : user.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['user', 'professional', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => dispatch(updateUserRole({ id: user.id, role }))}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:shadow-sm ${
                      user.role === role
                        ? 'bg-brand-700 text-white'
                        : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-brand-50 hover:text-brand-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
                <Button
                  variant={user.status === 'suspended' ? 'secondary' : 'danger'}
                  onClick={() => onSuspendUser(user)}
                >
                  {user.status === 'suspended' ? 'Reactiver' : 'Suspendre'}
                </Button>
              </div>
            </div>
          )
        })
      ) : (
        <Empty label="Aucun utilisateur trouve." icon={FiUsers} />
      )}
    </div>
  )
}
