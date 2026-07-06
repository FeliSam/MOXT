import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteMetadata } from '../../config/routeMeta'

const SITE_NAME = 'MOXT'

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

export function DocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const { title, description } = getRouteMetadata(pathname)
    const pageTitle = title === SITE_NAME ? SITE_NAME : `${title} · ${SITE_NAME}`

    document.title = pageTitle
    upsertMeta('description', description)
    upsertOg('og:title', pageTitle)
    upsertOg('og:description', description)
    upsertMeta('twitter:title', pageTitle)
    upsertMeta('twitter:description', description)
  }, [pathname])

  return null
}
