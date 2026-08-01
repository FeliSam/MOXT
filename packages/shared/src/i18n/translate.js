import { fr } from './locales/fr.js'

export const DEFAULT_LOCALE = 'fr'

// Seul le français (langue par défaut + repli) est embarqué au démarrage.
// Les autres langues pèsent ~300 à 430 Ko chacune non minifiées : les charger
// à la demande évite de les envoyer à tous les visiteurs, quelle que soit leur
// langue réelle (marché cible à connexion mobile souvent contrainte).
const LOCALE_LOADERS = {
  en: () => import('./locales/en.js').then((m) => m.en),
  es: () => import('./locales/es.js').then((m) => m.es),
  pt: () => import('./locales/pt.js').then((m) => m.pt),
  ru: () => import('./locales/ru.js').then((m) => m.ru),
}
const LOCALES = { fr }
const pendingLoads = new Map()

/** Charge dynamiquement une langue si nécessaire (idempotent, mis en cache). */
export function ensureLocaleLoaded(language) {
  if (LOCALES[language] || !LOCALE_LOADERS[language]) return Promise.resolve()
  if (pendingLoads.has(language)) return pendingLoads.get(language)
  const promise = LOCALE_LOADERS[language]().then((dict) => {
    LOCALES[language] = dict
  })
  pendingLoads.set(language, promise)
  return promise
}

/** true si la langue est déjà disponible en mémoire (pas d'appel réseau nécessaire). */
export function isLocaleLoaded(language) {
  return Boolean(LOCALES[language])
}

function resolve(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

export function translate(language, key, vars) {
  const value = resolveLocale(language, key)
  if (typeof value !== 'string') return key
  return interpolate(value, vars)
}

/** Retourne une valeur locale (chaîne, tableau, objet) avec repli sur le français. */
export function resolveLocale(language, key) {
  const locale = LOCALES[language] ? language : DEFAULT_LOCALE
  const value =
    resolve(LOCALES[locale], key) ??
    (locale !== DEFAULT_LOCALE ? resolve(LOCALES[DEFAULT_LOCALE], key) : undefined)
  return value
}

export { LOCALES }
