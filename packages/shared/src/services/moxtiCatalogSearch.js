/**
 * Recherche catalogue pour Moxti.
 * Mêmes tables, mappers et statuts « en ligne » que le reste de l’app
 * (annonces, colis, P2P, entreprises, événements, emplois).
 * Les cartes portent un chemin interne (`/marketplace/:id`, etc.), jamais une URL web.
 */
import { isActiveEvent, isActiveJob, isActiveListing, isActiveP2POffer } from '../domain/publicationRules.js'
import { p2pOfferFromRemoteRow } from '../domain/p2pRules.js'
import { isAvailableBrowseParcel } from '../domain/parcelRules.js'
import { formatDateTime } from '../utils/formatters.js'
import { formatMoney } from '../utils/transfers.js'
import { isSourceItemLive } from '../utils/sourceLiveStatus.js'
import { businessFromRemoteRow } from './businessesService.js'
import { entityFromRemoteRow, rowsOrEmpty } from './rowUtils.js'

export const MOXTI_CATALOG_LIMIT = 8

const TABLES = {
  listing: ['listings', 120],
  parcel: ['parcels', 50],
  p2p: ['p2p_offers', 50],
  business: ['businesses', 50],
  event: ['events', 50],
  job: ['jobs', 50],
}

const PATHS = {
  listing: (id) => `/marketplace/${id}`,
  parcel: (id) => `/parcels/${id}`,
  p2p: (id) => `/p2p/${id}`,
  business: (id) => `/businesses/${id}`,
  event: (id) => `/events/${id}`,
  job: (id) => `/jobs/${id}`,
}

const KIND_LABELS = {
  fr: { listing: 'Annonce', parcel: 'Colis', p2p: 'Échange P2P', business: 'Entreprise', event: 'Événement', job: 'Emploi' },
  en: { listing: 'Listing', parcel: 'Parcel', p2p: 'P2P offer', business: 'Business', event: 'Event', job: 'Job' },
  ru: { listing: 'Объявление', parcel: 'Посылка', p2p: 'P2P', business: 'Компания', event: 'Событие', job: 'Вакансия' },
  pt: { listing: 'Anúncio', parcel: 'Encomenda', p2p: 'Oferta P2P', business: 'Empresa', event: 'Evento', job: 'Emprego' },
  es: { listing: 'Anuncio', parcel: 'Paquete', p2p: 'Oferta P2P', business: 'Empresa', event: 'Evento', job: 'Empleo' },
}

const COPY = {
  fr: {
    one: 'Voici le résultat correspondant :',
    many: 'Voici {n} résultats, du moins cher au plus cher :',
    empty: 'Je n’ai rien trouvé dans le catalogue pour cette recherche.',
  },
  en: {
    one: 'Here is the matching result:',
    many: 'Here are {n} results, cheapest first:',
    empty: 'I could not find anything in the catalog for this search.',
  },
  ru: {
    one: 'Вот подходящий результат:',
    many: 'Вот {n} результатов, от дешёвых к дорогим:',
    empty: 'В каталоге ничего не нашлось по этому запросу.',
  },
  pt: {
    one: 'Aqui está o resultado correspondente:',
    many: 'Aqui estão {n} resultados, do mais barato ao mais caro:',
    empty: 'Não encontrei nada no catálogo para esta pesquisa.',
  },
  es: {
    one: 'Aquí está el resultado correspondiente:',
    many: 'Aquí hay {n} resultados, del más barato al más caro:',
    empty: 'No encontré nada en el catálogo para esta búsqueda.',
  },
}

const STOP = new Set(
  `je tu il on nous vous me moi un une des le la les de du au aux et ou en a pour vers dans sur avec par ce cet cette ces mon ma mes ton ta tes son sa ses qui que quoi dont est sont pas plus moins cher cherche chercher recherche rechercher trouve trouver montre veux voudrais aimerais svp stp the an to for of in on my looking find show search um uma para por el los las yo busco colis parcel annonce annonces marketplace article articles evenement evenements event events weekend week emploi emplois job jobs entreprise entreprises echangeur echangeurs changeur changeurs exchanger transfert transferts transfer transfers p2p offre offres destination se this`.split(
    /\s+/,
  ),
)

const ALIASES = {
  benin: ['benin', 'bj', 'cotonou', 'porto novo', 'xof'],
  moscou: ['moscou', 'moscow', 'moskva', 'москва'],
  moscow: ['moscow', 'moscou', 'moskva', 'москва'],
  russie: ['russie', 'russia', 'moscou', 'moscow', 'россия'],
  iphone: ['iphone', 'apple'],
}

function fold(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-_/]/g, ' ')
}

function languageOf(language) {
  return COPY[language] ? language : 'fr'
}

function asPrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value == null || value === '') return null
  const match = String(value).replace(/\s/g, '').replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const price = Number(match[0])
  return Number.isFinite(price) ? price : null
}

function collectUrls(value, out) {
  if (!value) return
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return
    if ((trimmed.startsWith('[') || trimmed.startsWith('{')) && !/^https?:\/\//.test(trimmed)) {
      try {
        collectUrls(JSON.parse(trimmed), out)
      } catch {
        /* ignore */
      }
      return
    }
    if (/^https?:\/\//.test(trimmed)) out.push(trimmed)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, out))
    return
  }
  if (typeof value === 'object') collectUrls(value.url || value.uri || value.src, out)
}

function firstImage(entity) {
  const urls = []
  collectUrls(entity.images, urls)
  collectUrls(entity.imageUrl, urls)
  collectUrls(entity.logoUrl, urls)
  collectUrls(entity.bannerUrl, urls)
  collectUrls(entity.thumbnailUrl, urls)
  return urls[0] || null
}

function haystack(entity) {
  const services = Array.isArray(entity.services) ? entity.services.join(' ') : entity.services
  const zones = Array.isArray(entity.serviceZones) ? entity.serviceZones.join(' ') : entity.serviceZones
  return fold(
    [
      entity.title,
      entity.name,
      entity.description,
      entity.city,
      entity.country,
      entity.origin,
      entity.destination,
      entity.location,
      entity.category,
      entity.brand,
      entity.model,
      entity.sector,
      entity.salary,
      services,
      zones,
      entity.fromCurrency,
      entity.toCurrency,
      entity.primaryActivity,
      entity.venue,
      entity.organizerName,
      entity.ownerName,
      entity.comment,
      entity.originCountry,
      entity.destinationCountry,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

function matchesTokens(entity, tokens) {
  if (!tokens.length) return true
  const text = haystack(entity)
  return tokens.every((token) => (ALIASES[token] || [token]).some((word) => text.includes(fold(word))))
}

function detectKinds(q) {
  const kinds = new Set()
  if (/colis|parcel|encomenda|paquete|посылк/.test(q)) kinds.add('parcel')
  if (/evenement|evento|event\b|weekend|week end/.test(q)) kinds.add('event')
  if (/\bjobs?\b|emploi|emplois|vacance|ваканс/.test(q)) kinds.add('job')
  if (/\bp2p\b/.test(q)) kinds.add('p2p')
  if (/entreprise|empresa|echangeur|changeur|exchanger|обменник/.test(q)) kinds.add('business')
  if (/annonce|marketplace|articl|iphone|samsung|xiaomi|macbook|airpods|telephone|ordinateur/.test(q)) kinds.add('listing')
  if (/transfert|transfer|virement|перевод/.test(q)) {
    kinds.add('business')
    kinds.add('p2p')
  }
  return kinds
}

/** @returns {{ kinds: string[], tokens: string[], weekend: boolean } | null} */
export function parseMoxtiCatalogQuery(question) {
  const q = fold(question).trim()
  if (!q) return null
  const searchVerb =
    /\b(cherche|chercher|recherche|rechercher|trouve|trouver|montre)\b/.test(q) ||
    /\b(looking for|search for|find me|show me)\b/.test(q) ||
    /ищу|найди|покажи/.test(q)
  const howTo = /^(comment|pourquoi|quel|quelle|quels|quelles|qu est|c est quoi|explique|how |why |what |como |por que)/.test(q)
  if (howTo && !searchVerb) return null

  const kinds = detectKinds(q)
  const directed = /\b(pour|vers|para)\b/.test(q)
  const weekend = /weekend|week end|ce week/.test(q)
  if (!searchVerb && !(kinds.size && (directed || weekend))) return null
  if (!kinds.size) {
    ;['listing', 'parcel', 'p2p', 'business', 'event', 'job'].forEach((kind) => kinds.add(kind))
  }

  const tokens = q
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1 && !STOP.has(word))
  return { kinds: [...kinds], tokens, weekend }
}

/** Samedi 00:00 → dimanche 23:59 de la semaine en cours, ou le week-end à venir. */
export function weekendRange(now = new Date()) {
  const day = now.getDay()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + (day === 0 ? -1 : 6 - day))
  const end = new Date(start)
  end.setDate(start.getDate() + 1)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function inWeekend(entity, range) {
  const raw = entity.startAt || entity.startDate || null
  if (!raw) return false
  const date = new Date(raw)
  return !Number.isNaN(date.getTime()) && date >= range.start && date <= range.end
}

function isLive(kind, entity, now) {
  if (kind === 'listing') return isActiveListing(entity)
  if (kind === 'parcel') return isAvailableBrowseParcel(entity, now.toISOString().slice(0, 10))
  if (kind === 'p2p') return isActiveP2POffer(entity)
  if (kind === 'business') return isSourceItemLive('business', entity)
  if (kind === 'event') return isActiveEvent(entity)
  if (kind === 'job') return isActiveJob(entity)
  return false
}

function mapRow(kind, row) {
  if (kind === 'p2p') return p2pOfferFromRemoteRow(row)
  if (kind === 'business') return businessFromRemoteRow(row)
  return entityFromRemoteRow(row)
}

function cardFrom(kind, entity, language) {
  const id = String(entity.id || '')
  if (!id) return null
  const labels = KIND_LABELS[language] || KIND_LABELS.fr
  const title = String(entity.title || entity.name || labels[kind])
  let subtitle = ''
  let meta = ''
  let price = null
  let priceLabel = null
  const currency = entity.currency || 'RUB'

  if (kind === 'listing') {
    price = asPrice(entity.price)
    subtitle = [entity.city, entity.country].filter(Boolean).join(', ')
    meta = [entity.category, entity.condition].filter(Boolean).join(' · ')
    priceLabel = price == null ? null : formatMoney(price, currency, language)
  } else if (kind === 'parcel') {
    price = asPrice(entity.pricePerKg)
    subtitle = [entity.origin, entity.destination].filter(Boolean).join(' → ')
    const kg = entity.remainingKg ?? entity.capacityKg
    meta = [entity.departureDate, kg != null ? `${kg} kg` : ''].filter(Boolean).join(' · ')
    priceLabel = price == null ? null : `${formatMoney(price, currency, language)}/kg`
  } else if (kind === 'p2p') {
    price = asPrice(entity.rate)
    const amount = asPrice(entity.amount)
    subtitle = [entity.fromCurrency, entity.toCurrency].filter(Boolean).join(' → ')
    meta = amount == null ? '' : formatMoney(amount, entity.fromCurrency || 'RUB', language)
    priceLabel = price == null ? null : `× ${price}`
  } else if (kind === 'business') {
    price = asPrice(entity.feePercent ?? entity.fee_percent)
    subtitle = [entity.city, entity.country].filter(Boolean).join(', ')
    meta = entity.rating != null ? `★ ${entity.rating}` : String(entity.primaryActivity || '')
    priceLabel = price == null ? null : `${price} %`
  } else if (kind === 'event') {
    price = asPrice(entity.price)
    subtitle = [entity.city, entity.venue].filter(Boolean).join(' · ')
    meta = entity.startAt ? formatDateTime(entity.startAt, language) : ''
    priceLabel = price == null ? null : formatMoney(price, currency, language)
  } else if (kind === 'job') {
    price = asPrice(entity.salary)
    subtitle = String(entity.location || entity.city || '')
    meta = String(entity.sector || entity.contractType || '')
    priceLabel = entity.salary ? String(entity.salary) : price == null ? null : formatMoney(price, 'RUB', language)
  }

  return {
    kind,
    id,
    title,
    subtitle,
    meta,
    price,
    priceLabel,
    image: firstImage(entity),
    path: PATHS[kind](id),
    kindLabel: labels[kind],
  }
}

export function compareMoxtiCards(a, b) {
  if (a.price == null && b.price == null) return String(a.title).localeCompare(String(b.title))
  if (a.price == null) return 1
  if (b.price == null) return -1
  if (a.price !== b.price) return a.price - b.price
  return String(a.title).localeCompare(String(b.title))
}

async function loadKind(client, kind) {
  const [table, limit] = TABLES[kind]
  const result = await client.from(table).select('*').order('created_at', { ascending: false }).limit(limit)
  return rowsOrEmpty(result).map((row) => mapRow(kind, row)).filter(Boolean)
}

function introFor(count, language) {
  const pack = COPY[language] || COPY.fr
  if (!count) return pack.empty
  if (count === 1) return pack.one
  return pack.many.replace('{n}', String(count))
}

/**
 * @param {any} client
 * @param {{ question?: string, language?: string, now?: Date }} [input]
 */
export async function searchMoxtiCatalog(client, { question, language = 'fr', now = new Date() } = {}) {
  const lang = languageOf(language)
  const parsed = parseMoxtiCatalogQuery(question)
  if (!parsed) return { searched: false, cards: [], intro: '' }
  if (!client?.from) throw new Error('Supabase non configuré')

  const range = parsed.weekend ? weekendRange(now) : null
  const batches = await Promise.all(
    parsed.kinds.map(async (kind) => {
      try {
        const entities = await loadKind(client, kind)
        return entities
          .filter((entity) => isLive(kind, entity, now))
          .filter((entity) => kind !== 'event' || !range || inWeekend(entity, range))
          .filter((entity) => matchesTokens(entity, parsed.tokens))
          .map((entity) => cardFrom(kind, entity, lang))
          .filter(Boolean)
      } catch {
        return []
      }
    }),
  )
  const cards = batches.flat().sort(compareMoxtiCards).slice(0, MOXTI_CATALOG_LIMIT)
  return { searched: true, cards, intro: introFor(cards.length, lang) }
}
