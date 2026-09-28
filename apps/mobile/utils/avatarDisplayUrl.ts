/**
 * Variante d'affichage d'un avatar — portage minimal de
 * moxt-react/src/features/account/avatarDisplayUrl.js (portraits de la
 * bibliothèque → vignette 256 px ; Supabase Storage → rendu redimensionné).
 * Les avatars DiceBear (Lorelei) sont enregistrés en PNG par l'éditeur web :
 * ce sont des images classiques, aucun rendu SVG n'est nécessaire.
 */
const PORTRAIT_PATH_RE = /\/avatars\/portraits\/(v\d+)\/(?:thumbs\/)?([a-z0-9-]+)\.jpg(?:[?#].*)?$/i;

export function avatarDisplayUrl(url: string | null | undefined, width = 96): string | null {
  if (!url || typeof url !== 'string') return null;
  const value = url.trim();
  if (!value) return null;
  if (value.includes('/render/image/')) return value;

  const portrait = value.match(PORTRAIT_PATH_RE);
  if (portrait) {
    const base = value.split(/[?#]/)[0];
    const folder = base.slice(0, base.indexOf(`/avatars/portraits/${portrait[1]}/`));
    const root = `${folder}/avatars/portraits/${portrait[1]}/`;
    return width <= 256 ? `${root}thumbs/${portrait[2]}.jpg` : `${root}${portrait[2]}.jpg`;
  }

  const [base, query = ''] = value.split('?');
  if (base.includes('.supabase.co/storage/v1/object/public/')) {
    const transformed = base.replace('/object/public/', '/render/image/public/');
    const params = `width=${width}&height=${width}&resize=cover`;
    return `${transformed}?${query ? `${query}&` : ''}${params}`;
  }
  return value;
}
