import { Capacitor } from '@capacitor/core'
import { SUPPORTED_LANGUAGES } from './uiTranslations'

export const STORE_CHANNELS = ['ios', 'play', 'rustore', 'web']

export const DEFAULT_STORE_LOCALES = {
  ios: 'fr',
  play: 'fr',
  rustore: 'ru',
  web: 'fr',
}

export const LANGUAGE_CHOSEN_STORAGE_KEY = 'moxt-language-chosen'

export function normalizeStoreLocale(code, fallback = 'fr') {
  return SUPPORTED_LANGUAGES.includes(code) ? code : fallback
}

export function normalizeStoreLocalesConfig(raw = {}) {
  return {
    ios: normalizeStoreLocale(raw.ios, DEFAULT_STORE_LOCALES.ios),
    play: normalizeStoreLocale(raw.play, DEFAULT_STORE_LOCALES.play),
    rustore: normalizeStoreLocale(raw.rustore, DEFAULT_STORE_LOCALES.rustore),
    web: normalizeStoreLocale(raw.web, DEFAULT_STORE_LOCALES.web),
  }
}

export function detectDistributionStore() {
  const baked = String(import.meta.env?.VITE_DISTRIBUTION_STORE || '')
    .trim()
    .toLowerCase()
  if (STORE_CHANNELS.includes(baked)) return baked

  if (typeof window === 'undefined') return 'web'

  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return 'ios'
  if (platform === 'web') return 'web'

  const ua = String(navigator.userAgent || '')
  if (/RuStore/i.test(ua)) return 'rustore'
  return 'play'
}

export function localeForStore(store, config = DEFAULT_STORE_LOCALES) {
  const channel = STORE_CHANNELS.includes(store) ? store : 'web'
  const locales = normalizeStoreLocalesConfig(config)
  return locales[channel]
}

export function hasExplicitLanguageChoice() {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(LANGUAGE_CHOSEN_STORAGE_KEY) === '1'
}

export function markExplicitLanguageChoice() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LANGUAGE_CHOSEN_STORAGE_KEY, '1')
}
