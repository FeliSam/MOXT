// Applique le theme avant le premier paint pour eviter le flash (FOUC).
// Charge en script bloquant dans <head> ; respecte la CSP script-src 'self'.
// Aligne avec getInitialTheme() / resolveIsDark() de ThemeContext.
;(function () {
  try {
    var stored = localStorage.getItem('moxt-theme')
    var preference =
      stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'light'
    var prefersDark =
      typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    var isDark = preference === 'dark' || (preference === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.backgroundColor = isDark ? '#0c0c0e' : '#f7f8fa'
  } catch {
    /* localStorage indisponible (mode prive) : on garde le theme clair par defaut. */
  }
})()
