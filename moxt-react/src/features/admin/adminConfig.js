import {
  FiActivity,
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiHeadphones,
  FiInbox,
  FiLayers,
  FiPackage,
  FiRepeat,
  FiShield,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'

export const MAIN_VIEWS = [
  { id: 'overview', label: 'Vue generale', icon: FiShield },
  { id: 'transfers', label: 'Transferts', icon: FiRepeat },
  { id: 'content', label: 'Contenus', icon: FiLayers },
  { id: 'support', label: 'Support', icon: FiHeadphones },
  { id: 'users', label: 'Utilisateurs', icon: FiUsers },
  { id: 'queues', label: "Files d'action", icon: FiInbox },
  { id: 'audit', label: 'Audit', icon: FiActivity },
]

export const CONTENT_SECTIONS = [
  { id: 'businesses', label: 'Entreprises', icon: FiBriefcase, route: '/businesses', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  { id: 'listings', label: 'Annonces', icon: FiShoppingBag, route: '/marketplace', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  { id: 'jobs', label: 'Jobs', icon: FiTrendingUp, route: '/jobs', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { id: 'events', label: 'Evenements', icon: FiCalendar, route: '/events', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  { id: 'parcels', label: 'Colis', icon: FiPackage, route: '/parcels', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  { id: 'reports', label: 'Signalements', icon: FiAlertCircle, route: '/admin', color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
]

export const ROLE_COLORS = {
  superadmin: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
  professional: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  user: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export const CARD = 'rounded-2xl border border-[color:rgb(148_163_184/0.13)] bg-[var(--app-surface)] shadow-[0_8px_28px_rgb(15_23_42/0.04)]'
export const ITEM = 'rounded-xl border border-[color:rgb(148_163_184/0.11)] bg-[var(--app-surface-muted)] p-4 transition-all hover:border-brand-200 hover:shadow-[0_6px_20px_rgb(15_23_42/0.07)]'
export const CHIP = 'rounded-full px-3 py-1.5 text-xs font-bold transition-all'

export const VIEW_FILTERS = {
  transfers: ['all', 'pending', 'completed', 'cancelled'],
  support: ['all', 'open', 'resolved', 'pending'],
  users: ['all', 'active', 'suspended', 'user', 'professional', 'admin'],
  content: [],
  overview: [],
  queues: [],
  audit: [],
}
