/**
 * Construit un pack de contexte riche et intelligent pour Moxti
 * (recherche, transferts récents et dernier transfert, annonces marketplace,
 * articles/posts d'actualité, changeurs vérifiés, emplois, colis).
 * Données déjà en mémoire Redux — zéro appel réseau supplémentaire.
 */
import { searchablePages } from '../../config/searchablePages'
import { filterSearchIndex } from '../searchSelectors'
import { selectTransfersVisibleToUser } from '../transfers/transferSelectors'
import { listExchangersForTransfer } from '../transfers/exchangerListUtils'
import { receiptStatusLabel } from '../transfers/receiptExport'
import { getPostImages } from '../posts/postMediaUtils'
import { resolveListingImageUrl } from '../marketplace/listingImageUtils'

const ACTIVE_TRANSFER_STATUSES = new Set([
  'pending_business_acceptance',
  'pending_payment',
  'payment_declared',
  'payment_received',
  'processing',
  'paid_out',
])

function cleanText(val = '') {
  return String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function summarizeTransfer(transfer) {
  if (!transfer) return null
  const amount = transfer.amountSent ?? transfer.amount
  const currency = transfer.currencyFrom || transfer.payload?.currencyFrom || ''
  const received = transfer.amountReceived ?? transfer.receivedAmount
  const currencyTo = transfer.currencyTo || transfer.payload?.currencyTo || ''
  const statusLabel = receiptStatusLabel(transfer.status)

  return {
    id: transfer.id,
    status: transfer.status,
    statusFriendly: statusLabel,
    direction: transfer.direction || transfer.countryTo || transfer.destinationCountry || null,
    originCountry: transfer.originCountry || transfer.countryFrom || 'Russie',
    amount: amount != null ? `${amount}${currency ? ` ${currency}` : ''}` : null,
    received: received != null ? `${received}${currencyTo ? ` ${currencyTo}` : ''}` : null,
    amountSentNum: amount != null ? Number(amount) : null,
    amountReceivedNum: received != null ? Number(received) : null,
    currencyFrom: currency || 'RUB',
    currencyTo: currencyTo || 'XOF',
    exchanger: transfer.exchanger?.name || transfer.businessName || null,
    createdAt: transfer.createdAt || transfer.updatedAt || null,
    path: `/transfers/${transfer.id}`,
    type: 'transfer',
  }
}

export function summarizeExchanger(business) {
  if (!business) return null
  return {
    id: business.id,
    name: business.name,
    city: business.city || null,
    country: business.country || business.originCountry || null,
    rating: business.rating ?? business.averageRating ?? null,
    feePercent: business.feePercent ?? business.fee_percent ?? null,
    avatarUrl: business.avatarUrl || business.avatar_url || business.logoUrl || null,
    path: `/businesses/${business.id}`,
    type: 'exchanger',
  }
}

export function summarizeListing(listing) {
  if (!listing) return null
  const images = Array.isArray(listing.images) ? listing.images : listing.imageUrl ? [listing.imageUrl] : []
  const resolvedImg = images[0] ? resolveListingImageUrl(images[0]) : null

  return {
    id: listing.id,
    title: listing.title || 'Annonce Marketplace',
    description: listing.description || '',
    price: listing.price != null ? `${listing.price} ${listing.currency || '₽'}` : 'Sur demande',
    priceValue: listing.price != null ? Number(listing.price) : null,
    currency: listing.currency || 'RUB',
    category: listing.category || 'Général',
    city: listing.city || null,
    country: listing.country || null,
    authorName: listing.authorName || listing.contactName || null,
    imageUrl: resolvedImg,
    path: `/marketplace/${listing.id}`,
    type: 'listing',
  }
}

export function summarizePost(post) {
  if (!post) return null
  const images = getPostImages(post)
  const resolvedImg = images[0] ? resolveListingImageUrl(images[0]) : null
  const rawText = String(post.text || post.title || '').trim()
  const snippet = rawText.length > 100 ? `${rawText.slice(0, 97)}…` : rawText

  return {
    id: post.id,
    title: post.title || (rawText ? (rawText.length > 60 ? `${rawText.slice(0, 57)}…` : rawText) : 'Article'),
    text: rawText,
    snippet,
    authorName: post.authorName || 'Membre Moxt',
    authorAvatarUrl: post.authorAvatarUrl || null,
    imageUrl: resolvedImg,
    createdAt: post.createdAt || post.updatedAt || null,
    path: `/news?post=${post.id}`,
    type: 'post',
  }
}

export function extractTransferId(question = '') {
  const match = String(question).match(
    /\b(MXT[-_][A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  )
  return match?.[1] || null
}

export function wantsTransfers(question = '') {
  return /transfert|transfer|virement|mandat|paiement|preuve|statut|où en est|ou en est|mon dossier|mxt[-_]|перевод|переводы/i.test(
    question,
  )
}

export function wantsLatestTransfer(question = '') {
  return /dernier transfert|derniers transferts|statut.*transfert|dernier virement|mon dernier envoi|où en est mon transfert|ou en est mon transfert|dernier.*effectue|trouve.*dernier/i.test(
    question,
  )
}

export function wantsExchangers(question = '') {
  return /échangeur|echangeur|changeur|exchanger|taux|change|partenaire|обменник/i.test(question)
}

export function wantsMarketplace(question = '') {
  return /annonce|annonces|marketplace|article|produit|vendre|acheter|prix|achat|vente|iphone|telephone|voiture|appartement|logement|cours|ordinateur|meuble|объявлен/i.test(
    question,
  )
}

export function wantsPosts(question = '') {
  return /article|articles|actualité|actualités|actualite|actualites|news|fil|publication|publications|post|posts|quoi de neuf|nouveauté|nouveaute|стать|новост/i.test(
    question,
  )
}

/**
 * Construit les cartes interactives multimédias pour Moxti (images, badges, prix, liens)
 */
export function buildAssistantCards(contextPack) {
  const cards = []
  if (!contextPack) return cards

  // 1. Dernier transfert ou transfert ciblé
  if (contextPack.focusedTransfer) {
    const t = contextPack.focusedTransfer
    cards.push({
      id: `card-transfer-${t.id}`,
      type: 'transfer',
      title: `Transfert #${t.id}`,
      subtitle: `${t.originCountry || 'Russie'} ➔ ${t.direction || 'Afrique'}`,
      description: t.amount && t.received ? `${t.amount} ➔ ${t.received}` : t.amount || null,
      badgeText: t.statusFriendly || t.status || 'En cours',
      badgeColor:
        t.status === 'completed' || t.status === 'paid_out'
          ? 'emerald'
          : t.status === 'pending_payment'
            ? 'amber'
            : 'brand',
      meta: t.exchanger ? `Partenaire : ${t.exchanger}` : null,
      path: t.path,
      actionLabel: 'Détails du transfert',
    })
  } else if (contextPack.latestTransfer) {
    const t = contextPack.latestTransfer
    cards.push({
      id: `card-transfer-${t.id}`,
      type: 'transfer',
      title: `Dernier transfert #${t.id}`,
      subtitle: `${t.originCountry || 'Russie'} ➔ ${t.direction || 'Afrique'}`,
      description: t.amount && t.received ? `${t.amount} ➔ ${t.received}` : t.amount || null,
      badgeText: t.statusFriendly || t.status || 'En cours',
      badgeColor:
        t.status === 'completed' || t.status === 'paid_out'
          ? 'emerald'
          : t.status === 'pending_payment'
            ? 'amber'
            : 'brand',
      meta: t.exchanger ? `Partenaire : ${t.exchanger}` : null,
      path: t.path,
      actionLabel: 'Détails du transfert',
    })
  }

  // 2. Annonces Marketplace (avec photos réelles)
  for (const item of (contextPack.marketplaceListings || []).slice(0, 4)) {
    cards.push({
      id: `card-listing-${item.id}`,
      type: 'listing',
      title: item.title,
      subtitle: item.city ? `${item.city} · ${item.category}` : item.category,
      description: item.description ? (item.description.length > 80 ? `${item.description.slice(0, 77)}…` : item.description) : null,
      imageUrl: item.imageUrl,
      badgeText: item.price,
      badgeColor: 'brand',
      meta: item.authorName ? `Par ${item.authorName}` : null,
      path: item.path,
      actionLabel: 'Voir l’annonce',
    })
  }

  // 3. Articles / Publications (avec images)
  for (const post of (contextPack.posts || []).slice(0, 4)) {
    cards.push({
      id: `card-post-${post.id}`,
      type: 'post',
      title: post.title,
      subtitle: post.authorName ? `Publié par ${post.authorName}` : 'Actualité Moxt',
      description: post.snippet,
      imageUrl: post.imageUrl,
      badgeText: 'Article',
      badgeColor: 'sky',
      meta: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : null,
      path: post.path,
      actionLabel: 'Lire l’article',
    })
  }

  // 4. Changeurs partenaires
  for (const ex of (contextPack.exchangers || []).slice(0, 3)) {
    cards.push({
      id: `card-exchanger-${ex.id}`,
      type: 'exchanger',
      title: ex.name,
      subtitle: ex.city ? `${ex.city} (${ex.country || 'Russie'})` : ex.country,
      description: ex.feePercent != null ? `Commission : ${ex.feePercent}%` : 'Taux préférentiel',
      imageUrl: ex.avatarUrl,
      badgeText: ex.rating ? `★ ${Number(ex.rating).toFixed(1)}` : 'Vérifié',
      badgeColor: 'amber',
      path: ex.path,
      actionLabel: 'Voir le profil',
    })
  }

  // 5. Emplois & Colis
  for (const job of (contextPack.jobs || []).slice(0, 2)) {
    cards.push({
      id: `card-job-${job.id}`,
      type: 'job',
      title: job.title,
      subtitle: `${job.company} · ${job.city}`,
      description: job.salary ? `Salaire : ${job.salary}` : null,
      badgeText: 'Emploi',
      badgeColor: 'violet',
      path: job.path,
      actionLabel: 'Postuler',
    })
  }

  for (const parcel of (contextPack.parcels || []).slice(0, 2)) {
    cards.push({
      id: `card-parcel-${parcel.id}`,
      type: 'parcel',
      title: `${parcel.origin} ➔ ${parcel.destination}`,
      subtitle: `Dispo : ${parcel.remainingKg} kg`,
      description: parcel.pricePerKg ? `Tarif : ${parcel.pricePerKg}` : null,
      badgeText: 'Colis',
      badgeColor: 'rose',
      path: parcel.path,
      actionLabel: 'Réserver kilos',
    })
  }

  return cards
}

/**
 * @param {{ state: object, question: string, user: object|null, searchIndex: array }} args
 */
export function buildAssistantContextPack({ state, question, user, searchIndex = [] }) {
  const q = String(question || '').trim()
  const qClean = cleanText(q)
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

  // ── 1. Transferts & Dernier transfert ──────────────────────────────────────────
  let transfers = []
  let focusedTransfer = null
  let latestTransfer = null

  if (userId) {
    const visible = selectTransfersVisibleToUser(state, userId)
    if (visible.length > 0) {
      latestTransfer = summarizeTransfer(visible[0])
    }
    const transferId = extractTransferId(q)
    if (transferId) {
      const matched = visible.find((t) => String(t.id).toLowerCase() === transferId.toLowerCase())
      if (matched) focusedTransfer = summarizeTransfer(matched)
    }

    if (wantsTransfers(q) || transferId || wantsLatestTransfer(q)) {
      transfers = visible
        .filter((t) => ACTIVE_TRANSFER_STATUSES.has(t.status) || !focusedTransfer)
        .slice(0, 8)
        .map(summarizeTransfer)
        .filter(Boolean)
    }
  }

  // ── 2. Annonces Marketplace (avec photos) ──────────────────────────────────────
  let marketplaceListings = []
  const allListings = state?.marketplace?.items || []
  if (allListings.length > 0 && (wantsMarketplace(q) || cleanText(q).length > 2)) {
    const queryTokens = qClean.split(/\s+/).filter((w) => w.length > 2)
    const matches = allListings.filter((item) => {
      if (!item || item.status === 'archived' || item.status === 'deleted') return false
      if (!queryTokens.length) return true
      const haystack = cleanText(`${item.title} ${item.description || ''} ${item.category || ''} ${item.city || ''}`)
      return queryTokens.some((tok) => haystack.includes(tok))
    })
    marketplaceListings = (matches.length > 0 ? matches : (wantsMarketplace(q) ? allListings : []))
      .slice(0, 6)
      .map(summarizeListing)
      .filter(Boolean)
  }

  // ── 3. Articles / Publications (avec images) ────────────────────────────────────
  let posts = []
  const allPosts = state?.posts?.items || []
  if (allPosts.length > 0 && (wantsPosts(q) || cleanText(q).length > 2)) {
    const queryTokens = qClean.split(/\s+/).filter((w) => w.length > 2)
    const matches = allPosts.filter((item) => {
      if (!item || item.status === 'archived' || item.status === 'hidden') return false
      if (!queryTokens.length) return true
      const haystack = cleanText(`${item.title || ''} ${item.text || ''} ${item.authorName || ''}`)
      return queryTokens.some((tok) => haystack.includes(tok))
    })
    posts = (matches.length > 0 ? matches : (wantsPosts(q) ? allPosts : []))
      .slice(0, 6)
      .map(summarizePost)
      .filter(Boolean)
  }

  // ── 4. Changeurs partenaires ───────────────────────────────────────────────────
  let exchangers = []
  if (wantsExchangers(q) || /envoyer|transfert|argent/i.test(q)) {
    try {
      const listed = listExchangersForTransfer({
        businesses: state?.businesses?.items || [],
        user,
        includeAllCountries: true,
      })
      exchangers = listed.slice(0, 6).map(summarizeExchanger).filter(Boolean)
    } catch {
      exchangers = []
    }
  }

  // ── 5. Offres d'emploi ─────────────────────────────────────────────────────────
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

  // ── 6. Colis voyageurs ────────────────────────────────────────────────────────
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
  if (transfers.length || focusedTransfer || latestTransfer) toolsUsed.push('list_my_transfers')
  if (focusedTransfer || latestTransfer) toolsUsed.push('get_transfer')
  if (marketplaceListings.length) toolsUsed.push('search_marketplace')
  if (posts.length) toolsUsed.push('search_posts')
  if (exchangers.length) toolsUsed.push('list_exchangers')
  if (jobs.length) toolsUsed.push('list_jobs')
  if (parcels.length) toolsUsed.push('list_parcels')

  const contextPack = {
    toolsUsed,
    searchHits: [...searchHits, ...pageHits].slice(0, 10),
    transfers,
    focusedTransfer,
    latestTransfer,
    marketplaceListings,
    posts,
    exchangers,
    jobs,
    parcels,
  }

  contextPack.cards = buildAssistantCards(contextPack)
  return contextPack
}

export function buildTransferCandidates(contextPack) {
  const out = []
  const focused = contextPack?.focusedTransfer || contextPack?.latestTransfer
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
      label: `Transfert ${transfer.id}${transfer.statusFriendly ? ` (${transfer.statusFriendly})` : ''}`,
      path: transfer.path,
      typeLabel: 'Transfert',
    })
  }
  for (const item of contextPack?.marketplaceListings || []) {
    out.push({
      id: `listing-${item.id}`,
      label: `${item.title} (${item.price})`,
      path: item.path,
      typeLabel: 'Marketplace',
    })
  }
  for (const post of contextPack?.posts || []) {
    out.push({
      id: `post-${post.id}`,
      label: post.title,
      path: post.path,
      typeLabel: 'Article',
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
