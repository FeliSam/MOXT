import { activityByValue } from '../../config/businessActivities'
import { buildAbsoluteUrl } from '../../utils/siteUrl'

export function businessPublicationsPath(businessId) {
  return `/businesses/${businessId}/publications/listings`
}

export function businessShareVersion(business = {}) {
  if (business.updatedAt) return business.updatedAt
  return [
    business.name,
    business.city,
    business.country,
    business.primaryActivity,
    business.sector,
    business.logoUrl,
    business.phone,
    business.email,
    business.telegram,
    business.description,
  ]
    .filter(Boolean)
    .join('|')
}

export function buildBusinessShareUrl(business, { absolute = true } = {}) {
  if (!business?.id) {
    return absolute ? buildAbsoluteUrl('/businesses') : '/businesses'
  }
  const path = businessPublicationsPath(business.id)
  const version = businessShareVersion(business)
  const relative = version ? `${path}?v=${encodeURIComponent(version)}` : path
  return absolute ? buildAbsoluteUrl(relative) : relative
}

export function buildBusinessShareText(business) {
  const activity = activityByValue(business.primaryActivity)
  const sector = activity?.label || business.sector || ''
  const lines = [`Découvrez ${business.name} sur MOXT.`]

  if (sector) lines.push(sector)

  if (business.city) {
    const location =
      business.country && business.country !== 'RU'
        ? `${business.city} · ${business.country}`
        : business.city
    lines.push(location)
  }

  const contacts = [
    business.phone ? `tél. ${business.phone}` : '',
    business.email || '',
    business.telegram
      ? `Telegram ${business.telegram.startsWith('@') ? business.telegram : `@${business.telegram}`}`
      : '',
  ].filter(Boolean)

  if (contacts.length) {
    lines.push(`Contact : ${contacts.join(' · ')}`)
  }

  if (business.description?.trim()) {
    const snippet = business.description.trim()
    lines.push(snippet.length > 160 ? `${snippet.slice(0, 160)}…` : snippet)
  }

  return lines.join('\n')
}

export function buildBusinessShareUrlFromValues(values = {}) {
  return buildBusinessShareUrl(
    {
      id: values.id,
      name: values.name,
      city: values.city,
      country: values.country,
      primaryActivity: values.primaryActivity,
      sector: values.sector,
      logoUrl: values.logoUrl,
      phone: values.phone,
      email: values.email,
      telegram: values.telegram,
      description: values.description,
    },
    { absolute: true },
  )
}

export function businessCityLabel(business) {
  if (!business?.city) return ''
  return business.country && business.country !== 'RU'
    ? `${business.city} · ${business.country}`
    : business.city
}
