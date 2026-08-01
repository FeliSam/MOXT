import { adminText } from './adminI18n'

/**
 * Prompt for a required rejection reason.
 * @returns {string|null} trimmed note, or null if cancelled / empty
 */
export function promptRejectReason(t, existing = '') {
  if (typeof window === 'undefined') return null
  const raw = window.prompt(adminText(t, 'admin.actions.rejectPrompt'), existing || '')
  if (raw == null) return null
  const reviewNote = String(raw).trim()
  if (!reviewNote) {
    window.alert(adminText(t, 'admin.actions.rejectReasonRequired'))
    return null
  }
  return reviewNote
}
