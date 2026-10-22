import { resolveNativePath } from '@/utils/nativePath';

/** Liens `moxt://` et `https://moxtapp.ru/...` → écran natif avant le routeur. */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  void initial;
  try {
    const next = resolveNativePath(path);
    if (next) return next;
    if (path.includes('://')) return '/';
    return path.startsWith('/') ? path : '/';
  } catch {
    return '/';
  }
}
