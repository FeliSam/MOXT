import { useState } from 'react'
import { FiBookOpen } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { useLanguage } from '../contexts/useLanguage'
import { CARD } from '../features/admin/adminConfig'
import { AdminContentPanel } from '../features/admin/components/AdminContentPanel'
import { AdminDetailPanel } from '../features/admin/components/AdminDetailPanel'
import { AdminQueuesPanel } from '../features/admin/components/AdminQueuesPanel'
import { GlobalFilterBar, SystemStatusBar } from '../features/admin/components/AdminShared'
import { AdminIdentityCard, SidebarBtn, SidebarLink } from '../features/admin/components/AdminShell'
import { useAdminPageData } from '../features/admin/hooks/useAdminPageData'
import {
  badgeForModerationView,
  MODERATION_VIEW_IDS,
  MODERATION_VIEWS,
  moderationQueuesUrgent,
} from '../features/moderation/moderationConfig'
import { ModeratorHeroKpiRow } from '../features/moderation/components/ModeratorHeroKpiRow'
import { ModeratorOverviewPanel } from '../features/moderation/components/ModeratorOverviewPanel'
import { moderationOptionLabel, moderationText } from '../features/moderation/moderationI18n'

function resolveModerationView(value) {
  if (MODERATION_VIEW_IDS.includes(value)) return value
  return 'overview'
}

export function ModerationPage() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const staff = useSelector((state) => state.auth.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const view = resolveModerationView(searchParams.get('view'))
  const [contentView, setContentView] = useState('businesses')
  const effectiveContentView = view === 'publications' ? 'posts' : contentView
  const filterView = view === 'publications' ? 'publications' : view
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { metrics, queues, content, activeContentItems } = useAdminPageData(
    query,
    statusFilter,
    effectiveContentView,
  )

  const moderationQueues = {
    ...queues,
    urgent: moderationQueuesUrgent(queues),
  }

  function switchView(next) {
    const resolved = resolveModerationView(next)
    setSelected(null)
    setQuery('')
    setStatusFilter('all')
    const params = new URLSearchParams(searchParams)
    if (resolved === 'overview') params.delete('view')
    else params.set('view', resolved)
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="grid min-w-0 max-w-full gap-6 overflow-x-clip">
      <SystemStatusBar metrics={metrics} queues={moderationQueues} />

      <PageHeader
        eyebrow={moderationText(t, 'moderation.page.eyebrow')}
        title={moderationText(t, 'moderation.page.title')}
        description={moderationText(t, 'moderation.page.description')}
      />

      <ModeratorHeroKpiRow
        metrics={metrics}
        queues={moderationQueues}
        onSelect={switchView}
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[14rem_minmax(0,1fr)_minmax(0,22rem)]">
        <aside className="grid min-w-0 content-start gap-2">
          <AdminIdentityCard
            admin={staff}
            roleLabel={moderationText(t, 'moderation.identity.role')}
          />
          <nav className={`${CARD} grid content-start gap-1 p-2`}>
            {MODERATION_VIEWS.map((item) => {
              const badge = badgeForModerationView(item.id, metrics, moderationQueues)
              return (
                <SidebarBtn
                  key={item.id}
                  active={view === item.id}
                  badge={badge}
                  icon={item.icon}
                  label={moderationOptionLabel(t, item)}
                  onClick={() => switchView(item.id)}
                />
              )
            })}
          </nav>
          <nav className={`${CARD} grid content-start gap-1 p-2`}>
            <SidebarLink to="/admin/guide" icon={FiBookOpen} label={moderationText(t, 'moderation.nav.guide')} />
          </nav>
        </aside>

        <div className="grid min-w-0 content-start gap-5">
          <GlobalFilterBar
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            view={filterView}
          />

          {view === 'overview' ? (
            <ModeratorOverviewPanel
              content={content}
              metrics={metrics}
              queues={moderationQueues}
              onOpenContent={(next) => {
                setContentView(next)
                switchView(next === 'posts' ? 'publications' : 'content')
              }}
              onOpenView={switchView}
              setSelected={setSelected}
            />
          ) : null}

          {view === 'content' || view === 'publications' ? (
            <AdminContentPanel
              contentView={effectiveContentView}
              dispatch={dispatch}
              items={activeContentItems}
              lockedSection={view === 'publications' ? 'posts' : null}
              setContentView={setContentView}
              setSelected={setSelected}
            />
          ) : null}

          {view === 'queues' ? (
            <AdminQueuesPanel
              adminId={staff?.id}
              actorRole={staff?.role || 'moderator'}
              dispatch={dispatch}
              queues={moderationQueues}
              setSelected={setSelected}
              variant="moderation"
            />
          ) : null}
        </div>

        <AdminDetailPanel
          admin={staff}
          dispatch={dispatch}
          onSuspendUser={() => undefined}
          selected={selected}
          setSelected={setSelected}
          supportReply=""
          setSupportReply={() => undefined}
        />
      </div>
    </div>
  )
}
