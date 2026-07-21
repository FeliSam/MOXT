import { Dimensions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  Megaphone, PackagePlus, Briefcase, CalendarPlus, Send,
  ArrowLeftRight, ShoppingBag, Package, Handshake, Repeat, Building2, CalendarDays, Newspaper,
} from 'lucide-react-native';

const SW = Dimensions.get('window').width;
const clamp = (min: number, val: number, max: number) => Math.max(min, Math.min(val, max));

/** Miroir des clamp() de dashboardConfig.js (mobile viewport) */
export const dashboardWidths = {
  fourUp: clamp(168, SW * 0.22, 224),       // clamp(10.5rem,22vw,14rem)
  quickAction: clamp(192, SW * 0.68, 256),  // clamp(12rem,68vw,16rem)
  listing: clamp(192, SW * 0.55, 256),      // clamp(12rem,25vw,16rem) — mobile dominant
  service: clamp(216, SW * 0.62, 280),      // clamp(13.5rem,62vw,17.5rem)
  live: clamp(192, SW * 0.55, 248),         // clamp(12rem,55vw,15.5rem)
  post: clamp(224, SW * 0.72, 304),         // clamp(14rem,72vw,19rem)
} as const;

/** Classes Tailwind copiées depuis moxt-react (dashboard + layout) */
export const tw = {
  page: 'grid min-w-0 gap-6 sm:gap-8 bg-app-bg dark:bg-[#0c0c0e]',
  carouselTrack: '-mx-4 flex flex-row gap-3 px-4 py-2',
  carouselTrackSm: '-mx-4 flex flex-row gap-3 px-4 py-2 sm:gap-4',

  sectionHeadingEyebrow: 'text-[10px] font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-400',
  sectionHeadingTitle: 'mt-1 text-2xl font-black tracking-[-0.035em] text-app-text dark:text-zinc-50',
  sectionHeadingPill:
    'flex-row items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-zinc-900',
  sectionHeadingPillText: 'text-xs font-black text-app-text dark:text-zinc-50',

  hero:
    'relative overflow-hidden rounded-[2.25rem] px-6 py-8 shadow-xl',
  heroChip: 'self-start flex-row items-center gap-2 rounded-full bg-white/12 px-4 py-2',
  heroChipText: 'text-xs font-bold text-white',
  heroTitle: 'mt-6 text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] text-white',
  heroSubtitle: 'mt-6 text-sm leading-7 text-white/75',
  heroCtaPrimary:
    'min-h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-white px-5 shadow-xl',
  heroCtaPrimaryText: 'text-sm font-black text-slate-950',
  heroCtaGhost:
    'min-h-11 flex-row items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5',
  heroCtaGhostText: 'text-sm font-semibold text-white',

  calcWrap: 'mt-10 rounded-[2rem] bg-white/12 p-4 shadow-2xl',
  calcEyebrow: 'text-xs font-bold text-white/65',
  calcTitle: 'mt-1 text-xl font-black text-white',
  calcInvert: 'h-11 w-11 items-center justify-center rounded-2xl bg-white',
  calcFieldLight: 'rounded-2xl bg-white p-4',
  calcFieldDark: 'rounded-2xl bg-slate-950/25 p-4',
  calcFieldLabel: 'text-[10px] font-black uppercase tracking-wider text-slate-400',
  calcFieldLabelDark: 'text-[10px] font-black uppercase tracking-wider text-white/55',
  calcInput: 'mt-2 text-2xl font-black text-slate-950',
  calcInputDark: 'mt-2 text-2xl font-black text-white',
  calcChipFrom: 'rounded-full bg-emerald-100 px-3 py-1',
  calcChipFromText: 'text-xs font-black text-emerald-800',
  calcChipTo: 'rounded-full bg-white/15 px-3 py-1',
  calcChipToText: 'text-xs font-black text-white',
  calcRateRow: 'mt-3 flex-row items-center justify-between',
  calcRateText: 'text-[10px] text-white/65',
  calcBtn: 'mt-4 flex-row items-center justify-between rounded-2xl bg-cyan-300 px-4 py-3',
  calcBtnText: 'text-sm font-black text-slate-950',

  searchCard: 'rounded-[2rem] bg-white p-4 shadow-lg dark:bg-zinc-900 sm:p-5',
  searchTitle: 'font-black text-app-text dark:text-zinc-50',
  searchSubtitle: 'mt-1 text-sm text-app-text-muted dark:text-zinc-400',
  searchInput:
    'min-h-14 w-full rounded-2xl bg-app-surface-muted pl-11 pr-4 text-sm text-app-text dark:bg-zinc-800 dark:text-zinc-50',

  card: 'rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900 sm:p-6',
  cardIcon: 'h-11 w-11 items-center justify-center rounded-2xl',
  cardTitle: 'font-black text-app-text dark:text-zinc-50',
  cardSubtitle: 'text-xs text-app-text-muted dark:text-zinc-400',

  quickCard: 'min-h-[10.5rem] flex-col justify-between rounded-2xl p-4',
  quickTitle: 'text-base font-black leading-snug text-app-text dark:text-zinc-50',
  quickDesc: 'mt-2 text-sm leading-5 text-app-text-muted dark:text-zinc-400',

  trustNumber: 'text-3xl font-black text-brand-200 dark:text-brand-800',
  trustTitle: 'mt-5 font-black leading-snug text-app-text dark:text-zinc-50',
  trustDesc: 'mt-2 flex-1 text-xs leading-5 text-app-text-muted dark:text-zinc-400',

  serviceCard: 'flex-col overflow-hidden rounded-2xl p-3',
  serviceTitle: 'mt-3 font-black tracking-tight text-app-text dark:text-zinc-50',
  serviceDesc: 'mt-2 flex-1 text-xs leading-5 text-app-text-muted dark:text-zinc-400',

  liveCardOuter: 'min-w-0 overflow-hidden rounded-2xl bg-white p-0 shadow-sm dark:bg-zinc-900',
  liveCardHeader: 'flex-row items-start justify-between gap-4 p-5 pb-4 sm:p-6 sm:pb-4',
  liveTile: 'relative min-h-[11.25rem] flex-col overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900',
  liveTileStripe: 'h-1 w-full',
  liveTileBody: 'flex-1 flex-col p-3.5',
  liveTileTitle: 'text-[0.95rem] font-bold leading-snug tracking-[-0.01em] text-app-text dark:text-zinc-50',
  liveTileMeta: 'mt-1.5 text-xs text-app-text-muted dark:text-zinc-400',
  liveTileHighlight: 'mt-2.5 flex-row items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300',
  liveChip: 'rounded-md px-2 py-1 text-[10px] font-bold lg:px-2.5 lg:text-[11px]',

  activityCard: 'relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white dark:bg-black',
  activityIcon: 'h-12 w-12 items-center justify-center rounded-2xl bg-white/10',
  activityTitle: 'mt-6 text-2xl font-black text-white',
  activitySubtitle: 'mt-2 max-w-md text-sm leading-6 text-white/60',
  activityTile: 'rounded-2xl bg-white/[0.08] p-3',
  activityTileValue: 'text-2xl font-black text-white',
  activityTileLabel: 'text-[10px] text-white/55',
  activityBtnPrimary: 'rounded-2xl bg-brand-700 px-5 py-3 dark:bg-brand-400',
  activityBtnGhost: 'rounded-2xl bg-white/10 px-5 py-3',

  verifyCard:
    'mx-4 flex-col gap-4 rounded-2xl bg-amber-50 p-5 shadow-sm dark:bg-amber-950/30',
  verifyIcon: 'h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/50',
  verifyTitle: 'font-black text-app-text dark:text-zinc-50',
  verifySubtitle: 'mt-1 text-sm text-app-text-muted dark:text-zinc-400',
  verifyBtn: 'min-h-11 items-center justify-center rounded-[0.75rem] bg-brand-700 px-5 dark:bg-brand-400',
  verifyBtnText: 'text-sm font-black text-white dark:text-slate-950',

  todoRow: 'flex-row items-center gap-3 rounded-2xl bg-app-surface-muted p-3 dark:bg-zinc-800',
  todoIcon: 'h-9 w-9 items-center justify-center rounded-xl bg-app-surface dark:bg-zinc-900',
  todoLabel: 'min-w-0 flex-1 text-sm font-bold text-app-text dark:text-zinc-50',
  todoEmpty: 'flex-row items-center gap-2 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30',
  todoEmptyText: 'text-sm font-bold text-emerald-700 dark:text-emerald-300',

  transferRow: 'relative rounded-2xl bg-app-surface-muted p-3 dark:bg-zinc-800',
  transferAmount: 'truncate text-sm font-bold text-app-text dark:text-zinc-50',
  transferId: 'text-xs text-app-text-muted dark:text-zinc-400',
  emptyBox: 'items-center gap-3 rounded-2xl bg-app-surface-muted p-5 dark:bg-zinc-800',
  emptyText: 'text-center text-sm text-app-text-muted dark:text-zinc-400',

  primaryBtn: 'min-h-11 flex-row items-center justify-center gap-2 self-start rounded-[0.75rem] bg-brand-700 px-5 dark:bg-brand-400',
  primaryBtnText: 'text-sm font-black text-white dark:text-slate-950',
  secondaryBtn:
    'min-h-11 flex-row items-center justify-center gap-2 self-start rounded-[0.75rem] bg-app-surface-muted px-5 dark:bg-zinc-800',
  secondaryBtnText: 'text-sm font-black text-app-text dark:text-zinc-50',

  rateTile: 'flex-1 rounded-2xl bg-app-surface-muted p-4 dark:bg-zinc-800',
  rateTileLabel: 'text-xs text-app-text-muted dark:text-zinc-400',
  rateTileValue: 'mt-1 text-lg font-black text-app-text dark:text-zinc-50',

  profilePercent: 'text-2xl font-black text-app-text dark:text-zinc-50',
  progressTrack: 'mt-4 h-2 overflow-hidden rounded-full bg-app-surface-muted dark:bg-zinc-800',
  progressFill: 'h-full rounded-full bg-brand-600 dark:bg-brand-400',
  profileDone: 'mt-4 text-sm font-bold text-emerald-700 dark:text-emerald-300',

  stepBadge:
    'rounded-full bg-brand-100 px-2.5 py-1 dark:bg-brand-900',
  stepBadgeText: 'text-[10px] font-black uppercase tracking-[0.06em] text-brand-800 dark:text-brand-100',
  stepRow: 'flex-row items-center gap-3 rounded-2xl bg-app-surface-muted p-3 dark:bg-zinc-800',
  stepCircle: 'h-7 w-7 items-center justify-center rounded-full',
  stepLabel: 'min-w-0 flex-1 text-sm font-bold text-app-text dark:text-zinc-50',

  trustCardOuter: 'relative min-h-[9.5rem] flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900',

  listingCard: 'relative overflow-hidden rounded-[1.4rem] shadow-sm',
  listingImage: 'h-[280px] w-full',
  listingHeart: 'absolute right-2.5 top-2.5 h-9 w-9 items-center justify-center rounded-full',
  listingTag: 'rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black text-white',
  listingTagMuted: 'rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black text-white/80',
  listingTitle: 'text-sm font-black leading-snug text-white sm:text-base',
  listingPrice: 'text-sm font-black tabular-nums text-white sm:text-base',
  listingCity: 'text-[11px] text-white/75',

  liveListCard: 'mx-4 min-w-0 overflow-hidden !p-0 rounded-2xl bg-transparent shadow-none',
  liveListHeader: 'p-5 pb-4 sm:p-6 sm:pb-4',
  liveListTitle: 'font-display text-lg font-extrabold tracking-[-0.02em] text-app-text dark:text-zinc-50 sm:text-xl',
  liveListDesc: 'mt-0.5 text-xs text-app-text-muted dark:text-zinc-400 sm:text-sm',
  liveListTrack: 'flex-row gap-3 px-5 pb-5 sm:px-6 sm:pb-6',

  postCard: 'relative flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900',
  postAuthor: 'truncate text-[11px] font-bold leading-tight text-app-text dark:text-zinc-50',
  postDate: 'text-[10px] text-app-text-faint dark:text-zinc-500',
  postImage: 'mt-2.5 h-[8.5rem] w-full rounded-xl',
  postBody: 'mt-2.5 text-xs leading-relaxed text-app-text-muted dark:text-zinc-400',
  postFooter: 'mt-3 flex-row items-center gap-3 border-t border-app-border pt-2.5 dark:border-zinc-800',
  postStat: 'text-[10px] text-app-text-faint dark:text-zinc-500',

  specialBtn: 'mx-4 items-center rounded-2xl px-5 py-3.5 shadow-sm',
  specialBtnText: 'text-sm font-bold',
} as const;

export const badgeTones: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export const QUICK_ACTIONS: {
  id: string;
  Icon: LucideIcon;
  tint: string;
  label: string;
  description: string;
  route: string;
  size: 'hero' | 'featured' | 'medium' | 'compact';
  iconPos: 'br' | 'bl' | 'tr';
}[] = [
  {
    id: 'qa-transfer',
    Icon: Send,
    tint: '#0b8975',
    label: 'Créer un transfert',
    description: 'Envoyer de l’argent en quelques étapes',
    route: '/transfer/wizard',
    size: 'hero',
    iconPos: 'br',
  },
  {
    id: 'qa-listing',
    Icon: Megaphone,
    tint: '#0891b2',
    label: 'Publier une annonce',
    description: 'Produit, service ou location',
    route: '/listing/create',
    size: 'featured',
    iconPos: 'tr',
  },
  {
    id: 'qa-parcel',
    Icon: PackagePlus,
    tint: '#245de8',
    label: 'Envoyer un colis',
    description: 'Trouver ou proposer un trajet',
    route: '/parcels',
    size: 'medium',
    iconPos: 'br',
  },
  {
    id: 'qa-job',
    Icon: Briefcase,
    tint: '#b45309',
    label: 'Publier un job',
    description: 'Mission ou opportunité',
    route: '/jobs',
    size: 'medium',
    iconPos: 'bl',
  },
  {
    id: 'qa-event',
    Icon: CalendarPlus,
    tint: '#7c3aed',
    label: 'Créer un événement',
    description: 'Rencontre, atelier ou formation',
    route: '/search',
    size: 'compact',
    iconPos: 'tr',
  },
];

export const QUICK_ACCENTS_LIGHT: [string, string][] = [
  ['#ecfdf5', '#f0fdfa'],
  ['#ecfdf5', '#f0fdfa'],
  ['#eff6ff', '#ecfeff'],
  ['#fffbeb', '#fff7ed'],
  ['#f5f3ff', '#fdf4ff'],
];

export const QUICK_ACCENTS_DARK: [string, string][] = [
  ['rgba(6,78,59,0.40)', 'rgba(19,78,74,0.30)'],
  ['rgba(6,78,59,0.40)', 'rgba(19,78,74,0.30)'],
  ['rgba(30,58,138,0.40)', 'rgba(22,78,99,0.30)'],
  ['rgba(69,26,3,0.40)', 'rgba(67,20,7,0.30)'],
  ['rgba(46,16,101,0.40)', 'rgba(112,26,117,0.30)'],
];

export const TRUST_HIGHLIGHTS: [string, string][] = [
  ['Profils vérifiés', 'Identifiez plus facilement les utilisateurs et entreprises contrôlés.'],
  ['Contexte centralisé', 'Messages, reçus et réclamations restent liés à chaque opération.'],
  ['Services locaux', "Des outils pensés pour les échanges entre l'Afrique et la Russie."],
  ['Données maîtrisées', 'Vos préférences et brouillons restent accessibles sur cet appareil.'],
];

export const CORE_SERVICES: {
  id: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  route: string;
  tag: string;
  tone: string;
  size: 'hero' | 'featured' | 'medium' | 'compact';
  iconPos: 'br' | 'bl' | 'tr';
}[] = [
  {
    id: 'transfers',
    Icon: ArrowLeftRight,
    title: 'Transferts',
    description: 'Envoyez, suivez et gérez vos opérations simplement.',
    route: '/transfers',
    tag: 'Essentiel',
    tone: 'success',
    size: 'hero',
    iconPos: 'br',
  },
  {
    id: 'marketplace',
    Icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Achetez et vendez entre particuliers et entreprises.',
    route: '/marketplace',
    tag: 'Découvrir',
    tone: 'info',
    size: 'featured',
    iconPos: 'br',
  },
  {
    id: 'parcels',
    Icon: Package,
    title: 'Colis',
    description: 'Publiez, trouvez et réservez des kilos disponibles.',
    route: '/parcels',
    tag: 'Voyages',
    tone: 'warning',
    size: 'medium',
    iconPos: 'br',
  },
  {
    id: 'jobs',
    Icon: Briefcase,
    title: 'Jobs',
    description: 'Découvrez des missions, jobs et opportunités professionnelles.',
    route: '/jobs',
    tag: 'Carrière',
    tone: 'success',
    size: 'medium',
    iconPos: 'br',
  },
  {
    id: 'p2p',
    Icon: Repeat,
    title: 'P2P',
    description: 'Publiez et trouvez des offres entre utilisateurs vérifiés.',
    route: '/p2p',
    tag: 'Échanges',
    tone: 'rose',
    size: 'compact',
    iconPos: 'br',
  },
  {
    id: 'exchangers',
    Icon: Handshake,
    title: 'Échangeurs',
    description: 'Trouvez des partenaires fiables et vérifiés.',
    route: '/organization',
    tag: 'Vérifiés',
    tone: 'violet',
    size: 'compact',
    iconPos: 'br',
  },
  {
    id: 'businesses',
    Icon: Building2,
    title: 'Entreprises',
    description: 'Explorez les services des professionnels MOXT.',
    route: '/organization',
    tag: 'Professionnel',
    tone: 'info',
    size: 'compact',
    iconPos: 'br',
  },
  {
    id: 'events',
    Icon: CalendarDays,
    title: 'Événements',
    description: 'Participez aux rencontres, ateliers et activités de la communauté.',
    route: '/search',
    tag: 'Agenda',
    tone: 'warning',
    size: 'compact',
    iconPos: 'br',
  },
  {
    id: 'news',
    Icon: Newspaper,
    title: 'Actualité',
    description: 'Jobs, événements, actualités et opportunités.',
    route: '/search',
    tag: 'En direct',
    tone: 'violet',
    size: 'compact',
    iconPos: 'br',
  },
];

export const LISTING_TYPES: Record<string, string> = {
  product: 'Produit', service: 'Service', rental: 'Location', vehicle: 'Véhicule',
  digital: 'Numérique', real_estate: 'Immobilier', food: 'Alimentation', sale: 'Vente', other: 'Autre',
};

export const RATE_RUB_TO_XOF = 7.3953;
export const RATE_SOURCE = 'Frankfurter';

export const quickActionGradients = [
  'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30',
  'from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30',
  'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30',
  'from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/30',
] as const;

export const liveAccents = {
  parcels: {
    stripe: ['#10b981', '#14b8a6'],
    icon: 'bg-emerald-100 dark:bg-emerald-950/45',
    chip: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  },
  jobs: {
    stripe: ['#8b5cf6', '#6366f1'],
    icon: 'bg-violet-100 dark:bg-violet-950/45',
    chip: 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
  },
  events: {
    stripe: ['#f59e0b', '#f97316'],
    icon: 'bg-amber-100 dark:bg-amber-950/45',
    chip: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  },
} as const;
