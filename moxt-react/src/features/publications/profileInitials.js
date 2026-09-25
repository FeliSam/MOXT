/**
 * Initiales affichées quand un profil n'a pas d'avatar : les 2 premiers caractères du nom
 * complet (prénom + nom), en majuscules — « Рикардо Оке » → « РИ ».
 * Même règle partout : haut du profil, éditeur de bannière, modale QR, badge téléchargé.
 */
export function profileInitials(name, fallback) {
  const source = String(fallback || name || '').trim()
  return source ? source.slice(0, 2).toUpperCase() : '?'
}
