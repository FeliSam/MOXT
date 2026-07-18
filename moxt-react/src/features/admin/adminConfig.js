import {
  FiActivity,
  FiAlertCircle,
  FiCalendar,
  FiEdit3,
  FiFileText,
  FiHeadphones,
  FiInbox,
  FiLayers,
  FiPackage,
  FiRepeat,
  FiShield,
  FiShoppingBag,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'

export const MAIN_VIEWS = [
  { id: 'overview', label: 'Vue generale', labelKey: 'admin.nav.overview', icon: FiShield },
  { id: 'transfers', label: 'Transferts', labelKey: 'admin.nav.transfers', icon: FiRepeat },
  { id: 'content', label: 'Contenus', labelKey: 'admin.nav.content', icon: FiLayers },
  { id: 'publications', label: 'Publications', labelKey: 'admin.nav.publications', icon: FiEdit3 },
  { id: 'support', label: 'Support', labelKey: 'admin.nav.support', icon: FiHeadphones },
  { id: 'users', label: 'Utilisateurs', labelKey: 'admin.nav.users', icon: FiUsers },
  { id: 'verifications', label: 'Verifications', labelKey: 'admin.nav.verifications', icon: FiUserCheck },
  { id: 'documents', label: 'Documents', labelKey: 'admin.nav.documents', icon: FiFileText },
  { id: 'queues', label: "Files d'action", labelKey: 'admin.nav.queues', icon: FiInbox },
  { id: 'audit', label: 'Audit', labelKey: 'admin.nav.audit', icon: FiActivity },
]

export const CONTENT_SECTIONS = [
  { id: 'businesses', label: 'Entreprises', labelKey: 'admin.content.businesses', icon: HiOutlineBuildingOffice2, route: '/businesses', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  { id: 'listings', label: 'Annonces', labelKey: 'admin.content.listings', icon: FiShoppingBag, route: '/marketplace', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  { id: 'jobs', label: 'Jobs', labelKey: 'admin.content.jobs', icon: FiTrendingUp, route: '/jobs', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  { id: 'events', label: 'Evenements', labelKey: 'admin.content.events', icon: FiCalendar, route: '/events', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  { id: 'parcels', label: 'Colis', labelKey: 'admin.content.parcels', icon: FiPackage, route: '/parcels', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  { id: 'posts', label: 'Publications', labelKey: 'admin.content.posts', icon: FiEdit3, route: '/news', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
  { id: 'reports', label: 'Signalements', labelKey: 'admin.content.reports', icon: FiAlertCircle, route: '/admin?view=queues', color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
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
  users: ['all', 'active', 'suspended', 'pending_deletion', 'user', 'professional', 'admin'],
  content: ['all', 'active', 'pending_review', 'archived', 'published', 'rejected', 'new', 'resolved'],
  publications: ['all', 'active', 'pending_review', 'archived', 'published'],
  verifications: ['all', 'pending', 'verified', 'rejected'],
  documents: ['all', 'pending', 'verified', 'rejected'],
  overview: [],
  queues: [],
  audit: [],
}

export const ADMIN_VIEW_IDS = MAIN_VIEWS.map((view) => view.id)
