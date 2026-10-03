/** Paramètre expo-router (chaîne ou tableau) décodé. */
export function routeParam(value: string | string[] | undefined | null): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(String(raw)).trim();
  } catch {
    return String(raw).trim();
  }
}

/** Dernier segment du chemin, si le paramètre de route n’est pas encore posé. */
export function idFromPath(pathname: string | null | undefined): string {
  const parts = String(pathname || '').split('/').filter(Boolean);
  return routeParam(parts[parts.length - 1] || '');
}
