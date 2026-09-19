/**
 * Session Fil (module) : survit à la navigation hors /feed sans recharger
 * l’ordre ni la position au retour dans la même session d’onglet.
 */

const STORAGE_KEY = 'moxt-feed-session-v1'

function readStorage() {
  if (typeof sessionStorage === 'undefined') return null
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

function writeStorage(partial) {
  if (typeof sessionStorage === 'undefined') return
  try {
    const prev = readStorage() || {}
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...partial }))
  } catch {
    // quota / mode privé
  }
}

let memory = {
  suggestionSalt: '',
  lastItemId: '',
  lastLogicalIndex: 0,
}

const stored = readStorage()
if (stored?.suggestionSalt) {
  memory = {
    suggestionSalt: String(stored.suggestionSalt),
    lastItemId: String(stored.lastItemId || ''),
    lastLogicalIndex: Number(stored.lastLogicalIndex) || 0,
  }
}

export function getFeedSuggestionSalt() {
  if (!memory.suggestionSalt) {
    memory.suggestionSalt = String(Date.now())
    writeStorage({ suggestionSalt: memory.suggestionSalt })
  }
  return memory.suggestionSalt
}

/** Nouveau parcours (pull-to-refresh / reshuffle explicite). */
export function rotateFeedSuggestionSalt() {
  memory.suggestionSalt = String(Date.now())
  memory.lastItemId = ''
  memory.lastLogicalIndex = 0
  writeStorage({
    suggestionSalt: memory.suggestionSalt,
    lastItemId: '',
    lastLogicalIndex: 0,
  })
  return memory.suggestionSalt
}

export function rememberFeedPosition({ itemId = '', logicalIndex = 0 } = {}) {
  memory.lastItemId = itemId ? String(itemId) : ''
  memory.lastLogicalIndex = Math.max(0, Number(logicalIndex) || 0)
  writeStorage({
    lastItemId: memory.lastItemId,
    lastLogicalIndex: memory.lastLogicalIndex,
  })
}

export function readFeedPosition() {
  return {
    itemId: memory.lastItemId || '',
    logicalIndex: memory.lastLogicalIndex || 0,
  }
}
