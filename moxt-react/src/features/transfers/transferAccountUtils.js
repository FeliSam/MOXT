import { FALLBACK_AFRICAN_COUNTRIES, RUSSIA } from '../../config/geography'
import { DIRECTIONS, PAYMENT_METHODS, paymentMethodsForCountry } from './transferConfig'

export const TRANSFER_ACCOUNT_SLOTS = {
  RU: 'ru',
  ORIGIN: 'origin',
}

const KNOWN_ORIGIN_CODES = new Set(FALLBACK_AFRICAN_COUNTRIES.map((country) => country.code))

/** Codes ISO 2 lettres uniquement — évite country: 1 / index Select / valeurs corrompues. */
export function normalizeTransferCountryCode(value, fallback = 'BJ') {
  const raw = String(value ?? '')
    .trim()
    .toUpperCase()
  if (raw === 'RU') return 'RU'
  if (/^[A-Z]{2}$/.test(raw) && (KNOWN_ORIGIN_CODES.has(raw) || raw === fallback)) {
    return raw
  }
  if (/^[A-Z]{2}$/.test(raw)) return raw
  const safeFallback = String(fallback || 'BJ')
    .trim()
    .toUpperCase()
  return /^[A-Z]{2}$/.test(safeFallback) ? safeFallback : 'BJ'
}

export function isValidTransferCountryCode(value) {
  const raw = String(value ?? '')
    .trim()
    .toUpperCase()
  return raw === 'RU' || /^[A-Z]{2}$/.test(raw)
}

export function inferTransferAccountSlot(country) {
  return normalizeTransferCountryCode(country, 'BJ') === 'RU'
    ? TRANSFER_ACCOUNT_SLOTS.RU
    : TRANSFER_ACCOUNT_SLOTS.ORIGIN
}

export function receivingSlotForDirection(direction) {
  return direction === DIRECTIONS.RU_TO_BJ
    ? TRANSFER_ACCOUNT_SLOTS.RU
    : TRANSFER_ACCOUNT_SLOTS.ORIGIN
}

export function receivingCountryForDirection(direction, originCountry = 'BJ') {
  return direction === DIRECTIONS.RU_TO_BJ
    ? 'RU'
    : normalizeTransferCountryCode(originCountry, 'BJ')
}

export function payoutSlotForDirection(direction) {
  return direction === DIRECTIONS.RU_TO_BJ
    ? TRANSFER_ACCOUNT_SLOTS.ORIGIN
    : TRANSFER_ACCOUNT_SLOTS.RU
}

export function payoutCountryForDirection(direction, originCountry = 'BJ') {
  return direction === DIRECTIONS.RU_TO_BJ
    ? normalizeTransferCountryCode(originCountry, 'BJ')
    : 'RU'
}

function methodsEqual(left, right) {
  return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase()
}

function accountMethodLabel(account) {
  return String(account?.method || account?.bankName || '').trim()
}

export function accountsForCountry(accounts = [], country, originCountry = 'BJ') {
  const target = normalizeTransferCountryCode(country, originCountry)
  const slot = inferTransferAccountSlot(target)
  return (accounts || []).filter((account) => {
    if (account.active === false) return false
    const accountSlot = account.slot || inferTransferAccountSlot(account.country, originCountry)
    const accountCountry = normalizeTransferCountryCode(
      account.country,
      accountSlot === TRANSFER_ACCOUNT_SLOTS.RU ? 'RU' : originCountry,
    )
    return accountSlot === slot || accountCountry === target
  })
}

function uniqueAccountMethods(accounts = []) {
  const seen = new Set()
  const methods = []
  for (const account of accounts) {
    const method = accountMethodLabel(account)
    const key = method.toLowerCase()
    if (!method || seen.has(key)) continue
    seen.add(key)
    methods.push(method)
  }
  return methods
}

/**
 * Moyens proposés au client pour un côté (envoi vers l'échangeur ou réception).
 * Afrique : uniquement les réseaux dont l'échangeur a un compte actif.
 * Russie : méthodes des comptes RU s'ils sont renseignés, sinon le catalogue banques.
 */
export function exchangerMethodsForParty({
  business,
  country,
  originCountry = 'BJ',
} = {}) {
  const target = normalizeTransferCountryCode(country, originCountry)
  const catalog = paymentMethodsForCountry(target)
  const accounts = accountsForCountry(business?.transferAccounts, target, originCountry)
  const fromAccounts = uniqueAccountMethods(accounts)
  const declared = (business?.exchangeMethods || business?.paymentMethods || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  if (target === 'RU') {
    if (fromAccounts.length) return fromAccounts
    const declaredRu = declared.filter(
      (method) =>
        catalog.some((item) => methodsEqual(item, method)) ||
        PAYMENT_METHODS.RU.some((item) => methodsEqual(item, method)),
    )
    if (declaredRu.length) return declaredRu
    return catalog
  }

  if (fromAccounts.length) return fromAccounts
  const declaredLocal = declared.filter((method) =>
    catalog.some((item) => methodsEqual(item, method)),
  )
  if (declaredLocal.length) return declaredLocal
  return catalog
}

export function resolveBusinessAccountForMethod(
  accounts = [],
  country,
  originCountry = 'BJ',
  method = '',
) {
  const pool = accountsForCountry(accounts, country, originCountry)
  if (!pool.length) return null
  const wanted = String(method || '').trim()
  if (wanted) {
    const matched = pool.filter((account) => methodsEqual(accountMethodLabel(account), wanted))
    if (matched.length) {
      return matched.find((account) => account.isDefault) || matched[0]
    }
  }
  return pool.find((account) => account.isDefault) || pool[0] || null
}

export function countryLabel(code) {
  const normalized = normalizeTransferCountryCode(code, code)
  if (normalized === 'RU') return RUSSIA.name
  return FALLBACK_AFRICAN_COUNTRIES.find((country) => country.code === normalized)?.name || normalized
}

export function transferAccountSlotMeta(slot, originCountry = 'BJ') {
  const safeOrigin = normalizeTransferCountryCode(originCountry, 'BJ')
  if (slot === TRANSFER_ACCOUNT_SLOTS.RU) {
    return {
      slot,
      country: 'RU',
      title: 'Compte Russie',
      directionHint: 'Russie → Afrique',
      activeForDirection: DIRECTIONS.RU_TO_BJ,
    }
  }
  const countryName = countryLabel(safeOrigin)
  return {
    slot: TRANSFER_ACCOUNT_SLOTS.ORIGIN,
    country: safeOrigin,
    title: `Compte ${countryName}`,
    directionHint: 'Afrique → Russie',
    activeForDirection: DIRECTIONS.BJ_TO_RU,
  }
}

export function resolveBusinessReceivingAccount(accounts = [], direction, originCountry = 'BJ', options = {}) {
  const slot = receivingSlotForDirection(direction)
  const country = receivingCountryForDirection(direction, originCountry)
  const method = options?.method
  const pool = (accounts || []).filter((account) => account.active !== false)
  const slotAccounts = pool.filter((account) => {
    const accountSlot = account.slot || inferTransferAccountSlot(account.country, originCountry)
    return accountSlot === slot || account.country === country
  })

  if (method) {
    const matched = slotAccounts.filter((account) =>
      methodsEqual(accountMethodLabel(account), method),
    )
    if (matched.length) {
      return matched.find((account) => account.isDefault) || matched[0]
    }
  }

  return (
    slotAccounts.find((account) => account.isDefault) ||
    slotAccounts.find((account) => account.slot === slot) ||
    slotAccounts[0] ||
    pool.find((account) => account.slot === slot) ||
    pool.find((account) => inferTransferAccountSlot(account.country, originCountry) === slot) ||
    pool.find((account) => account.country === country) ||
    null
  )
}

export function accountsForSlot(accounts = [], slot, originCountry = 'BJ') {
  return (accounts || []).filter((account) => {
    const accountSlot = account.slot || inferTransferAccountSlot(account.country, originCountry)
    return accountSlot === slot
  })
}

export function setDefaultTransferAccount(accounts = [], accountId, originCountry = 'BJ') {
  const target = accounts.find((account) => account.id === accountId)
  if (!target) return accounts
  const slot = target.slot || inferTransferAccountSlot(target.country, originCountry)
  return accounts.map((account) => {
    const accountSlot = account.slot || inferTransferAccountSlot(account.country, originCountry)
    if (accountSlot !== slot) return account
    return { ...account, isDefault: account.id === accountId }
  })
}

export function addTransferAccount(accounts = [], account, originCountry = 'BJ') {
  const slot = account.slot || inferTransferAccountSlot(account.country, originCountry)
  const meta = transferAccountSlotMeta(slot, originCountry)
  const normalized = {
    ...account,
    slot,
    country: meta.country,
    active: account.active !== false,
    isDefault: account.isDefault === true,
  }
  const next = [...accounts, normalized]
  return normalized.isDefault ? setDefaultTransferAccount(next, normalized.id, originCountry) : next
}

export function formatReceivingAccountSummary(account) {
  if (!account) return ''
  return [
    account.recipientName,
    account.phone || account.accountNumber,
    account.method || account.bankName,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function buildExchangerPaymentView(business, direction, originCountry = 'BJ', options = {}) {
  const paymentDetails = resolveBusinessReceivingAccount(
    business?.transferAccounts,
    direction,
    originCountry,
    options,
  )
  const paymentAccount =
    formatReceivingAccountSummary(paymentDetails) ||
    "Coordonnées à compléter dans l'espace professionnel"

  return { paymentAccount, paymentDetails }
}

export function upsertTransferAccountForSlot(accounts = [], slot, account, originCountry = 'BJ') {
  const meta = transferAccountSlotMeta(slot, originCountry)
  const normalized = {
    ...account,
    slot,
    country: meta.country,
    active: account.active !== false,
    isDefault: true,
  }
  const filtered = accounts.filter((item) => {
    const itemSlot = item.slot || inferTransferAccountSlot(item.country, originCountry)
    return itemSlot !== slot
  })
  return setDefaultTransferAccount([normalized, ...filtered], normalized.id, originCountry)
}
