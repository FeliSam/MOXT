import { FiUsers } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { dispatchUserRole } from '../promoteAdminUtils'
import { CARD, ITEM, ROLE_COLORS } from '../adminConfig'
import { adminText } from '../adminI18n'
import { avatarColor, initials } from '../adminUtils'
import { Empty, SectionTitle } from './AdminShared'

export function AdminUsersPanel({ actorRole, dispatch, onSuspendUser, setSelected, users }) {
  const { t } = useLanguage()

  return (
    <div className={`${CARD} p-5 grid gap-4`}>
      <SectionTitle icon={FiUsers} label={adminText(t, 'admin.users.title')} count={users.length} />
      {users.length ? (
        users.map((user) => {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
          return (
            <div key={user.id} className={`${ITEM} grid min-w-0 gap-3 overflow-hidden`}>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black ${avatarColor(name)}`}>
                  {initials(name)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'user', item: user })}
                  className="min-w-0 flex-1 text-left hover:text-brand-700"
                >
                  <strong className="block truncate text-sm">{name || user.email}</strong>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">{user.email}</p>
                </button>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                  {user.role}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                    user.status === 'suspended'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                      : user.status === 'pending_deletion'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  }`}
                >
                  {user.status === 'pending_deletion'
                    ? adminText(t, 'admin.users.pendingDeletion')
                    : user.status}
                </span>
              </div>
              <div className="flex min-w-0 flex-wrap gap-2">
                {['user', 'professional', 'admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={role === 'admin' && actorRole !== 'superadmin'}
                    onClick={() => dispatchUserRole(dispatch, { actorRole, id: user.id, role, t })}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 ${
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
                  {user.status === 'suspended'
                    ? adminText(t, 'admin.actions.reactivate')
                    : adminText(t, 'admin.actions.suspend')}
                </Button>
              </div>
            </div>
          )
        })
      ) : (
        <Empty label={adminText(t, 'admin.empty.noUsers')} icon={FiUsers} />
      )}
    </div>
  )
}
