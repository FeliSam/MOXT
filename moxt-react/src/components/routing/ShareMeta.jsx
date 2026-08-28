import { useEffect } from 'react'
import { DEFAULT_SHARE_OG_IMAGE } from '@moxt/shared/share/shareLinkUtils.js'

function upsertMeta(name, content) {
  if (typeof document === 'undefined' || !content) return
  let element = document.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertOg(property, content) {
  if (typeof document === 'undefined' || !content) return
  let element = document.querySelector(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

/**
 * Met à jour og:* côté client quand les données entité sont connues
 * (complète l’Edge Function share-preview pour les onglets ouverts).
 */
export function ShareMeta({ title, description, image, url }) {
  useEffect(() => {
    if (!title) return undefined
    const pageTitle = title.includes('MOXT') ? title : `${title} · MOXT`
    const imageUrl = image || DEFAULT_SHARE_OG_IMAGE
    document.title = pageTitle
    if (description) upsertMeta('description', description)
    if (url) upsertOg('og:url', url)
    upsertOg('og:title', pageTitle)
    if (description) upsertOg('og:description', description)
    upsertOg('og:image', imageUrl)
    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', pageTitle)
    if (description) upsertMeta('twitter:description', description)
    upsertMeta('twitter:image', imageUrl)
    return undefined
  }, [title, description, image, url])

  return null
}
