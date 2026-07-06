// Applique le theme avant le premier paint pour eviter le flash (FOUC).
// Charge en script bloquant dans <head> ; respecte la CSP script-src 'self'.
// La logique doit rester alignee avec getInitialTheme() de ThemeContext.
;(function () {
  try {
    var stored = localStorage.getItem('moxt-theme')
    var prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    var theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light'
    var isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    // Fond pose directement pour couvrir l'instant avant le chargement du CSS.
    document.documentElement.style.backgroundColor = isDark ? '#0c0c0e' : '#f7f8fa'
  } catch {
    /* localStorage indisponible (mode prive) : on garde le theme clair par defaut. */
  }
})()
