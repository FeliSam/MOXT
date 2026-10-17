/**
 * Construit un pack de contexte pour Moxti (recherche, transferts, changeurs).
 * Données déjà en Redux — pas d’appel réseau supplémentaire.
 */
import { searchablePages } from '../../config/searchablePages'
import { filterSearchIndex } from '../searchSelectors'
import { selectTransfersVisibleToUser } from '../transfers/transferSelectors'
import { listExchangersForTransfer } from '../transfers/exchangerListUtils'

const ACTIVE_TRANSFER_STATUSES = new Set([
  'pending_business_acceptance',
  'pending_payment',
  'payment_declared',
  'payment_received',
  'processing',
  'paid_out',
])

function summarizeTransfer(transfer) {
  if (!transfer) return null
  const amount = transfer.amountSent ?? transfer.amount
  const currency = transfer.currencyFrom || transfer.payload?.currencyFrom || ''
  const received = transfer.amountReceived ?? transfer.receivedAmount
  const currencyTo = transfer.currencyTo || transfer.payload?.currencyTo || ''
  return {
    id: transfer.id,
    status: transfer.status,
    direction: transfer.direction,
    originCountry: transfer.originCountry,
    amount: amount != null ? `${amount}${currency ? ` ${currency}` : ''}` : null,
    received: received != null ? `${received}${currencyTo ? ` ${currencyTo}` : ''}` : null,
    exchanger: transfer.exchanger?.name || transfer.businessName || null,
    createdAt: transfer.createdAt || transfer.updatedAt || null,
    path: `/transfers/${transfer.id}`,
  }
}

function summarizeExchanger(business) {
  if (!business) return null
  return {
    id: business.id,
    name: business.name,
    city: business.city || null,
    country: business.country || business.originCountry || null,
    rating: business.rating ?? business.averageRating ?? null,
    feePercent: business.feePercent ?? business.fee_percent ?? null,
    path: `/businesses/${business.id}`,
  }
}

function extractTransferId(question = '') {
  const match = String(question).match(/\b(MXT[-_][A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i)
  return match?.[1] || null
}

function wantsTransfers(question = '') {
  return /transfert|transfer|virement|mandat|paiement|preuve|statut|où en est|ou en est|mon dossier|mxt[-_]/i.test(
    question,
  )
}

function wantsExchangers(question = '') {
  return /échangeur|echangeur|changeur|exchanger|taux|change|partenaire/i.test(question)
}

/**
 * @param {{ state: object, question: string, user: object|null, searchIndex: array }} args
 */
export function buildAssistantContextPack({ state, question, user, searchIndex = [] }) {
  const q = String(question || '').trim()
  const userId = user?.id || null

  const searchHits = filterSearchIndex(searchIndex || [], q)
    .slice(0, 8)
    .map((item) => ({
      id: `${item.type}-${item.id}`,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle || null,
      path: item.path,
    }))

  const pageHits = searchablePages
    .filter((page) => {
      const hay = `${page.title} ${page.subtitle || ''} ${page.keywords || ''} ${page.path}`.toLowerCase()
      return q
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .some((w) => hay.includes(w))
    })
    .slice(0, 6)
    .map((page) => ({
      id: page.id,
      type: 'page',
      title: page.title,
      path: page.path,
    }))

  let transfers = []
  let focusedTransfer = null
  if (userId && (wantsTransfers(q) || extractTransferId(q))) {
    const visible = selectTransfersVisibleToUser(state, userId)
    const transferId = extractTransferId(q)
    if (transferId) {
      focusedTransfer = summarizeTransfer(
        visible.find((t) => String(t.id).toLowerCase() === transferId.toLowerCase()),
      )
    }
    transfers = visible
      .filter((t) => ACTIVE_TRANSFER_STATUSES.has(t.status) || !focusedTransfer)
      .slice(0, 8)
      .map(summarizeTransfer)
      .filter(Boolean)
  }

  let exchangers = []
  if (wantsExchangers(q) || /envoyer|transfert|argent/i.test(q)) {
    try {
      const listed = listExchangersForTransfer({
        businesses: state.businesses?.items || [],
        user,
        includeAllCountries: true,
      })
      exchangers = listed.slice(0, 6).map(summarizeExchanger).filter(Boolean)
    } catch {
      exchangers = []
    }
  }

  let jobs = []
  if (/job|emploi|travail|recrut|stage/i.test(q)) {
    const jobList = state?.jobs?.items || []
    jobs = jobList.slice(0, 6).map((j) => ({
      id: j.id,
      title: j.title || 'Offre d’emploi',
      company: j.company || 'Entreprise',
      city: j.city || 'Russie',
      salary: j.salary || null,
      path: `/jobs/${j.id}`,
    }))
  }

  let parcels = []
  if (/colis|bagage|kilo|voyage/i.test(q)) {
    const parcelList = (state?.parcels?.items || []).filter((p) => !p.status || p.status === 'active')
    parcels = parcelList.slice(0, 6).map((p) => ({
      id: p.id,
      origin: p.origin || 'Afrique',
      destination: p.destination || 'Russie',
      remainingKg: p.remainingKg ?? p.capacityKg ?? 10,
      pricePerKg: p.pricePerKg || null,
      path: `/parcels/${p.id}`,
    }))
  }

  const toolsUsed = []
  if (searchHits.length || pageHits.length) toolsUsed.push('search_content')
  if (transfers.length || focusedTransfer) toolsUsed.push('list_my_transfers')
  if (focusedTransfer) toolsUsed.push('get_transfer')
  if (exchangers.length) toolsUsed.push('list_exchangers')
  if (jobs.length) toolsUsed.push('list_jobs')
  if (parcels.length) toolsUsed.push('list_parcels')

  return {
    toolsUsed,
    searchHits: [...searchHits, ...pageHits].slice(0, 10),
    transfers,
    focusedTransfer,
    exchangers,
    jobs,
    parcels,
  }
}

export function buildTransferCandidates(contextPack) {
  const out = []
  const focused = contextPack?.focusedTransfer
  if (focused?.id) {
    out.push({
      id: `transfer-${focused.id}`,
      label: `Transfert ${focused.id}`,
      path: focused.path,
      typeLabel: 'Transfert',
    })
  }
  for (const transfer of contextPack?.transfers || []) {
    if (focused?.id && transfer.id === focused.id) continue
    out.push({
      id: `transfer-${transfer.id}`,
      label: `Transfert ${transfer.id}${transfer.status ? ` (${transfer.status})` : ''}`,
      path: transfer.path,
      typeLabel: 'Transfert',
    })
  }
  for (const exchanger of contextPack?.exchangers || []) {
    out.push({
      id: `entity-business-${exchanger.id}`,
      label: exchanger.name,
      path: exchanger.path,
      typeLabel: 'Échangeur',
    })
  }
  for (const job of contextPack?.jobs || []) {
    out.push({
      id: `job-${job.id}`,
      label: `${job.title} (${job.city})`,
      path: job.path,
      typeLabel: 'Emploi',
    })
  }
  for (const parcel of contextPack?.parcels || []) {
    out.push({
      id: `parcel-${parcel.id}`,
      label: `${parcel.origin} → ${parcel.destination}`,
      path: parcel.path,
      typeLabel: 'Colis',
    })
  }
  return out
}
