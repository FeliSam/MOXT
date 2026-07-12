const INVITE_CODE_RE = /^MOXT-[A-Z0-9]{6}$/i
const MOXT_HOST_RE = /(^|\.)moxt(app)?\.(ru|app)$/i

/**
 * Analyse le contenu d'un QR MOXT et renvoie une route interne exploitable.
 * @param {string} raw
 * @returns {{ type: 'user'|'business'|'invite', path: string, labelKey: string, userId?: string, businessId?: string, code?: string } | null}
 */
export function parseMoxtScanTarget(raw) {
  const value = String(raw || '').trim()
  if (!value) return null

  if (INVITE_CODE_RE.test(value)) {
    const code = value.toUpperCase()
    return {
      type: 'invite',
      path: `/invite/${code}`,
      labelKey: 'share.scanner.targets.invite',
      code,
    }
  }

  let pathname = value
  let search = ''

  if (value.startsWith('/')) {
    const split = value.split('?')
    pathname = split[0]
    search = split[1] ? `?${split[1]}` : ''
  } else {
    try {
      const url = new URL(value)
      if (!isMoxtHost(url.hostname)) return null
      pathname = url.pathname
      search = url.search
    } catch {
      return null
    }
  }

  const userMatch = pathname.match(/^\/users\/([^/]+)(?:\/(?:publications|annonces))?\/?$/i)
  if (userMatch?.[1]) {
    const userId = userMatch[1]
    return {
      type: 'user',
      path: `/users/${userId}/publications`,
      labelKey: 'share.scanner.targets.user',
      userId,
    }
  }

  const businessPublicationsMatch = pathname.match(
    /^\/businesses\/([^/]+)\/publications(?:\/[^/]+)?\/?$/i,
  )
  if (businessPublicationsMatch?.[1]) {
    const businessId = businessPublicationsMatch[1]
    return {
      type: 'business',
      path: `/businesses/${businessId}/publications/listings${search}`,
      labelKey: 'share.scanner.targets.business',
      businessId,
    }
  }

  const businessMatch = pathname.match(/^\/businesses\/([^/]+)\/?$/i)
  if (businessMatch?.[1] && businessMatch[1] !== 'setup') {
    const businessId = businessMatch[1]
    return {
      type: 'business',
      path: `/businesses/${businessId}/publications/listings`,
      labelKey: 'share.scanner.targets.business',
      businessId,
    }
  }

  const inviteMatch = pathname.match(/^\/invite\/([^/]+)\/?$/i)
  if (inviteMatch?.[1]) {
    const code = inviteMatch[1]
    return {
      type: 'invite',
      path: `/invite/${code}`,
      labelKey: 'share.scanner.targets.invite',
      code,
    }
  }

  return null
}

function isMoxtHost(hostname = '') {
  const host = hostname.toLowerCase()
  if (!host) return false
  if (MOXT_HOST_RE.test(host)) return true
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  return false
}
