import { useEffect, useMemo, useRef, useState } from 'react'
import { ThemeContext } from './theme-context'
const STORAGE_KEY = 'moxt-theme'

function getInitialTheme() {
  const storedTheme = localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
  // Première visite : light (fond blanc), indépendamment du OS.
  return 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const isFirstThemeEffect = useRef(true)

  useEffect(() => {
    const isDark = theme === 'dark'
    const root = document.documentElement
    const shouldAnimate = !isFirstThemeEffect.current
    isFirstThemeEffect.current = false
    if (shouldAnimate) root.classList.add('theme-animating')
    root.classList.toggle('dark', isDark)
    // Garde en phase le fond pose par theme-init.js (anti-FOUC) lors d'un changement.
    root.style.backgroundColor = isDark ? '#0c0c0e' : '#f7f8fa'
    localStorage.setItem(STORAGE_KEY, theme)
    import('../platform/capacitor').then(({ syncCapacitorStatusBar }) => syncCapacitorStatusBar(isDark))
    if (!shouldAnimate) return undefined
    const t = window.setTimeout(() => root.classList.remove('theme-animating'), 420)
    return () => window.clearTimeout(t)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
