import { useMemo, useState } from 'react'
import { FiUsers } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { VerifiedDisplayName } from '../../../components/ui/Badge'
import { isProfileVerified } from '../../profile/userProfileUtils'
import { dispatchUserRole } from '../promoteAdminUtils'
import { CARD, ITEM, ROLE_COLORS } from '../adminConfig'
import { adminText } from '../adminI18n'
import { avatarColor, initials } from '../adminUtils'
import { Empty, SectionTitle } from './AdminShared'

export function AdminUsersPanel({ actorRole, dispatch, onSuspendUser, setSelected, users }) {
  const { t } = useLanguage()
  const onlineMap = useSelector((state) => state.presence?.online || {})
  const [onlineOnly, setOnlineOnly] = useState(false)

  const onlineCount = useMemo(
    () => users.filter((user) => Boolean(onlineMap[user.id])).length,
    [onlineMap, users],
  )

  const visibleUsers = useMemo(
    () => (onlineOnly ? users.filter((user) => Boolean(onlineMap[user.id])) : users),
    [onlineMap, onlineOnly, users],
  )

  return (
    <div className={`${CARD} grid gap-4 p-5`}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={FiUsers} label={adminText(t, 'admin.users.title')} count={users.length} />
        <button
          type="button"
          onClick={() => setOnlineOnly((current) => !current)}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-xs font-black transition ${
            onlineOnly
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
          }`}
          aria-pressed={onlineOnly}
        >
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300 opacity-75" />
          </span>
          {adminText(t, 'admin.users.onlineButton', { count: onlineCount })}
        </button>
      </div>
      {visibleUsers.length ? (
        visibleUsers.map((user) => {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
          const isOnline = Boolean(onlineMap[user.id])
          return (
            <div key={user.id} className={`${ITEM} grid min-w-0 gap-3 overflow-hidden`}>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <span className="relative shrink-0">
                  <span
                    className={`grid size-9 place-items-center rounded-xl text-xs font-black ${avatarColor(name)}`}
                  >
                    {initials(name)}
                  </span>
                  {isOnline ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--app-surface-muted)] bg-emerald-500"
                      title={adminText(t, 'admin.users.online')}
                    />
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'user', item: user })}
                  className="min-w-0 flex-1 text-left hover:text-brand-700"
                >
                  <VerifiedDisplayName
                    as="strong"
                    name={name || user.email}
                    verified={isProfileVerified(user)}
                    className="block min-w-0 text-sm"
                    nameClassName="truncate"
                  />
                  <p className="truncate text-xs text-[var(--app-text-muted)]">{user.email}</p>
                  {isOnline ? (
                    <p className="mt-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      {adminText(t, 'admin.users.online')}
                    </p>
                  ) : null}
                </button>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}
                >
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
                {['user', 'professional', 'moderator', 'admin'].map((role) => (
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
        <Empty
          label={
            onlineOnly
              ? adminText(t, 'admin.empty.noOnlineUsers')
              : adminText(t, 'admin.empty.noUsers')
          }
          icon={FiUsers}
        />
      )}
    </div>
  )
}
