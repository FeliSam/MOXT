import { en } from './locales/en.js'
import { fr } from './locales/fr.js'

export const DEFAULT_LOCALE = 'fr'
const LOCALES = { fr, en }

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
  const locale = language === 'ru' ? DEFAULT_LOCALE : language
  const value = resolve(LOCALES[locale], key) ?? resolve(LOCALES[DEFAULT_LOCALE], key)
  if (typeof value !== 'string') return key
  return interpolate(value, vars)
}

export { LOCALES }
