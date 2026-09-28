import { layoutTokens } from '@moxt/shared/design/index.js';

/** Gabarits de l'en-tête web (Header.jsx + index.css, viewport < 640px). */
export const HEADER = {
  height: layoutTokens.headerHeight as number, // 3.004375rem
  avatar: layoutTokens.headerAvatar as number, // 2.185rem
  icon: layoutTokens.headerIcon as number, // 1.2808125rem
  iconStroke: layoutTokens.headerIconStroke as number, // 1.48
  iconOpacity: layoutTokens.headerIconOpacity as number, // 0.72
  padX: layoutTokens.headerPadX as number, // px-3
  padTopMin: layoutTokens.headerPadTopMin as number, // 1.25rem
  safeAreaExtra: layoutTokens.headerSafeAreaExtra as number, // + 0.5rem
  gap: 6, // gap-1.5
} as const;

/** padding-top: max(1.25rem, safe-area-inset-top + 0.5rem) */
export function headerPaddingTop(insetTop: number) {
  return Math.max(HEADER.padTopMin, insetTop + HEADER.safeAreaExtra);
}
