import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useLanguage } from '../../contexts/useLanguage'
import { addToast } from '../ui/uiSlice'
import { marketplaceText } from '../marketplace/marketplaceI18n'

/**
 * Partage natif d'une fiche (annonce, colis, job, événement, offre P2P) avec
 * repli presse-papiers quand `navigator.share` n'est pas disponible (desktop).
 *
 * `onShared` permet à l'appelant d'incrémenter son propre compteur de partages
 * — seule la marketplace en tient un aujourd'hui.
 */
export function useShareEntity({ title, url, onShared } = {}) {
  const dispatch = useDispatch()
  const { t } = useLanguage()

  return useCallback(async () => {
    const mt = (key) => marketplaceText(t, key)
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
    if (!shareUrl) return

    try {
      if (navigator.share) await navigator.share({ title, url: shareUrl })
      else await navigator.clipboard?.writeText(shareUrl)
      onShared?.()
      dispatch(
        addToast({
          title: mt('marketplace.detail.shareSuccessTitle'),
          message: mt('marketplace.detail.shareSuccessBody'),
          tone: 'success',
        }),
      )
    } catch {
      // AbortError (partage annulé par l'utilisateur) ou presse-papiers refusé.
      dispatch(
        addToast({
          title: mt('marketplace.detail.shareCancelledTitle'),
          message: mt('marketplace.detail.shareCancelledBody'),
          tone: 'info',
        }),
      )
    }
  }, [dispatch, onShared, t, title, url])
}
