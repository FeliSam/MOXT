/** Hauteur commune rails + grille Découvrir. */
export const MARKETPLACE_DISCOVERY_CARD_HEIGHT = 'h-[290px]'

/** Item carrousel horizontal — largeur fixe responsive. */
export const MARKETPLACE_DISCOVERY_ITEM_CLASS = `${MARKETPLACE_DISCOVERY_CARD_HEIGHT} w-[clamp(10.5rem,44vw,14.5rem)] shrink-0 snap-start overflow-hidden sm:w-[14.5rem]`

/** Carrousel horizontal — gap ~70 % plus serré que gap-3 (0,225 rem). */
export const MARKETPLACE_DISCOVERY_TRACK_CLASS =
  'horizontal-track scrollbar-hidden -mx-1 flex snap-x snap-mandatory items-stretch gap-[0.225rem] overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pb-1 touch-pan-x'

export const MARKETPLACE_DISCOVER_GRID_COLUMNS = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'

/** Grille Découvrir — gaps ~70 % plus serrés que le défaut CatalogGrid (gap-3 / sm:gap-4). */
export const MARKETPLACE_DISCOVER_GRID_GAP = 'gap-[0.225rem] sm:gap-[0.3rem]'
