import { CountBounce } from '../../components/ui/CountBounce'

/**
 * Rail droit unifié (vidéo, annonce, colis, job, event, post).
 * `fixed` + `--z-page-float` : hors du stacking context `.feed-mobile-shell` (z=1),
 * sinon la bottom nav (z=100) capture les taps sur téléphone.
 */
export const FEED_ACTION_RAIL_CLASS =
  'pointer-events-auto fixed bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] right-3 z-[var(--z-page-float)] flex flex-col items-center gap-3 touch-manipulation md:absolute md:bottom-10 md:z-30'

/** Rail pré-monté sur les voisins : visible seulement sur la slide active (évite le délai au snap). */
export function feedActionRailClass(visible = true) {
  return visible
    ? FEED_ACTION_RAIL_CLASS
    : `${FEED_ACTION_RAIL_CLASS} invisible pointer-events-none`
}

export const FEED_ACTION_BTN_CLASS =
  'relative flex touch-manipulation items-center justify-center text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]'

export const FEED_ACTION_ICON_WRAP_CLASS =
  'relative grid size-10 place-items-center rounded-full bg-black/62 shadow-[0_4px_14px_rgba(0,0,0,0.55)] ring-1 ring-white/35 backdrop-blur-md transition active:scale-95'

export const FEED_ACTION_ICON_CLASS =
  'text-[1.23rem] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
export const FEED_ACTION_ICON_SM_CLASS =
  'text-[1.15rem] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'

/** Overlay meta bas — dégradé léger pour laisser l’image lisible. */
export const FEED_META_OVERLAY_CLASS =
  'pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/78 via-black/32 to-transparent p-4 pt-16 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pr-16 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_2px_10px_rgba(0,0,0,0.65),0_0_18px_rgba(0,0,0,0.4)]'

export const FEED_META_INTERACTIVE_CLASS = 'pointer-events-auto'

/** Cadre slide plein écran — hauteur du scroller (pas 100dvh, évite l’écart iOS svh/dvh). */
export const FEED_SLIDE_SECTION_CLASS =
  'relative h-full min-h-full w-full shrink-0 snap-start snap-always md:h-full'

export const FEED_SLIDE_FRAME_CLASS =
  'relative h-full w-full overflow-hidden bg-black md:bg-[var(--app-surface)]'

export function FeedActionCount({ value }) {
  if (value == null || Number(value) <= 0) return null
  return (
    <CountBounce
      value={value}
      maxDisplay={999}
      className="absolute bottom-0 right-0 min-w-[1.15rem] translate-x-0.5 translate-y-0.5 rounded-full bg-black/75 px-1 py-px text-center text-[10px] font-black leading-tight text-white ring-1 ring-white/25"
    />
  )
}
