import { layoutTokens } from '@moxt/shared/design/index.js';

/** Gabarits de l'en-tête web (Header.jsx + index.css, viewport < 640px). */
export const HEADER = {
  height: 44, // 44px standard mobile header chip and button height
  avatar: 34, // 34px avatar
  icon: 20, // 20px icon
  iconStroke: 1.5, // 1.5 stroke width
  iconOpacity: 0.72, // 72% opacity
  padX: 12, // px-3 (12px)
  padTopMin: 20, // 1.25rem (20px)
  safeAreaExtra: 8, // + 0.5rem (8px)
  gap: 6, // gap-1.5 (6px)
} as const;

/** padding-top: max(1.25rem, safe-area-inset-top + 0.5rem) */
export function headerPaddingTop(insetTop: number) {
  return Math.max(HEADER.padTopMin, insetTop + HEADER.safeAreaExtra);
}

