/** Tokens UI partagés — socle S1 (Piste A 70 %) aligné moxt-react */
export const ui = {
  screen: 'flex-1 bg-app-bg dark:bg-[#0c0c0e]',
  screenPad: 'px-5 pt-5',

  listCard: 'rounded-2xl bg-app-surface p-5 shadow-sm dark:bg-zinc-900',
  listCardInteractive: 'rounded-2xl bg-app-surface p-5 shadow-sm active:opacity-90 dark:bg-zinc-900',
  listCardSelected: 'rounded-2xl bg-brand-50 p-5 shadow-sm dark:bg-brand-950/30',

  searchField:
    'min-h-[46px] flex-row items-center gap-2 rounded-2xl bg-app-surface-muted px-3.5 dark:bg-zinc-800',
  searchInput: 'min-w-0 flex-1 text-sm text-app-text dark:text-zinc-50',

  chip: 'rounded-full px-3.5 py-2',
  chipActive: 'bg-brand-700 dark:bg-brand-400',
  chipIdle: 'bg-app-surface-muted dark:bg-zinc-800',

  chipTextActive: 'text-xs font-bold text-white dark:text-slate-950',
  chipTextIdle: 'text-xs font-bold text-app-text-muted dark:text-zinc-400',

  eyebrow: 'text-[11px] font-bold uppercase tracking-widest text-brand-700 dark:text-brand-400',
  pageTitle: 'text-2xl font-black tracking-tight text-app-text dark:text-zinc-50',
  pageSubtitle: 'mt-1 text-sm text-app-text-muted dark:text-zinc-400',

  tabBar: 'flex-row gap-6 border-b border-app-border dark:border-zinc-800',
  tabActive: 'border-b-2 border-brand-700 pb-2 dark:border-brand-400',
  tabInactive: 'pb-2',

  emptyWrap: 'items-center gap-4 py-16',
  emptyIcon: 'h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40',
  emptyTitle: 'text-lg font-bold text-app-text dark:text-zinc-50',
  emptyText: 'text-center text-sm text-app-text-muted dark:text-zinc-400',

  financeCard: 'rounded-2xl bg-app-surface p-5 shadow-md dark:bg-zinc-900',
  sectionDivider: 'border-b border-app-border pb-4 dark:border-zinc-800',
} as const;
