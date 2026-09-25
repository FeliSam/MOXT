/**
 * Textes et réglages des modales de confirmation de « Mes publications ».
 * Pur (sans React) pour pouvoir être testé et réutilisé.
 */

const ARROW = '\u2192'

/** Actions irréversibles → bouton rouge ; les autres utilisent l'accent du contexte. */
export const DANGER_PUBLICATION_ACTIONS = new Set(['delete'])

export const PUBLICATION_CONFIRM_ACTIONS = [
  'delete',
  'archive',
  'republish',
  'duplicate',
  'markSold',
  'boost',
]

export const SUBSCRIPTION_CONFIRM_ACTIONS = [
  'unsubscribe',
  'notifyPref',
  'blockMessages',
  'unblockMessages',
  'unban',
  'removeSubscriber',
]

function clip(value, max = 80) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}\u2026`
}

/** Nom lisible de la publication concernée (affiché dans la modale). */
export function publicationConfirmSubject(type, item) {
  if (!item) return ''
  if (type === 'parcel') {
    const route = [item.origin, item.destination].filter(Boolean).join(` ${ARROW} `)
    return clip(route || item.title || item.id)
  }
  if (type === 'other') {
    const pair = [item.fromCurrency, item.toCurrency].filter(Boolean).join(` ${ARROW} `)
    const amount = item.amount != null && item.fromCurrency ? `${item.amount} ${item.fromCurrency}` : ''
    return clip([amount, pair].filter(Boolean).join(' \u00b7 ') || item.title || item.id)
  }
  if (type === 'post') return clip(item.message || item.title || item.id)
  return clip(item.title || item.name || item.message || item.id)
}

/** Accent de la modale : vert pour une publication entreprise, prune pour le profil perso. */
export function publicationConfirmAccent(item, scope) {
  if (scope === 'business' || item?.businessId || item?.publisherType === 'business') return 'business'
  return 'personal'
}

function tr(t, key, vars, fallback) {
  const value = typeof t === 'function' ? t(key, vars) : null
  return value && value !== key ? value : fallback
}

/**
 * Options prêtes pour `confirm()` / `ConfirmDialog` pour une action sur une publication.
 * @param {'delete'|'archive'|'republish'|'duplicate'|'markSold'|'boost'} action
 */
export function buildPublicationConfirm(t, action, { type, item, scope, duration } = {}) {
  const base = `confirmDialog.publication.${action}`
  const description =
    action === 'delete' && type === 'listing'
      ? tr(t, `${base}.descriptionListing`, {}, '')
      : tr(t, `${base}.description`, { duration: duration || '' }, '')
  return {
    title: tr(t, `${base}.title`, {}, action),
    description,
    confirmLabel: tr(t, `${base}.confirm`, {}, action),
    subject: publicationConfirmSubject(type, item),
    subjectLabel: tr(t, 'confirmDialog.subjectLabel', {}, ''),
    tone: DANGER_PUBLICATION_ACTIONS.has(action) ? 'danger' : 'accent',
    accent: publicationConfirmAccent(item, scope),
  }
}

/**
 * Options pour une action d'abonnement (onglet Abonnements de la page).
 * @param {'unsubscribe'|'notifyPref'|'blockMessages'|'unblockMessages'|'unban'} action
 */
export function buildSubscriptionConfirm(t, action, { name = '', pref = '', accent = 'personal' } = {}) {
  const base = `confirmDialog.subscription.${action}`
  return {
    title: tr(t, `${base}.title`, { name }, action),
    description: tr(t, `${base}.description`, { name, pref }, ''),
    confirmLabel: tr(t, `${base}.confirm`, {}, action),
    subject: name || undefined,
    tone: 'accent',
    accent,
  }
}

/** Attend le résultat d'un dispatch (thunk RTK → unwrap, promesse, ou action synchrone). */
export async function settleDispatchResult(result) {
  if (result && typeof result.unwrap === 'function') return result.unwrap()
  if (result && typeof result.then === 'function') return result
  return result
}