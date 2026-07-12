import { en } from './locales/en.js'
import { fr } from './locales/fr.js'
import { pt } from './locales/pt.js'
import { ru } from './locales/ru.js'

export const DEFAULT_LOCALE = 'fr'
const LOCALES = { fr, en, ru, pt }

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
