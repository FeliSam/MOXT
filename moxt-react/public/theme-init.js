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
    // Boot / reload : fond noir (splash Moxt). ThemeContext repasse au fond app apres hydratation.
    document.documentElement.style.backgroundColor = '#000000'
    if (document.body) document.body.style.backgroundColor = '#000000'
  } catch {
    /* localStorage indisponible (mode prive) : splash noir par defaut. */
    try {
      document.documentElement.style.backgroundColor = '#000000'
    } catch {
      /* ignore */
    }
  }
})()
