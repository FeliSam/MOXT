/**
 * Texte des boutons tel que le web l'affiche réellement.
 *
 * Sur le web, `index.css` contient `button { font: inherit; }` hors couche :
 * avec Tailwind v4, cette règle l'emporte sur les classes `text-sm` /
 * `font-semibold` posées sur un <button>. Les libellés de boutons héritent donc
 * de la police de la page (16 px, graisse normale, interligne 24 px).
 * On reprend ce rendu observé plutôt que les classes écrites dans le JSX.
 */
export const WEB_BUTTON_TEXT = 'text-base font-normal';
