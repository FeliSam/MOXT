import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  SOURCE_LANGUAGE,
  SUPPORTED_LANGUAGES,
  normalizeStoredLanguage,
  resolveInitialLanguage,
  translateUiText,
} from '../config/uiTranslations'
import { ensureLocaleLoaded, isLocaleLoaded, translate } from '../i18n/translate'
import { LanguageContext } from './language-context'

const STORAGE_KEY = 'moxt-language'

function initialLanguage() {
  return resolveInitialLanguage(localStorage.getItem(STORAGE_KEY))
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(initialLanguage)
  // Les langues autres que le français sont chargées à la demande (voir
  // i18n/translate.js) : ce compteur force un re-rendu une fois le
  // dictionnaire arrivé, sans quoi `t()` resterait replié sur le français.
  const [localeVersion, setLocaleVersion] = useState(0)
  useEffect(() => {
    if (isLocaleLoaded(language)) return
    let cancelled = false
    ensureLocaleLoaded(language).then(() => {
      if (!cancelled) setLocaleVersion((n) => n + 1)
    })
    return () => {
      cancelled = true
    }
  }, [language])
  const textOriginalsRef = useRef(new WeakMap())
  const attributeOriginalsRef = useRef(new WeakMap())
  const userId = useSelector((state) => state.auth.user?.id)
  const accountLanguage = useSelector((state) =>
    userId ? state.account.preferences?.[userId]?.language : null,
  )

  function setLanguage(next) {
    setLanguageState(normalizeStoredLanguage(next))
  }

  // Langue du compte (profil Supabase) prime sur le localStorage appareil —
  // calculé pendant le rendu plutôt que dans un effet.
  const [prevUserId, setPrevUserId] = useState(userId)
  const [prevAccountLanguage, setPrevAccountLanguage] = useState(accountLanguage)
  if (userId !== prevUserId || accountLanguage !== prevAccountLanguage) {
    setPrevUserId(userId)
    setPrevAccountLanguage(accountLanguage)
    if (userId && accountLanguage) {
      const normalized = normalizeStoredLanguage(accountLanguage)
      setLanguageState((current) => (current === normalized ? current : normalized))
    }
  }

  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.classList.add('locale-animating')
    const timer = window.setTimeout(() => {
      document.documentElement.classList.remove('locale-animating')
    }, 240)
    return () => window.clearTimeout(timer)
  }, [language])

  useEffect(() => {
    if (language === SOURCE_LANGUAGE) return

    const originals = textOriginalsRef.current
    const attributeOriginals = attributeOriginalsRef.current
    const translatedAttributes = ['aria-label', 'placeholder', 'title']

    function translateTextNode(node) {
      if (!node.nodeValue?.trim()) return
      if (!originals.has(node)) originals.set(node, node.nodeValue)
      const knownOriginal = originals.get(node)
      const knownTranslation = translateUiText(knownOriginal, language)
      if (node.nodeValue !== knownOriginal && node.nodeValue !== knownTranslation) {
        originals.set(node, node.nodeValue)
      }
      const original = originals.get(node)
      const next = translateUiText(original, language)
      if (node.nodeValue !== next) node.nodeValue = next
    }

    function translateElementAttributes(element) {
      let attributes = attributeOriginals.get(element)
      if (!attributes) {
        attributes = {}
        attributeOriginals.set(element, attributes)
      }
      translatedAttributes.forEach((name) => {
        if (!element.hasAttribute(name)) return
        const current = element.getAttribute(name)
        const knownOriginal = attributes[name]
        if (
          knownOriginal == null ||
          (current !== knownOriginal && current !== translateUiText(knownOriginal, language))
        ) {
          attributes[name] = current
        }
        const next = translateUiText(attributes[name], language)
        if (current !== next) element.setAttribute(name, next)
      })
    }

    function translateElement(element) {
      if (!(element instanceof Element)) return
      const tag = element.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE') return
      translateElementAttributes(element)
      element.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) translateTextNode(child)
        else if (child.nodeType === Node.ELEMENT_NODE) translateElement(child)
      })
    }

    translateElement(document.body)

    let rafId = 0
    let pending = []
    const observer = new MutationObserver((mutations) => {
      pending.push(...mutations)
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        const batch = pending
        pending = []
        for (const mutation of batch) {
          if (mutation.type === 'characterData') translateTextNode(mutation.target)
          if (mutation.type === 'attributes' && mutation.target instanceof Element) {
            translateElementAttributes(mutation.target)
          }
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE) translateTextNode(node)
            else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node)
          }
        }
      })
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: translatedAttributes,
      characterData: true,
      childList: true,
      subtree: true,
    })
    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
      translateLabel: (label) =>
        language === SOURCE_LANGUAGE ? label : translateUiText(label, language),
    }),
    [language, localeVersion],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export { SUPPORTED_LANGUAGES }
