import { FALLBACK_AFRICAN_COUNTRIES, RUSSIA } from '../../config/geography'
import { DIRECTIONS } from './transferConfig'

export const TRANSFER_ACCOUNT_SLOTS = {
  RU: 'ru',
  ORIGIN: 'origin',
}

export function inferTransferAccountSlot(country, originCountry = 'BJ') {
  return country === 'RU' ? TRANSFER_ACCOUNT_SLOTS.RU : TRANSFER_ACCOUNT_SLOTS.ORIGIN
}

export function receivingSlotForDirection(direction) {
  return direction === DIRECTIONS.RU_TO_BJ
    ? TRANSFER_ACCOUNT_SLOTS.RU
    : TRANSFER_ACCOUNT_SLOTS.ORIGIN
}

export function receivingCountryForDirection(direction, originCountry = 'BJ') {
  return direction === DIRECTIONS.RU_TO_BJ ? 'RU' : originCountry
}

export function countryLabel(code) {
  if (code === 'RU') return RUSSIA.name
  return FALLBACK_AFRICAN_COUNTRIES.find((country) => country.code === code)?.name || code
}

export function transferAccountSlotMeta(slot, originCountry = 'BJ') {
  if (slot === TRANSFER_ACCOUNT_SLOTS.RU) {
    return {
      slot,
      country: 'RU',
      title: 'Compte Russie',
      directionHint: 'Russie → Afrique',
      activeForDirection: DIRECTIONS.RU_TO_BJ,
    }
  }
  const countryName = countryLabel(originCountry)
  return {
    slot: TRANSFER_ACCOUNT_SLOTS.ORIGIN,
    country: originCountry,
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
