import { pathToFileURL } from 'url'
import path from 'path'

const root = path.resolve('packages/shared/src/i18n/locales')
const load = async (n) => {
  const mod = await import(pathToFileURL(path.join(root, n)).href)
  return mod[n.replace('.js', '')]
}
const fr = await load('fr.js')
const en = await load('en.js')
const es = await load('es.js')
const keys = [
  'errors.auth.smsConfig',
  'messages.suggestions.job.owner.profile',
  'messages.suggestions.transfer.owner.safe',
  'messages.suggestions.general.owner.available',
  'publications.publisher.cta.listings',
  'marketplace.extra.availableFrom.label',
  'marketplaceValidation.stockMin',
  'transfers.nextStep.completed.description',
  'exchangers.detail.notFoundDesc',
  'communications.chips.listing.available',
  'businesses.spotlight.value.parcelCapacity',
  'businesses.subscription.followBody',
  'professional.subscriptions.howTitle',
  'professional.subscriptions.notifyLabel.all',
  'assistant.responses.colis.texts.0',
  'assistant.responses.colis.texts.1',
  'legal.sections.cgu.paragraphs',
  'legal.sections.privacy.paragraphs',
]
function get(o, p) {
  return p.split('.').reduce((a, k) => a?.[k], o)
}
for (const k of keys) {
  console.log('---', k)
  console.log('FR:', JSON.stringify(get(fr, k)))
  console.log('EN:', JSON.stringify(get(en, k)))
  console.log('ES:', JSON.stringify(get(es, k)))
}
