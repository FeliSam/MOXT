// Labels affichés dans le fil pour chaque type de source
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
      const sector = data.primaryActivity || data.sector || ''
      const desc = truncate(data.description, 120)
      const contact = data.phone || data.email || ''
      return `Bonjour la communauté 👋 Je suis ${name}et je viens de créer ${data.name}, spécialisée dans ${sector}. ${desc}${contact ? ` Contactez-moi : ${contact}` : ''}`
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

function formatEventDate(iso) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}
