import { FiActivity, FiDatabase, FiShield, FiUsers } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { PERMISSIONS, ROLE_PERMISSIONS, roleCan } from '../config/rolePermissions'
import { adminOptionLabel, adminText } from '../features/admin/adminI18n'
import { formatDateTime } from '../utils/formatters'

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
    <div className="grid gap-7">
      <PageHeader
        eyebrow={adminText(t, 'admin.super.eyebrow')}
        title={adminText(t, 'admin.super.title')}
        description={adminText(t, 'admin.super.description')}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <Card key={label}>
            <Icon className="text-2xl text-brand-600" />
            <strong className="mt-4 block text-3xl">{value}</strong>
            <span className="text-sm text-[var(--app-text-muted)]">{label}</span>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="font-black">{adminText(t, 'admin.super.migration.title')}</h2>
        <p className="mt-3 text-sm text-[var(--app-text-muted)]">
          {migration
            ? adminText(t, 'admin.super.migration.done', {
                count: migration.migrated,
                date: formatDateTime(migration.checkedAt),
              })
            : adminText(t, 'admin.super.migration.empty')}
        </p>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black">{adminText(t, 'admin.super.roles.title')}</h2>
            <p className="mt-1 text-sm text-[var(--app-text-muted)]">
              {adminText(t, 'admin.super.roles.description')}
            </p>
          </div>
          <Button variant="secondary" onClick={exportAudit}>
            {adminText(t, 'admin.super.roles.exportAudit')}
          </Button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="text-[var(--app-text-muted)]">
                <th className="p-3">{adminText(t, 'admin.super.roles.permission')}</th>
                {Object.keys(ROLE_PERMISSIONS).map((role) => (
                  <th className="p-3 text-center capitalize" key={role}>
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission) => (
                <tr className="border-t border-[var(--app-border)]" key={permission.id}>
                  <td className="p-3 font-semibold">{adminOptionLabel(t, permission)}</td>
                  {Object.keys(ROLE_PERMISSIONS).map((role) => (
                    <td className="p-3 text-center" key={role}>
                      {roleCan(role, permission.id)
                        ? adminText(t, 'admin.super.yes')
                        : adminText(t, 'admin.super.no')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
