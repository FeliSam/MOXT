import { useMemo, useState } from 'react'
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiEdit3,
  FiLayers,
  FiMap,
  FiRepeat,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/useLanguage'
import { TransferStatusBadge } from '../../transfers/TransferStatusBadge'
import { formatMoney } from '../../transfers/transferUtils'
import { StatusComposer } from '../../statuses/StatusComposer'
import { markTourPreview } from '../../onboarding/welcomeStorage'
import { CARD, CONTENT_SECTIONS, ITEM } from '../adminConfig'
import { adminOptionLabel, adminText } from '../adminI18n'
import { statusDotColor } from '../adminUtils'
import { Empty, SectionTitle } from './AdminShared'

const MOXT_OFFICIAL_IDENTITY = {
  name: 'MOXT',
  avatarUrl: '/assets/brand/mark.png?v=20260714e',
}

export function AdminOverviewPanel({ content, metrics, onOpenContent, onOpenView, queues, setSelected, transfers }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [officialComposerOpen, setOfficialComposerOpen] = useState(false)

  const exchangerCount = useMemo(
    () =>
      (content.businesses || []).filter((item) =>
        Array.isArray(item.services) ? item.services.includes('Transfert') : false,
      ).length,
    [content.businesses],
  )

  function handlePreviewTour() {
    markTourPreview()
    navigate('/dashboard')
  }

  const quickActions = [
    {
      key: 'transfers',
      icon: FiRepeat,
      label: adminText(t, 'admin.overview.actions.transfers.label'),
      value: adminText(t, 'admin.overview.actions.transfers.value', { count: metrics.transfers.pending }),
      color: 'from-teal-600 to-cyan-500',
    },
    {
      key: 'p2p',
      icon: FiUsers,
      label: adminText(t, 'admin.overview.actions.p2p.label'),
      value: adminText(t, 'admin.overview.actions.p2p.value', {
        count: (metrics.p2p?.disputed || 0) + (metrics.p2p?.openOrders || 0),
      }),
      color: 'from-cyan-600 to-sky-500',
    },
    {
      key: 'content',
      icon: FiLayers,
      label: adminText(t, 'admin.overview.actions.content.label'),
      value: adminText(t, 'admin.overview.actions.content.value', { count: metrics.content.pending }),
      color: 'from-violet-600 to-purple-500',
    },
    {
      key: 'publications',
      icon: FiEdit3,
      label: adminText(t, 'admin.overview.actions.publications.label'),
      value: adminText(t, 'admin.overview.actions.publications.value', {
        count: metrics.posts?.pending || 0,
      }),
      color: 'from-sky-600 to-blue-500',
    },
    {
      key: 'rates',
      icon: FiTrendingUp,
      label: adminText(t, 'admin.overview.actions.rates.label'),
      value: adminText(t, 'admin.overview.actions.rates.value'),
      color: 'from-emerald-600 to-teal-500',
    },
    {
      key: 'queues',
      icon: FiAlertTriangle,
      label: adminText(t, 'admin.overview.actions.queues.label'),
      value: adminText(t, 'admin.overview.actions.queues.value', { count: queues.urgent }),
      color: 'from-amber-500 to-orange-500',
    },
  ]

  const shortcuts = [
    {
      key: 'transfers',
      label: adminText(t, 'admin.overview.shortcut.transfers'),
      icon: FiRepeat,
      color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
      count: metrics.transfers.total,
      onClick: () => onOpenView('transfers'),
    },
    {
      key: 'p2p',
      label: adminText(t, 'admin.overview.shortcut.p2p'),
      icon: FiUsers,
      color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
      count: metrics.p2p?.total || 0,
      onClick: () => onOpenView('p2p'),
    },
    {
      key: 'marketplace',
      label: adminText(t, 'admin.overview.shortcut.marketplace'),
      icon: FiShoppingBag,
      color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
      count: content.listings?.length || 0,
      onClick: () => onOpenContent('listings'),
    },
    {
      key: 'exchangers',
      label: adminText(t, 'admin.overview.shortcut.exchangers'),
      icon: HiOutlineBuildingOffice2,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      count: exchangerCount,
      onClick: () => onOpenContent('businesses'),
    },
    {
      key: 'rates',
      label: adminText(t, 'admin.overview.shortcut.rates'),
      icon: FiTrendingUp,
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      count: null,
      onClick: () => onOpenView('rates'),
    },
    {
      key: 'publications',
      label: adminText(t, 'admin.overview.shortcut.publications'),
      icon: FiEdit3,
      color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
      count: metrics.posts?.total || 0,
      onClick: () => onOpenView('publications'),
    },
    {
      key: 'users',
      label: adminText(t, 'admin.overview.shortcut.users'),
      icon: FiUsers,
      color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
      count: metrics.users.total,
      onClick: () => onOpenView('users'),
    },
    {
      key: 'support',
      label: adminText(t, 'admin.overview.shortcut.support'),
      icon: FiAlertCircle,
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      count: queues.support.length,
      onClick: () => onOpenView('support'),
    },
  ]

  return (
    <div className="grid gap-5">
      {officialComposerOpen ? (
        <StatusComposer
          officialIdentity={MOXT_OFFICIAL_IDENTITY}
          onClose={() => setOfficialComposerOpen(false)}
        />
      ) : null}

      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-5`}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-700 to-teal-500 text-white shadow-sm">
            <FiZap className="text-sm" />
          </span>
          <div>
            <strong className="block text-sm font-black">
              {adminText(t, 'admin.overview.officialStatus.title')}
            </strong>
            <p className="text-xs text-[var(--app-text-muted)]">
              {adminText(t, 'admin.overview.officialStatus.description')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOfficialComposerOpen(true)}
          className="shrink-0 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
        >
          {adminText(t, 'admin.overview.officialStatus.action')}
        </button>
      </div>

      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-5`}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-800 to-brand-600 text-white shadow-sm dark:from-slate-700 dark:to-teal-500">
            <FiMap className="text-sm" />
          </span>
          <div>
            <strong className="block text-sm font-black">
              {adminText(t, 'admin.overview.tourPreview.title')}
            </strong>
            <p className="text-xs text-[var(--app-text-muted)]">
              {adminText(t, 'admin.overview.tourPreview.description')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handlePreviewTour}
          className="shrink-0 rounded-xl border border-[var(--app-border-md)] bg-[var(--app-surface)] px-4 py-2.5 text-sm font-bold text-[var(--app-text)] shadow-sm transition hover:bg-[var(--app-surface-muted)]"
        >
          {adminText(t, 'admin.overview.tourPreview.action')}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((action) => (
          <button key={action.key} type="button" onClick={() => onOpenView(action.key)} className="text-left">
            <div className={`${CARD} group relative h-full overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(15_23_42/0.1)]`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-[0.06] transition-opacity group-hover:opacity-[0.10]`} />
              <div className="relative">
                <span className={`inline-grid size-10 place-items-center rounded-xl bg-gradient-to-br ${action.color} text-white shadow-sm`}>
                  <action.icon className="text-sm" />
                </span>
                <strong className="mt-3 block text-xl font-black">{action.value}</strong>
                <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[var(--app-text-muted)]">
                  {action.label} <FiArrowRight className="text-xs opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className={`${CARD} p-5 grid gap-4`}>
        <SectionTitle icon={FiZap} label={adminText(t, 'admin.overview.shortcutsTitle')} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {shortcuts.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={`${ITEM} text-left`}
            >
              <span className={`inline-grid size-9 place-items-center rounded-xl ${item.color}`}>
                <item.icon className="text-sm" />
              </span>
              <strong className="mt-2.5 block truncate text-sm">{item.label}</strong>
              {item.count != null ? (
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                  {adminText(t, 'admin.overview.elementCount', { count: item.count })}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className={`${CARD} p-5 grid gap-4`}>
        <SectionTitle icon={FiLayers} label={adminText(t, 'admin.overview.modulesTitle')} count={metrics.content.total} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {CONTENT_SECTIONS.map((section) => {
            const count = content[section.id]?.length || 0
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onOpenContent(section.id)}
                className={`${ITEM} text-left`}
              >
                <span className={`inline-grid size-9 place-items-center rounded-xl ${section.color}`}>
                  <section.icon className="text-sm" />
                </span>
                <strong className="mt-2.5 block text-sm">{adminOptionLabel(t, section)}</strong>
                <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
                  {adminText(t, 'admin.overview.elementCount', { count })}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`${CARD} p-5 grid gap-4`}>
          <SectionTitle
            icon={FiRepeat}
            label={adminText(t, 'admin.overview.recentTransfers')}
            count={transfers.length}
            action={
              <button type="button" onClick={() => onOpenView('transfers')} className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
                {adminText(t, 'admin.overview.viewAll')} <FiArrowRight className="text-xs" />
              </button>
            }
          />
          <div className="grid gap-2">
            {transfers.slice(0, 5).map((transfer) => (
              <button
                key={transfer.id}
                type="button"
                onClick={() => setSelected({ kind: 'transfer', item: transfer })}
                className={`${ITEM} flex items-center gap-3 text-left`}
              >
                <span className={`size-2 shrink-0 rounded-full ${statusDotColor(transfer.status)}`} />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{transfer.id}</strong>
                  <p className="truncate text-xs text-[var(--app-text-muted)]">{transfer.exchanger?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{formatMoney(transfer.amountSent, transfer.currencyFrom)}</p>
                  <TransferStatusBadge status={transfer.status} />
                </div>
              </button>
            ))}
            {!transfers.length && <Empty label={adminText(t, 'admin.overview.noTransfers')} icon={FiRepeat} />}
          </div>
        </div>

        <div className={`${CARD} p-5 grid gap-4`}>
          <SectionTitle
            icon={FiAlertTriangle}
            label={adminText(t, 'admin.overview.priorities')}
            count={queues.urgent}
            tone={queues.urgent ? 'warning' : 'success'}
          />
          <div className="grid gap-2">
            {[
              { label: adminText(t, 'admin.overview.queue.deletions'), count: queues.accountDeletions.length, view: 'queues' },
              { label: adminText(t, 'admin.overview.queue.verifications'), count: queues.verifications.length, view: 'verifications' },
              { label: adminText(t, 'admin.overview.queue.documents'), count: queues.businessDocuments.length, view: 'documents' },
              { label: adminText(t, 'admin.overview.queue.parcelProofs'), count: (queues.parcelProofs || []).length, view: 'queues' },
              { label: adminText(t, 'admin.nav.support'), count: queues.support.length, view: 'support' },
              { label: adminText(t, 'admin.overview.queue.disputes'), count: queues.disputes.length, view: 'queues' },
              { label: adminText(t, 'admin.overview.queue.reviews'), count: queues.reviews.length, view: 'queues' },
              { label: adminText(t, 'admin.overview.queue.reports'), count: queues.reports.length, view: 'queues' },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => onOpenView(q.view)}
                className={`${ITEM} flex items-center gap-3 text-left`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${q.count > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                  {q.count > 0 ? <FiAlertCircle className="text-sm" /> : <FiCheckCircle className="text-sm" />}
                </span>
                <span className="flex-1 text-sm font-bold">{q.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${q.count > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'}`}>
                  {q.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
