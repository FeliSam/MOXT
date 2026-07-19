import { FiActivity, FiBookOpen, FiCheck, FiDatabase, FiShield, FiUsers, FiX } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { PERMISSIONS, ROLE_PERMISSIONS, roleCan } from '../config/rolePermissions'
import { adminOptionLabel, adminText } from '../features/admin/adminI18n'
import { formatDateTime } from '../utils/formatters'

const ROLES = Object.keys(ROLE_PERMISSIONS)

function PermissionBadge({ allowed, t }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
        allowed
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {allowed ? <FiCheck aria-hidden="true" /> : <FiX aria-hidden="true" />}
      {allowed ? adminText(t, 'admin.super.yes') : adminText(t, 'admin.super.no')}
    </span>
  )
}

export function SuperAdminPage() {
  const { t } = useLanguage()
  const state = useSelector((value) => value)
  const migration = (() => {
    try {
      return JSON.parse(localStorage.getItem('moxt-legacy-migration-v1') || 'null')
    } catch {
      return null
    }
  })()
  const cards = [
    [adminText(t, 'admin.super.cards.redux'), Object.keys(state).length, FiDatabase],
    [adminText(t, 'admin.super.cards.businesses'), state.businesses.items.length, FiUsers],
    [adminText(t, 'admin.super.cards.reports'), state.marketplace.reports.length, FiShield],
    [adminText(t, 'admin.super.cards.audit'), state.audit.items.length, FiActivity],
  ]

  function exportAudit() {
    const blob = new Blob([JSON.stringify(state.audit.items, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `moxt-audit-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid min-w-0 max-w-full gap-6 sm:gap-7">
      <PageHeader
        eyebrow={adminText(t, 'admin.super.eyebrow')}
        title={adminText(t, 'admin.super.title')}
        description={adminText(t, 'admin.super.description')}
        actions={
          <Link to="/admin/guide">
            <Button variant="secondary" icon={FiBookOpen}>
              {adminText(t, 'admin.nav.guide')}
            </Button>
          </Link>
        }
      />
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <Card key={label} className="min-w-0">
            <Icon className="text-xl text-brand-600 sm:text-2xl" />
            <strong className="mt-3 block text-2xl tabular-nums sm:mt-4 sm:text-3xl">{value}</strong>
            <span className="mt-1 block text-xs leading-snug text-[var(--app-text-muted)] sm:text-sm">
              {label}
            </span>
          </Card>
        ))}
      </div>
      <Card className="min-w-0">
        <h2 className="font-black">{adminText(t, 'admin.super.migration.title')}</h2>
        <p className="mt-3 break-words text-sm leading-6 text-[var(--app-text-muted)]">
          {migration
            ? adminText(t, 'admin.super.migration.done', {
                count: migration.migrated,
                date: formatDateTime(migration.checkedAt),
              })
            : adminText(t, 'admin.super.migration.empty')}
        </p>
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-black">{adminText(t, 'admin.super.roles.title')}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
              {adminText(t, 'admin.super.roles.description')}
            </p>
          </div>
          <Button variant="secondary" className="w-full shrink-0 sm:w-auto" onClick={exportAudit}>
            {adminText(t, 'admin.super.roles.exportAudit')}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 lg:hidden">
          {PERMISSIONS.map((permission) => (
            <div
              key={permission.id}
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3"
            >
              <p className="text-sm font-semibold leading-snug [overflow-wrap:anywhere]">
                {adminOptionLabel(t, permission)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <div
                    key={role}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-[var(--app-surface)] px-3 py-2"
                  >
                    <span className="truncate text-xs font-bold capitalize text-[var(--app-text-muted)]">
                      {role}
                    </span>
                    <PermissionBadge allowed={roleCan(role, permission.id)} t={t} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 hidden min-w-0 lg:block">
          <div className="overflow-x-auto rounded-2xl border border-[var(--app-border)]">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                  <th className="p-3 font-bold">{adminText(t, 'admin.super.roles.permission')}</th>
                  {ROLES.map((role) => (
                    <th className="p-3 text-center font-bold capitalize" key={role}>
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((permission) => (
                  <tr className="border-t border-[var(--app-border)]" key={permission.id}>
                    <td className="max-w-[16rem] p-3 font-semibold leading-snug [overflow-wrap:anywhere]">
                      {adminOptionLabel(t, permission)}
                    </td>
                    {ROLES.map((role) => (
                      <td className="p-3 text-center" key={role}>
                        <PermissionBadge allowed={roleCan(role, permission.id)} t={t} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
