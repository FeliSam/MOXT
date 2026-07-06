import {
  FiActivity,
  FiLayers,
  FiRepeat,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { CARD } from '../adminConfig'
import { avatarColor, initials } from '../adminUtils'
import { TrendChip } from './AdminShared'

export function AdminIdentityCard({ admin }) {
  if (!admin) return null
  const name = `${admin.firstName || ''} ${admin.lastName || ''}`.trim()
  return (
    <div className={`${CARD} p-4 flex items-center gap-3`}>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-2xl text-sm font-black ${avatarColor(name)}`}
      >
        {initials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-black text-sm">{name || 'Administrateur'}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
          {admin.role || 'admin'}
        </p>
      </div>
    </div>
  )
}

export function SidebarBtn({ active, badge, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all ${
        active
          ? 'bg-brand-700 text-white shadow-[0_4px_12px_rgb(15_118_110/0.35)]'
          : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
      }`}
    >
      {active && (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-white/60" />
      )}
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg transition-all ${
          active
            ? 'bg-white/15 text-white'
            : 'bg-[var(--app-surface-muted)] text-brand-700 group-hover:bg-brand-50'
        }`}
      >
        <Icon className="text-sm" />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 ? (
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
            active ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
          }`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  )
}

export function HeroKpiRow({ metrics, queues, onSelect }) {
  const tiles = [
    {
      key: 'transfers',
      label: 'Transferts',
      value: metrics.transfers.total,
      sub: `${metrics.transfers.pending} en cours`,
      icon: FiRepeat,
      trend: metrics.transfers.pending > 0 ? 'up' : 'stable',
      gradient: 'from-teal-600 to-cyan-500',
    },
    {
      key: 'content',
      label: 'Contenus',
      value: metrics.content.total,
      sub: `${metrics.content.pending} a moderer`,
      icon: FiLayers,
      trend: metrics.content.pending > 5 ? 'up' : 'stable',
      gradient: 'from-violet-600 to-purple-500',
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      value: metrics.users.total,
      sub: `${metrics.users.suspended} suspendus`,
      icon: FiUsers,
      trend: 'stable',
      gradient: 'from-blue-600 to-indigo-500',
    },
    {
      key: 'queues',
      label: 'Files urgentes',
      value: queues.urgent,
      sub: `${metrics.queues.total} au total`,
      icon: FiZap,
      trend: queues.urgent > 0 ? 'up' : 'stable',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      key: 'audit',
      label: 'Logs audit',
      value: metrics.audit.total,
      sub: 'Journal complet',
      icon: FiActivity,
      trend: 'stable',
      gradient: 'from-slate-600 to-slate-500',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          onClick={() => onSelect(tile.key)}
          className="text-left"
        >
          <div className={`${CARD} group h-full p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(15_23_42/0.1)]`}>
            <div className="flex items-start justify-between gap-2">
              <span
                className="grid size-9 place-items-center rounded-xl text-white"
                style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
              >
                <span
                  className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${tile.gradient} text-white`}
                >
                  <tile.icon className="text-sm" />
                </span>
              </span>
              <TrendChip trend={tile.trend} value={tile.sub} />
            </div>
            <strong className="mt-3 block text-2xl font-black">{tile.value}</strong>
            <p className="mt-0.5 text-xs font-bold text-[var(--app-text-muted)]">{tile.label}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
