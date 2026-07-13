import { useState } from 'react'
import { FiDownload } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { updateUserStatus } from '../features/administration/administrationSlice'
import { MAIN_VIEWS, CARD } from '../features/admin/adminConfig'
import { AdminAuditPanel } from '../features/admin/components/AdminAuditPanel'
import { AdminContentPanel } from '../features/admin/components/AdminContentPanel'
import { AdminDetailPanel } from '../features/admin/components/AdminDetailPanel'
import { AdminOverviewPanel } from '../features/admin/components/AdminOverviewPanel'
import { AdminQueuesPanel } from '../features/admin/components/AdminQueuesPanel'
import { AdminSupportPanel } from '../features/admin/components/AdminSupportPanel'
import { AdminTransfersPanel } from '../features/admin/components/AdminTransfersPanel'
import { AdminUsersPanel } from '../features/admin/components/AdminUsersPanel'
import { GlobalFilterBar, SystemStatusBar } from '../features/admin/components/AdminShared'
import { AdminIdentityCard, HeroKpiRow, SidebarBtn } from '../features/admin/components/AdminShell'
import { badgeForView, exportSnapshot } from '../features/admin/adminData'
import { useAdminPageData } from '../features/admin/hooks/useAdminPageData'

export function AdminPage() {
  const dispatch = useDispatch()
  const admin = useSelector((v) => v.auth.user)
  const [view, setView] = useState('overview')
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
  } = useAdminPageData(query, statusFilter, contentView)

  function switchView(next) {
    setView(next)
    setSelected(null)
    setQuery('')
    setStatusFilter('all')
  }

  return (
    <div className="grid gap-6">
      <SystemStatusBar metrics={metrics} queues={queues} />

      <PageHeader
        eyebrow="Administration"
        title="Centre de controle"
        description="Superviser les transferts, contenus, comptes, validations et tickets."
        actions={
          <Button variant="secondary" icon={FiDownload} onClick={() => exportSnapshot(state)}>
            Exporter
          </Button>
        }
      />

      <HeroKpiRow metrics={metrics} queues={queues} onSelect={switchView} />

      <div className="grid gap-5 xl:grid-cols-[14rem_minmax(0,1fr)_22rem]">
        <aside className="grid content-start gap-2">
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
                  label={item.label}
                  onClick={() => switchView(item.id)}
                />
              )
            })}
          </nav>
        </aside>

        <div className="grid gap-5 content-start">
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
          {view === 'queues' && (
            <AdminQueuesPanel dispatch={dispatch} queues={queues} setSelected={setSelected} />
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
        title={confirmUser?.status === 'suspended' ? 'Reactiver cet utilisateur ?' : 'Suspendre cet utilisateur ?'}
        description={
          confirmUser?.status === 'suspended'
            ? `${confirmUser?.firstName || ''} ${confirmUser?.lastName || ''} retrouvera un acces complet a la plateforme.`
            : `${confirmUser?.firstName || ''} ${confirmUser?.lastName || ''} ne pourra plus se connecter ni utiliser MOXT tant que le compte est suspendu.`
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
