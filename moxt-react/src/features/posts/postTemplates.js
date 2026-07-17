// Labels affichés dans le fil pour chaque type de source
import { activityByValue } from '../../config/businessActivities'
import { phase3Text } from '../../i18n/phase3I18n'

export const SOURCE_TYPE_LABEL_KEYS = {
  listing: 'news.types.listing',
  parcel: 'news.types.parcel',
  business: 'news.types.business',
  event: 'news.types.event',
  job: 'news.types.job',
  free: 'news.types.post',
}

/** @deprecated Prefer sourceTypeLabel(t, type) — kept for non-UI fallbacks. */
export const SOURCE_TYPE_LABELS = {
  listing: 'Annonce',
  parcel: 'Colis',
  business: 'Entreprise',
  event: 'Événement',
  job: 'Job',
  free: 'Post',
}

export function sourceTypeLabel(t, sourceType) {
  const key = SOURCE_TYPE_LABEL_KEYS[sourceType]
  return key ? phase3Text(t, key) : phase3Text(t, 'news.types.post')
}

export const SOURCE_TYPE_LINKS = {
  listing: (id) => `/marketplace/${id}`,
  parcel: (id) => `/parcels/${id}`,
  business: (id) => `/businesses/${id}`,
  event: (id) => `/events/${id}`,
  job: (id) => `/jobs/${id}`,
  free: () => '/news',
}

/**
 * Génère un message pré-rempli modifiable selon le type de source.
 * Utilise uniquement les champs réellement disponibles dans chaque modèle Redux.
 */
export function generatePostMessage(sourceType, data, firstName = '', t) {
  const name = firstName ? `${firstName} ` : ''
  const tx = (key, vars) => phase3Text(t, key, vars)

  switch (sourceType) {
    case 'business': {
      const activity = activityByValue(data.primaryActivity)
      const sector = activity?.label || data.sector || ''
      const description = (data.description || '').trim()
      const blocks = [tx('news.templates.businessHello')]

      const sectorPhrase = formatBusinessSector(sector, tx)
      const trimmedName = firstName?.trim()
      if (trimmedName) {
        blocks.push(
          tx('news.templates.businessIntroNamed', {
            name: trimmedName,
            business: data.name,
            sector: sectorPhrase ? `, ${sectorPhrase}` : '',
          }),
        )
      } else {
        blocks.push(
          tx('news.templates.businessIntro', {
            business: data.name,
            sector: sectorPhrase ? `, ${sectorPhrase}` : '',
          }),
        )
      }

      const descSnippet = descriptionAddsValue(description, { name: data.name, sector })
      if (descSnippet) blocks.push(descSnippet)

      const context = [blocks.join('\n\n'), description].join(' ')
      const extras = []

      const location =
        data.serviceZones?.trim() ||
        (data.city
          ? `${data.city}${data.country && data.country !== 'RU' ? ` · ${data.country}` : ''}`
          : '')
      if (location && !textIncludes(context, location)) {
        extras.push(`📍 ${location}`)
      }

      if (data.scheduleSummary?.trim() && !textIncludes(context, data.scheduleSummary.trim())) {
        extras.push(`🕐 ${data.scheduleSummary.trim()}`)
      }

      const contacts = buildContactLine(data, context)
      if (contacts) extras.push(contacts)

      if (extras.length) blocks.push(extras.join('\n'))

      blocks.push(tx('news.templates.businessCta'))
      return blocks.join('\n\n')
    }

    case 'listing': {
      const price = data.price ? `${data.price} ${data.currency || 'RUB'}` : ''
      const desc = truncate(data.description, 100)
      const contact = data.contact || data.whatsapp || ''
      return tx('news.templates.listing', {
        title: data.title,
        price: price ? tx('news.templates.listingPrice', { price }) : '',
        description: desc,
        contact: contact ? tx('news.templates.listingContact', { contact }) : '',
      })
    }

    case 'parcel': {
      const origin = data.origin || data.originCountry || ''
      const dest = data.destination || data.destinationCountry || ''
      const date = data.departureDate
        ? tx('news.templates.parcelDate', { date: data.departureDate })
        : ''
      const kg = data.remainingKg
        ? tx('news.templates.parcelKg', { kg: data.remainingKg })
        : ''
      const contact = data.contact
        ? tx('news.templates.parcelContact', { contact: data.contact })
        : ''
      return tx('news.templates.parcel', {
        origin,
        destination: dest,
        date,
        kg,
        contact,
      })
    }

    case 'job': {
      const company = data.publisherName || data.businessId ? data.publisherName : name
      const city = data.city || data.location || ''
      const contact = data.contact || ''
      return tx('news.templates.job', {
        company,
        title: data.title,
        city: city ? tx('news.templates.jobCity', { city }) : '',
        contact: contact
          ? tx('news.templates.jobContact', { contact })
          : tx('news.templates.jobApply'),
      })
    }

    case 'event': {
      const date = data.startAt
        ? tx('news.templates.eventDate', { date: formatEventDate(data.startAt) })
        : ''
      const place = data.city || data.address || (data.onlineLink ? tx('news.templates.online') : '')
      const desc = truncate(data.description, 100)
      return tx('news.templates.event', {
        title: data.title,
        date,
        place: place ? tx('news.templates.eventPlace', { place }) : '',
        description: desc,
      })
    }

    default:
      return ''
  }
}

/**
 * Retourne la première image disponible selon le type de source.
 */
export function getSourceImage(sourceType, data) {
  switch (sourceType) {
    case 'listing':
      return Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : null
    case 'business':
      return data.bannerUrl || data.logoUrl || null
    case 'event':
      return data.imageUrl || null
    case 'job':
    case 'parcel':
    case 'free':
    default:
      return null
  }
}

function truncate(text = '', max = 100) {
  if (!text) return ''
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

function normalizeForMatch(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
}

function textIncludes(haystack, needle) {
  if (!haystack || !needle) return false
  return normalizeForMatch(haystack).includes(normalizeForMatch(needle))
}

function formatBusinessSector(sector, tx) {
  const label = sector.trim().toLowerCase()
  return label ? tx('news.templates.businessSector', { sector: label }) : ''
}

function descriptionAddsValue(description, { name, sector }) {
  const desc = description.trim()
  if (desc.length < 25) return ''

  const lines = desc.split('\n').map((line) => line.trim()).filter(Boolean)
  const first = lines[0] || ''
  const repeatsIntro =
    Boolean(name && textIncludes(first, name)) &&
    (!sector || textIncludes(first, sector)) &&
    first.length < 140

  const body = repeatsIntro ? lines.slice(1).join('\n').trim() : desc
  if (!body || body.length < 20) return ''
  if (repeatsIntro && lines.length === 1) return ''

  return truncate(body, 200)
}

function buildContactLine(data, context) {
  const parts = []

  if (data.phone?.trim()) {
    const digits = data.phone.replace(/\D/g, '')
    if (!textIncludes(context, data.phone.trim()) && !textIncludes(context, digits.slice(-8))) {
      parts.push(`📞 ${data.phone.trim()}`)
    }
  }
  if (data.email?.trim() && !textIncludes(context, data.email.trim())) {
    parts.push(`✉️ ${data.email.trim()}`)
  }
  if (data.telegram?.trim()) {
    const handle = data.telegram.trim().replace(/^@/, '')
    if (!textIncludes(context, handle)) {
      parts.push(`💬 @${handle}`)
    }
  }

  return parts.length ? parts.join(' · ') : ''
}

function formatEventDate(iso) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}
