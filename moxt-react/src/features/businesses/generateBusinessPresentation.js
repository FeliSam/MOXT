import { activityByValue } from '../../config/businessActivities'

/**
 * Génère un texte de présentation à partir des champs du formulaire entreprise.
 */
export function generateBusinessPresentation(values = {}) {
  const activity = activityByValue(values.primaryActivity)
  const activityLabel = activity?.label || values.sector || 'notre activité'
  const name = values.name?.trim() || 'notre entreprise'

  const lines = [`${name} — ${activityLabel.toLowerCase()}.`]

  if (values.serviceZones?.trim()) {
    lines.push(`Zone d'intervention : ${values.serviceZones.trim()}.`)
  } else if (values.city?.trim()) {
    lines.push(`Basée à ${values.city.trim()}, Russie.`)
  }

  if (values.address?.trim() && !values.serviceZones?.trim()) {
    lines.push(`Adresse : ${values.address.trim()}.`)
  }

  const contacts = []
  if (values.phone?.trim()) contacts.push(`tél. ${values.phone.trim()}`)
  if (values.originPhone?.trim()) contacts.push(`origine : ${values.originPhone.trim()}`)
  if (values.email?.trim()) contacts.push(values.email.trim())
  if (values.telegram?.trim()) {
    const handle = values.telegram.trim().startsWith('@')
      ? values.telegram.trim()
      : `@${values.telegram.trim()}`
    contacts.push(`Telegram ${handle}`)
  }
  if (values.website?.trim()) contacts.push(values.website.trim())

  if (contacts.length) {
    lines.push(`Contact : ${contacts.join(' · ')}.`)
  }

  if (values.scheduleSummary?.trim()) {
    lines.push(`Horaires : ${values.scheduleSummary.trim()}.`)
  }

  if (values.services?.includes('Transfert') && values.feePercent != null) {
    lines.push(`Frais de transfert : ${values.feePercent}\u00a0%.`)
  }

  if (values.services?.includes('Transfert') && values.averageDelay?.trim()) {
    lines.push(`Délai moyen : ${values.averageDelay.trim()}.`)
  }

  return lines.join('\n').trim()
}
