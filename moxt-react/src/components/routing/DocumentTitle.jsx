import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteMetadata, isPublicIndexablePath } from '../../config/routeMeta'
import { useLanguage } from '../../contexts/useLanguage'
import { buildAbsoluteUrl } from '../../utils/siteUrl'

const SITE_NAME = 'MOXT'
const DEFAULT_OG_IMAGE = 'https://moxtapp.ru/assets/logos/X.png'

function upsertMeta(name, content) {
  let element = document.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertOg(property, content) {
  let element = document.querySelector(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href) {
  let element = document.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

export function DocumentTitle() {
  const { pathname } = useLocation()
  const { translateLabel } = useLanguage()

  useEffect(() => {
    const { title, description } = getRouteMetadata(pathname)
    const localizedTitle = translateLabel(title)
    const localizedDescription = translateLabel(description)
    const pageTitle =
      localizedTitle === SITE_NAME || localizedTitle.includes(SITE_NAME)
        ? localizedTitle
        : `${localizedTitle} · ${SITE_NAME}`
    const canonical = buildAbsoluteUrl(pathname === '/' ? '/' : pathname)
    const indexable = isPublicIndexablePath(pathname)

    document.title = pageTitle
    upsertMeta('description', localizedDescription)
    upsertMeta(
      'robots',
      indexable ? 'index,follow,max-image-preview:large' : 'noindex,nofollow',
    )
    upsertCanonical(canonical)
    upsertOg('og:url', canonical)
    upsertOg('og:title', pageTitle)
    upsertOg('og:description', localizedDescription)
    upsertOg('og:image', DEFAULT_OG_IMAGE)
    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', pageTitle)
    upsertMeta('twitter:description', localizedDescription)
    upsertMeta('twitter:image', DEFAULT_OG_IMAGE)
  }, [pathname, translateLabel])

  return null
}
