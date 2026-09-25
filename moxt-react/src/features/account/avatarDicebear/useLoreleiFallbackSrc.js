import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

/**
 * Sans photo ni avatar CDN : rend localement le Lorelei enregistré
 * (profiles.preferences.avatarDicebear). Après enregistrement, avatarUrl (CDN) prime.
 */
export function useLoreleiFallbackSrc(user, { size = 160 } = {}) {
  const prefs = useSelector((state) =>
    user?.id ? state.account.preferences?.[user.id]?.avatarDicebear : null,
  )
  const needed = Boolean(user?.id && !user?.avatarUrl && prefs?.style === 'lorelei')
  const key = needed ? JSON.stringify(prefs) : ''
  const [state, setState] = useState({ key: '', src: '' })

  useEffect(() => {
    if (!needed) return undefined
    let cancelled = false
    Promise.all([import('./createLoreleiAvatar.js'), import('./loreleiOptions.js')])
      .then(([render, opts]) => {
        if (cancelled) return
        const options = opts.preferencesToLoreleiOptions(prefs, user.id)
        setState({ key, src: render.loreleiSvgDataUri(options, { size }) })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, size, needed])

  return needed && state.key === key ? state.src : ''
}
