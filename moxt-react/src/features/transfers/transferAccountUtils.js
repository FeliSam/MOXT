import { FALLBACK_AFRICAN_COUNTRIES, RUSSIA } from '../../config/geography'
import { DIRECTIONS } from './transferConfig'

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

export function resolveBusinessReceivingAccount(accounts = [], direction, originCountry = 'BJ') {
  const slot = receivingSlotForDirection(direction)
  const country = receivingCountryForDirection(direction, originCountry)
  const pool = (accounts || []).filter((account) => account.active !== false)
  const slotAccounts = pool.filter((account) => {
    const accountSlot = account.slot || inferTransferAccountSlot(account.country, originCountry)
    return accountSlot === slot || account.country === country
  })

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

export function buildExchangerPaymentView(business, direction, originCountry = 'BJ') {
  const paymentDetails = resolveBusinessReceivingAccount(
    business?.transferAccounts,
    direction,
    originCountry,
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
