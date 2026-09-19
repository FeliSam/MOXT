/**
 * RTK `rejectWithValue` fills `action.error.message` with the literal "Rejected".
 * Prefer the payload (real server/client message) and never surface "Rejected" alone.
 */
export function publishListingErrorMessage(action, fallback = "L'annonce n'a pas pu être publiée.") {
  const payload = action?.payload
  if (typeof payload === 'string' && payload.trim() && payload !== 'Rejected') {
    return payload.trim()
  }
  const errMsg = action?.error?.message
  if (typeof errMsg === 'string' && errMsg.trim() && errMsg !== 'Rejected') {
    return errMsg.trim()
  }
  return fallback
}

export function usableErrorMessage(error, fallback) {
  const raw = String(error?.message || '').trim()
  if (raw && raw !== 'Rejected') return raw
  return fallback
}
