import { ASSISTANT_SUGGESTION_KEYS, messagesText } from './messagesI18n'

/** @deprecated Prefer ASSISTANT_SUGGESTION_KEYS + messagesText. Kept for tests/compat. */
export const ASSISTANT_SUGGESTIONS = ASSISTANT_SUGGESTION_KEYS.map((key) =>
  messagesText(null, key),
)

export function assistantSuggestions(t) {
  return ASSISTANT_SUGGESTION_KEYS.map((key) => messagesText(t, key))
}
