import { useState } from 'react'
import { FiDownload } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { updateUserStatus } from '../features/administration/administrationSlice'
import { ADMIN_VIEW_IDS, MAIN_VIEWS, CARD } from '../features/admin/adminConfig'
import { adminOptionLabel, adminText } from '../features/admin/adminI18n'
import { AdminAuditPanel } from '../features/admin/components/AdminAuditPanel'
import { AdminContentPanel } from '../features/admin/components/AdminContentPanel'
import { AdminDetailPanel } from '../features/admin/components/AdminDetailPanel'
import { AdminOverviewPanel } from '../features/admin/components/AdminOverviewPanel'
import { AdminQueuesPanel } from '../features/admin/components/AdminQueuesPanel'
import { AdminSupportPanel } from '../features/admin/components/AdminSupportPanel'
import { AdminTransfersPanel } from '../features/admin/components/AdminTransfersPanel'
import { AdminUsersPanel } from '../features/admin/components/AdminUsersPanel'
import { AdminVerificationsPanel } from '../features/admin/components/AdminVerificationsPanel'
import { GlobalFilterBar, SystemStatusBar } from '../features/admin/components/AdminShared'
import { AdminIdentityCard, HeroKpiRow, SidebarBtn } from '../features/admin/components/AdminShell'
import { badgeForView, exportSnapshot } from '../features/admin/adminData'
import { useAdminPageData } from '../features/admin/hooks/useAdminPageData'

function resolveAdminView(value) {
  if (ADMIN_VIEW_IDS.includes(value)) return value
  return 'overview'
}

export function AdminPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const admin = useSelector((v) => v.auth.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const view = resolveAdminView(searchParams.get('view'))
  const [contentView, setContentView] = useState('businesses')
  const [selected, setSelected] = useState(null)
  const [supportReply, setSupportReply] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmUser, setConfirmUser] = useState(null)

  const {
    state,
    metrics,
    queues,
    content,
    supportTickets,
    users,
    transfers,
    auditItems,
    activeContentItems,
    allTransfers,
    allVerifications,
  } = useAdminPageData(query, statusFilter, contentView)

  function switchView(next) {
    const resolved = resolveAdminView(next)
    setSelected(null)
    setQuery('')
    setStatusFilter('all')
    const params = new URLSearchParams(searchParams)
    if (resolved === 'overview') params.delete('view')
    else params.set('view', resolved)
    setSearchParams(params, { replace: true })
  }

  const confirmName = `${confirmUser?.firstName || ''} ${confirmUser?.lastName || ''}`.trim()

  return (
    <div className="grid gap-6">
      <SystemStatusBar metrics={metrics} queues={queues} />

      <PageHeader
        eyebrow={adminText(t, 'admin.page.eyebrow')}
        title={adminText(t, 'admin.page.title')}
        description={adminText(t, 'admin.page.description')}
        actions={
          <Button variant="secondary" icon={FiDownload} onClick={() => exportSnapshot(state)}>
            {adminText(t, 'admin.page.export')}
          </Button>
        }
      />

      <HeroKpiRow metrics={metrics} queues={queues} onSelect={switchView} />

      <div className="grid gap-5 xl:grid-cols-[14rem_minmax(0,1fr)_minmax(0,22rem)]">
        <aside className="grid min-w-0 content-start gap-2">
          <AdminIdentityCard admin={admin} />
          <nav className={`${CARD} grid content-start gap-1 p-2`}>
            {MAIN_VIEWS.map((item) => {
              const badge = badgeForView(item.id, metrics, queues)
              return (
                <SidebarBtn
                  key={item.id}
                  active={view === item.id}
                  badge={badge}
                  icon={item.icon}
                  label={adminOptionLabel(t, item)}
                  onClick={() => switchView(item.id)}
                />
              )
            })}
          </nav>
        </aside>

        <div className="grid min-w-0 gap-5 content-start">
          <GlobalFilterBar
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            view={view}
          />

          {view === 'overview' && (
            <AdminOverviewPanel
              content={content}
              metrics={metrics}
              queues={queues}
              onOpenContent={(next) => { setContentView(next); switchView('content') }}
              onOpenView={switchView}
              setSelected={setSelected}
              transfers={allTransfers}
            />
          )}
          {view === 'transfers' && (
            <AdminTransfersPanel dispatch={dispatch} setSelected={setSelected} transfers={transfers} />
          )}
          {view === 'content' && (
            <AdminContentPanel
              contentView={contentView}
              dispatch={dispatch}
              items={activeContentItems}
              setContentView={setContentView}
              setSelected={setSelected}
            />
          )}
          {view === 'support' && (
            <AdminSupportPanel
              admin={admin}
              dispatch={dispatch}
              reply={supportReply}
              setReply={setSupportReply}
              setSelected={setSelected}
              tickets={supportTickets}
            />
          )}
          {view === 'users' && (
            <AdminUsersPanel
              actorRole={admin?.role}
              dispatch={dispatch}
              onSuspendUser={setConfirmUser}
              setSelected={setSelected}
              users={users}
            />
          )}
          {view === 'verifications' && (
            <AdminVerificationsPanel
              adminId={admin?.id}
              dispatch={dispatch}
              query={query}
              setSelected={setSelected}
              statusFilter={statusFilter}
              verifications={allVerifications}
            />
          )}
          {view === 'queues' && (
            <AdminQueuesPanel
              adminId={admin?.id}
              dispatch={dispatch}
              queues={queues}
              setSelected={setSelected}
            />
          )}
          {view === 'audit' && (
            <AdminAuditPanel auditItems={auditItems} setSelected={setSelected} />
          )}
        </div>

        <AdminDetailPanel
          admin={admin}
          dispatch={dispatch}
          onSuspendUser={setConfirmUser}
          selected={selected}
          supportReply={supportReply}
          setSupportReply={setSupportReply}
        />
      </div>

      <ConfirmDialog
        open={Boolean(confirmUser)}
        title={
          confirmUser?.status === 'suspended'
            ? adminText(t, 'admin.confirm.reactivateTitle')
            : adminText(t, 'admin.confirm.suspendTitle')
        }
        description={
          confirmUser?.status === 'suspended'
            ? adminText(t, 'admin.confirm.reactivateBody', { name: confirmName })
            : adminText(t, 'admin.confirm.suspendBody', { name: confirmName })
        }
        onCancel={() => setConfirmUser(null)}
        onConfirm={() => {
          dispatch(
            updateUserStatus({
              id: confirmUser.id,
              status: confirmUser.status === 'suspended' ? 'active' : 'suspended',
            }),
          )
          setConfirmUser(null)
        }}
      />
    </div>
  )
}
