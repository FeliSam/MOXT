import { brandScale, withAlpha } from '@moxt/shared/design/index.js';

export const brand = brandScale as Readonly<Record<'50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900', string>>;

/** Couleur `#rrggbb` avec opacité, équivalent de `bg-[var(--x)]/65` côté web. */
export function withAlphaColor(hex: string, alpha: number): string {
  return withAlpha(hex, alpha) as string;
}

/**
 * `color-mix(in srgb, tint p%, base)` → hex (dégradés des tuiles bento du web).
 */
export function mixColors(tint: string, base: string, ratio: number): string {
  const parse = (hex: string) => {
    const v = hex.replace('#', '');
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    const n = Number.parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = parse(tint);
  const b = parse(base);
  const mixed = a.map((c, i) => Math.round(c * ratio + b[i] * (1 - ratio)));
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
