/** Hauteur commune rails + grille Découvrir. */
export const MARKETPLACE_DISCOVERY_CARD_HEIGHT = 'h-[320px]'

/** Item carrousel horizontal — largeur fixe responsive. */
export const MARKETPLACE_DISCOVERY_ITEM_CLASS = `${MARKETPLACE_DISCOVERY_CARD_HEIGHT} w-[clamp(10.5rem,44vw,14.5rem)] shrink-0 snap-start overflow-hidden sm:w-[14.5rem]`

/** Carrousel horizontal — gap ~70 % plus serré que gap-3 (0,225 rem). */
export const MARKETPLACE_DISCOVERY_TRACK_CLASS =
  'horizontal-track scrollbar-hidden -mx-1 flex snap-x snap-mandatory items-stretch gap-[0.225rem] overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pb-1 touch-pan-x'

export const MARKETPLACE_DISCOVER_GRID_COLUMNS =
  'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

/** Grille Découvrir — gap horizontal serré, gap vertical augmenté de 80 % (0.225rem * 1.8 = 0.405rem, 0.3rem * 1.8 = 0.54rem). */
export const MARKETPLACE_DISCOVER_GRID_GAP =
  'gap-x-[0.225rem] sm:gap-x-[0.3rem] gap-y-[0.405rem] sm:gap-y-[0.54rem]'

