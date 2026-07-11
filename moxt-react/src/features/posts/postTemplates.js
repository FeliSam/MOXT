// Labels affichés dans le fil pour chaque type de source
import { activityByValue } from '../../config/businessActivities'

export const SOURCE_TYPE_LABELS = {
  listing: 'Annonce',
  parcel: 'Colis',
  business: 'Entreprise',
  event: 'Événement',
  job: 'Job',
  free: 'Post',
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
export function generatePostMessage(sourceType, data, firstName = '') {
  const name = firstName ? `${firstName} ` : ''

  switch (sourceType) {
    case 'business': {
      const activity = activityByValue(data.primaryActivity)
      const sector = activity?.label || data.sector || ''
      const description = (data.description || '').trim()
      const blocks = ['Bonjour la communauté MOXT ! 👋']

      const sectorPhrase = formatBusinessSector(sector)
      const trimmedName = firstName?.trim()
      if (trimmedName) {
        blocks.push(
          `${trimmedName} ici — je vous présente ${data.name}${sectorPhrase ? `, ${sectorPhrase}` : ''}.`,
        )
      } else {
        blocks.push(`Découvrez ${data.name}${sectorPhrase ? `, ${sectorPhrase}` : ''}.`)
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

      blocks.push('👉 Retrouvez notre fiche sur MOXT. 🤝')
      return blocks.join('\n\n')
    }

    case 'listing': {
      const price = data.price ? `${data.price} ${data.currency || 'RUB'}` : ''
      const desc = truncate(data.description, 100)
      const contact = data.contact || data.whatsapp || ''
      return `Je vends "${data.title}"${price ? ` à ${price}` : ''}. ${desc}${contact ? ` Intéressé(e) ? Contactez-moi : ${contact}` : ''}`
    }

    case 'parcel': {
      const origin = data.origin || data.originCountry || ''
      const dest = data.destination || data.destinationCountry || ''
      const date = data.departureDate ? ` le ${data.departureDate}` : ''
      const kg = data.remainingKg ? `${data.remainingKg} kg disponibles` : ''
      const contact = data.contact || ''
      return `📦 Envoi de colis ${origin} → ${dest}${date}. ${kg}${contact ? ` Contact : ${contact}` : ''}`
    }

    case 'job': {
      const company = data.publisherName || data.businessId ? data.publisherName : name
      const city = data.city || data.location || ''
      const contact = data.contact || ''
      return `${company}recrute : ${data.title}${city ? ` à ${city}` : ''}.${contact ? ` Candidatures : ${contact}` : ' Postulez via MOXT !'}`
    }

    case 'event': {
      const date = data.startAt ? formatEventDate(data.startAt) : ''
      const place = data.city || data.address || (data.onlineLink ? 'En ligne' : '')
      const desc = truncate(data.description, 100)
      return `🎉 Ne manquez pas "${data.title}"${date ? ` le ${date}` : ''}${place ? ` à ${place}` : ''}. ${desc}`
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

function formatBusinessSector(sector) {
  const label = sector.trim().toLowerCase()
  return label ? `spécialisée en ${label}` : ''
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
