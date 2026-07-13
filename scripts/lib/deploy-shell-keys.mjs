/** Fichiers « point d’entrée » — publiés en dernier pour ne pas casser la prod. */
export const SHELL_KEYS = new Set([
  'index.html',
  'sw.js',
  'offline.html',
  'version.json',
  'deploy-manifest.json',
  'theme-init.js',
  'manifest.webmanifest',
])

export function isShellKey(key) {
  return SHELL_KEYS.has(key)
}
