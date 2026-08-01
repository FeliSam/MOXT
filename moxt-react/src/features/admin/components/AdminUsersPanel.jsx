import { useMemo, useState } from 'react'
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useLanguage } from '../../../contexts/useLanguage'
import { Button } from '../../../components/ui/Button'
import { PasswordConfirmDialog } from '../../../components/ui/PasswordConfirmDialog'
import { Select } from '../../../components/ui/Select'
import { VerifiedDisplayName } from '../../../components/ui/Badge'
import { flagEmoji } from '../../../config/flags'
import { useGeographyOptions } from '../../../hooks/useGeographyOptions'
import { supabase } from '../../../services/supabaseClient'
import { formatShortDate } from '@moxt/shared/utils/formatters.js'
import { isProfileVerified } from '../../profile/userProfileUtils'
import { dispatchUserRole } from '../promoteAdminUtils'
import { CARD, ITEM, ROLE_COLORS } from '../adminConfig'
import { adminText } from '../adminI18n'
import { avatarColor, initials } from '../adminUtils'
import { Empty, SectionTitle } from './AdminShared'

const SORT_OPTIONS = ['newest', 'oldest', 'name']

export function AdminUsersPanel({ actorRole, dispatch, onSuspendUser, setSelected, users }) {
  const { t } = useLanguage()
  const { countries } = useGeographyOptions()
  const onlineMap = useSelector((state) => state.presence?.online || {})
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [presenceFilter, setPresenceFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [pendingRoleChange, setPendingRoleChange] = useState(null)
  const [confirmingPassword, setConfirmingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const onlineCount = useMemo(
    () => users.filter((user) => Boolean(onlineMap[user.id])).length,
    [onlineMap, users],
  )

  const countriesInUse = useMemo(() => {
    const codes = new Set(users.map((user) => user.originCountry).filter(Boolean))
    return countries.filter((country) => codes.has(country.code))
  }, [countries, users])

  const citiesInUse = useMemo(
    () => [...new Set(users.map((user) => user.city).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [users],
  )

  const visibleUsers = useMemo(() => {
    let items = users
    const wantOnline = onlineOnly || presenceFilter === 'online'
    const wantOffline = presenceFilter === 'offline'
    if (wantOnline) items = items.filter((user) => Boolean(onlineMap[user.id]))
    if (wantOffline) items = items.filter((user) => !onlineMap[user.id])
    if (countryFilter !== 'all') items = items.filter((user) => user.originCountry === countryFilter)
    if (cityFilter !== 'all') items = items.filter((user) => user.city === cityFilter)
    items = [...items].sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.firstName || ''} ${a.lastName || ''}`.trim().localeCompare(
          `${b.firstName || ''} ${b.lastName || ''}`.trim(),
        )
      }
      const at = new Date(a.createdAt || 0).getTime()
      const bt = new Date(b.createdAt || 0).getTime()
      return sortBy === 'oldest' ? at - bt : bt - at
    })
    return items
  }, [cityFilter, countryFilter, onlineMap, onlineOnly, presenceFilter, sortBy, users])

  function requestRoleChange(user, role) {
    if (role === user.role) return
    if (role === 'admin' && actorRole !== 'superadmin') return
    setPasswordError('')
    setPendingRoleChange({ user, role })
  }

  async function confirmRoleChange(password) {
    if (!pendingRoleChange) return
    setConfirmingPassword(true)
    setPasswordError('')
    try {
      const { data, error } = await supabase.functions.invoke('admin-verify-password', {
        body: { password },
      })
      if (error || !data?.ok) {
        setPasswordError(adminText(t, 'admin.users.roleChange.wrongPassword'))
        return
      }
      const { user, role } = pendingRoleChange
      setPendingRoleChange(null)
      await dispatchUserRole(dispatch, { actorRole, id: user.id, role, t })
    } finally {
      setConfirmingPassword(false)
    }
  }

  const pendingUserName = pendingRoleChange
    ? `${pendingRoleChange.user.firstName || ''} ${pendingRoleChange.user.lastName || ''}`.trim() ||
      pendingRoleChange.user.email
    : ''

  return (
    <div className={`${CARD} grid gap-4 p-5`}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={FiUsers} label={adminText(t, 'admin.users.title')} count={users.length} />
        <button
          type="button"
          onClick={() => {
            setOnlineOnly((current) => {
              const next = !current
              setPresenceFilter(next ? 'online' : 'all')
              return next
            })
          }}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-xs font-black transition ${
            onlineOnly || presenceFilter === 'online'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
          }`}
          aria-pressed={onlineOnly || presenceFilter === 'online'}
        >
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300 opacity-75" />
          </span>
          {adminText(t, 'admin.users.onlineButton', { count: onlineCount })}
        </button>
      </div>

      <div className="flex min-w-0 flex-wrap gap-3">
        <Select
          id="admin-users-presence-filter"
          wrapperClass="min-w-0 flex-1 sm:max-w-48"
          value={presenceFilter}
          onChange={(event) => {
            const next = event.target.value
            setPresenceFilter(next)
            setOnlineOnly(next === 'online')
          }}
        >
          <option value="all">{adminText(t, 'admin.users.presenceFilterAll')}</option>
          <option value="online">{adminText(t, 'admin.users.presenceFilterOnline')}</option>
          <option value="offline">{adminText(t, 'admin.users.presenceFilterOffline')}</option>
        </Select>
        <Select
          id="admin-users-country-filter"
          wrapperClass="min-w-0 flex-1 sm:max-w-64"
          value={countryFilter}
          onChange={(event) => setCountryFilter(event.target.value)}
        >
          <option value="all">{adminText(t, 'admin.users.countryFilterAll')}</option>
          {countriesInUse.map((country) => (
            <option key={country.code} value={country.code}>
              {flagEmoji(country.code)} {country.name}
            </option>
          ))}
        </Select>
        <Select
          id="admin-users-city-filter"
          wrapperClass="min-w-0 flex-1 sm:max-w-56"
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
        >
          <option value="all">{adminText(t, 'admin.users.cityFilterAll')}</option>
          {citiesInUse.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        <Select
          id="admin-users-sort"
          wrapperClass="min-w-0 flex-1 sm:max-w-48"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {adminText(
                t,
                option === 'newest'
                  ? 'admin.users.sortNewest'
                  : option === 'oldest'
                    ? 'admin.users.sortOldest'
                    : 'admin.users.sortNameAZ',
              )}
            </option>
          ))}
        </Select>
      </div>

      {visibleUsers.length ? (
        visibleUsers.map((user) => {
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
          const isOnline = Boolean(onlineMap[user.id])
          const country = countries.find((item) => item.code === user.originCountry)
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
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[var(--app-text-muted)]">
                    {isOnline ? (
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        {adminText(t, 'admin.users.online')}
                      </span>
                    ) : null}
                    {country ? (
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin className="shrink-0" />
                        {flagEmoji(country.code)} {country.name}
                        {user.city ? ` · ${user.city}` : ''}
                      </span>
                    ) : user.city ? (
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin className="shrink-0" />
                        {user.city}
                      </span>
                    ) : null}
                    {user.createdAt ? (
                      <span className="inline-flex items-center gap-1">
                        <FiCalendar className="shrink-0" />
                        {adminText(t, 'admin.users.createdAt', { date: formatShortDate(user.createdAt) })}
                      </span>
                    ) : null}
                  </div>
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
                    onClick={() => requestRoleChange(user, role)}
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

      <PasswordConfirmDialog
        open={Boolean(pendingRoleChange)}
        title={adminText(t, 'admin.users.roleChange.title')}
        description={
          pendingRoleChange
            ? adminText(t, 'admin.users.roleChange.description', {
                name: pendingUserName,
                fromRole: pendingRoleChange.user.role,
                toRole: pendingRoleChange.role,
              })
            : ''
        }
        confirmLabel={adminText(t, 'admin.users.roleChange.confirmLabel')}
        loading={confirmingPassword}
        error={passwordError}
        onCancel={() => {
          setPendingRoleChange(null)
          setPasswordError('')
        }}
        onConfirm={confirmRoleChange}
      />
    </div>
  )
}
