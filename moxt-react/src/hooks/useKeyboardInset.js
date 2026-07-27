import { useEffect } from 'react'

/** Seuil anti faux-positifs (chrome Safari / URL bar ≈ 40–100px). */
const KEYBOARD_OPEN_PX = 180

/**
 * Suit le visual viewport et expose deux mesures distinctes :
 *
 * - `--keyboard-inset` + classe `keyboard-open` : hauteur du clavier logiciel.
 * - `--viewport-bottom-gap` : écart entre le bas du *layout* viewport (sur
 *   lequel `position: fixed` se cale) et le bas réellement visible.
 *
 * Ce second écart est la cause réelle du « décollement » de la barre de
 * navigation : pendant que la barre d'URL mobile se rétracte ou réapparaît, le
 * layout viewport ne bouge pas alors que la zone visible change — un élément
 * `position: fixed` se retrouve donc peint hors de l'écran. On le compense par
 * une translation (voir `.bottom-nav-shell` dans index.css).
 */
export function useKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    function update() {
      const raw = vv
        ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
        : 0
      const open = raw >= KEYBOARD_OPEN_PX
      // Fermé → forcer 0 (pas de margin fantôme sur le composer).
      root.style.setProperty('--keyboard-inset', open ? `${raw}px` : '0px')
      root.classList.toggle('keyboard-open', open)
      // Sous le seuil clavier, l'écart vient de la barre d'URL : on le
      // compense. Au-delà, la barre de navigation est masquée de toute façon.
      root.style.setProperty('--viewport-bottom-gap', open ? '0px' : `${raw}px`)
    }

    update()
    window.addEventListener('resize', update)
    // Le scroll de page déclenche l'apparition/rétraction de la barre d'URL.
    window.addEventListener('scroll', update, { passive: true })
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      root.style.removeProperty('--keyboard-inset')
      root.style.removeProperty('--viewport-bottom-gap')
      root.classList.remove('keyboard-open')
    }
  }, [])
}
