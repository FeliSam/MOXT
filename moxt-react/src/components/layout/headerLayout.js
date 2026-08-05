/** Enveloppe visuelle du header app — partagée Transferts, Jobs, Messages, etc. */
export const APP_HEADER_PILL_CLASS =
  'mx-auto flex w-full max-w-[96rem] gap-1.5 sm:gap-2 lg:min-h-[4.75rem] lg:gap-3 lg:rounded-[1.4rem] lg:border-0 lg:bg-[var(--app-surface)]/65 lg:px-6 lg:py-3 lg:shadow-[var(--shadow-card)] lg:backdrop-blur-xl'

export const HEADER_ICON_STROKE = 1.48

/** Chip titre / marque — identique Header standard et messagerie. */
export const HEADER_BRAND_CHIP_CLASS =
  'header-brand-chip flex h-[3.004375rem] min-w-0 flex-1 items-center gap-2 rounded-full bg-[var(--app-surface)]/65 px-1.5 pr-2.5 backdrop-blur-md sm:h-[3.3048125rem] sm:gap-2.5 sm:pr-3 lg:contents lg:h-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none'

/** Variante messagerie : limite la largeur à côté des actions. */
export const HEADER_BRAND_CHIP_COMPACT_CLASS =
  'header-brand-chip flex h-[3.004375rem] min-w-0 max-w-[calc(100%-7rem)] flex-1 items-center gap-2 rounded-full bg-[var(--app-surface)]/65 px-1.5 pr-2.5 backdrop-blur-md sm:h-[3.3048125rem] sm:max-w-[calc(100%-7.75rem)] sm:gap-2.5 sm:pr-3 lg:contents lg:h-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none'

export const HEADER_ACTIONS_CLASS =
  'ml-auto flex h-[3.004375rem] shrink-0 items-center gap-1.5 sm:h-[3.3048125rem] lg:h-auto lg:gap-1.5'

export const HEADER_BACK_BTN_CLASS =
  'header-action-btn relative grid shrink-0 !size-[2.185rem] !border-0 !bg-transparent sm:!size-[2.458125rem] lg:hidden'

export const HEADER_ROW_CLASS = 'flex w-full items-center justify-between gap-1.5 sm:gap-2'
