import { useEffect, useMemo, useRef, useState } from 'react'
import { ThemeContext } from './theme-context'

const STORAGE_KEY = 'moxt-theme'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemIsDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MEDIA_QUERY).matches
}

function resolveIsDark(preference) {
  if (preference === 'dark') return true
  if (preference === 'system') return getSystemIsDark()
  return false
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    return storedTheme
  }
  // Première visite : light (fond blanc), indépendamment du OS.
  return 'light'
}

function applyResolvedTheme(isDark, { animate }) {
  const root = document.documentElement
  if (animate) root.classList.add('theme-animating')
  root.classList.toggle('dark', isDark)
  root.style.backgroundColor = isDark ? '#0c0c0e' : '#f7f8fa'
  import('../platform/capacitor').then(({ syncCapacitorStatusBar }) => syncCapacitorStatusBar(isDark))
  if (!animate) return undefined
  const t = window.setTimeout(() => root.classList.remove('theme-animating'), 420)
  return () => window.clearTimeout(t)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const [systemDark, setSystemDark] = useState(getSystemIsDark)
  const isFirstThemeEffect = useRef(true)

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (theme !== 'system') return undefined
    const media = window.matchMedia(MEDIA_QUERY)
    const onChange = (event) => setSystemDark(Boolean(event.matches))
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    }
    media.addListener(onChange)
    return () => media.removeListener(onChange)
  }, [theme])

  useEffect(() => {
    const shouldAnimate = !isFirstThemeEffect.current
    isFirstThemeEffect.current = false
    localStorage.setItem(STORAGE_KEY, theme)
    return applyResolvedTheme(isDark, { animate: shouldAnimate })
  }, [theme, isDark])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      isDark,
      setTheme: (mode) => {
        if (mode === 'system') setSystemDark(getSystemIsDark())
        setTheme(mode)
      },
      toggleTheme: () =>
        setTheme((current) => {
          if (current === 'light') return 'dark'
          if (current === 'dark') {
            setSystemDark(getSystemIsDark())
            return 'system'
          }
          return 'light'
        }),
    }),
    [theme, resolvedTheme, isDark],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export { resolveIsDark, getSystemIsDark, STORAGE_KEY as THEME_STORAGE_KEY }
