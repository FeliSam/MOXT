// Rendu paresseux natif : `content-visibility: auto` (classe .lazy-content)
// laisse le navigateur sauter le rendu et le layout du contenu hors-écran,
// SANS le retirer du DOM. La recherche Ctrl+F, les lecteurs d'écran et
// l'impression continuent donc de fonctionner. `contain-intrinsic-size` réserve
// une hauteur de substitution pour éviter les sauts de barre de défilement.
export function LazyContent({ children, className = '', minHeight = '12rem' }) {
  return (
    <div
      className={`lazy-content h-full ${className}`}
      style={{ containIntrinsicSize: `auto ${minHeight}` }}
    >
      {children}
    </div>
  )
}
