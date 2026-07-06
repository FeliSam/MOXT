import { useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './theme-context'
const STORAGE_KEY = 'moxt-theme'

function getInitialTheme() {
  const storedTheme = localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    // Garde en phase le fond pose par theme-init.js (anti-FOUC) lors d'un changement.
    document.documentElement.style.backgroundColor = isDark ? '#0c0c0e' : '#f7f8fa'
    localStorage.setItem(STORAGE_KEY, theme)
    import('../platform/capacitor').then(({ syncCapacitorStatusBar }) => syncCapacitorStatusBar(isDark))
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
