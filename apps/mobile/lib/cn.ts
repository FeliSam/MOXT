/** Fusion simple de classes Tailwind (sans tailwind-merge). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
