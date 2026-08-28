import { CountBounce } from '../../components/ui/CountBounce'

/**
 * Rail droit unifié (vidéo, annonce, colis, job, event, post).
 * `fixed` + `--z-page-float` : hors du stacking context `.feed-mobile-shell` (z=1),
 * sinon la bottom nav (z=100) capture les taps sur téléphone.
 */
export const FEED_ACTION_RAIL_CLASS =
  'pointer-events-auto fixed bottom-[calc(var(--bottom-nav-clearance)+0.75rem)] right-3 z-[var(--z-page-float)] flex flex-col items-center gap-3 touch-manipulation md:absolute md:bottom-10 md:z-30'

export const FEED_ACTION_BTN_CLASS =
  'relative flex touch-manipulation items-center justify-center text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]'

export const FEED_ACTION_ICON_WRAP_CLASS =
  'relative grid size-10 place-items-center rounded-full bg-black/35 backdrop-blur-sm transition active:scale-95'

export const FEED_ACTION_ICON_CLASS = 'text-[1.23rem]'
export const FEED_ACTION_ICON_SM_CLASS = 'text-[1.15rem]'

/** Overlay meta bas — dégradé léger pour laisser l’image lisible. */
export const FEED_META_OVERLAY_CLASS =
  'pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/70 via-black/25 to-transparent p-4 pt-16 pb-[calc(var(--bottom-nav-clearance)+0.75rem)] pr-16 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.75)]'

export const FEED_META_INTERACTIVE_CLASS = 'pointer-events-auto'

/** Cadre slide plein écran (edge-to-edge sur mobile). */
export const FEED_SLIDE_SECTION_CLASS =
  'relative h-[100dvh] w-full shrink-0 snap-start snap-always md:h-full'

export const FEED_SLIDE_FRAME_CLASS =
  'relative h-full w-full overflow-hidden bg-[var(--app-surface)]'

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
