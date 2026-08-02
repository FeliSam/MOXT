/**
 * Imperative confirm bridge for non-React helpers (adminActions, etc.).
 * Registered by ConfirmDialogProvider.
 */

let handler = null

export function setConfirmHandler(next) {
  handler = typeof next === 'function' ? next : null
}

/**
 * @param {{ title: string, description?: string, onConfirm: () => void }} opts
 */
export function confirmAction({ title, description = '', onConfirm }) {
  if (typeof onConfirm !== 'function') return
  if (handler) {
    handler({ title, description, onConfirm })
    return
  }
  onConfirm()
}
