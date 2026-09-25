/**
 * Invitation « Personnaliser mon avatar » à la connexion — logique pure + miroirs locaux.
 *
 * Règles : jamais si l’utilisateur a déjà un avatar (photo, portrait, illustré) ou si l’invitation
 * est marquée `done` ; au plus 3 affichages ; jamais deux fois dans la même session ; au moins
 * 12 h entre deux affichages (nouvelle connexion). État serveur : preferences.avatarPrompt
 * = { shown, lastShownAt, done } ; miroir localStorage pour éviter le flash avant hydratation.
 * Le maximum, l’intervalle et l’activation sont réglables dans l’admin (module Avatar) ;
 * les constantes ci-dessous restent les valeurs par défaut.
 */

export const AVATAR_PROMPT_MAX = 3
export const AVATAR_PROMPT_INTERVAL_MS = 12 * 60 * 60 * 1000
const LOCAL_PREFIX = 'moxt-avatar-prompt:'
const SESSION_PREFIX = 'moxt-avatar-prompt-session:'

export function normalizePromptState(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const shown = Number.isFinite(Number(src.shown)) ? Math.max(0, Math.floor(Number(src.shown))) : 0
  const time = src.lastShownAt ? Date.parse(src.lastShownAt) : Number.NaN
  return {
    shown,
    lastShownAt: Number.isFinite(time) ? new Date(time).toISOString() : null,
    done: Boolean(src.done),
  }
}

/** Fusion serveur + local : le plus avancé l’emporte (compteur max, date la plus récente, done). */
export function mergePromptStates(...states) {
  return states.map(normalizePromptState).reduce(
    (acc, s) => ({
      shown: Math.max(acc.shown, s.shown),
      lastShownAt:
        !acc.lastShownAt ||
        (s.lastShownAt && Date.parse(s.lastShownAt) > Date.parse(acc.lastShownAt))
          ? s.lastShownAt || acc.lastShownAt
          : acc.lastShownAt,
      done: acc.done || s.done,
    }),
    { shown: 0, lastShownAt: null, done: false },
  )
}

/** Avatar déjà personnalisé : avatar_url présent ou portrait / illustré enregistré. */
export function hasCustomAvatar({ user, prefs } = {}) {
  if (user?.avatarUrl) return true
  if (prefs?.avatarPortrait) return true
  return Boolean(prefs?.avatarDicebear?.avatarUrl)
}

export function shouldShowAvatarPrompt({
  user,
  prefs,
  state,
  now = Date.now(),
  shownThisSession = false,
  blocked = false,
  enabled = true,
  maxShows = AVATAR_PROMPT_MAX,
  intervalMs = AVATAR_PROMPT_INTERVAL_MS,
} = {}) {
  if (!enabled || !user?.id || blocked || shownThisSession) return false
  if (hasCustomAvatar({ user, prefs })) return false
  const s = normalizePromptState(state)
  if (s.done || s.shown >= maxShows) return false
  if (s.lastShownAt && now - Date.parse(s.lastShownAt) < intervalMs) return false
  return true
}

export function recordPromptShown(state, now = Date.now()) {
  const s = normalizePromptState(state)
  return { ...s, shown: s.shown + 1, lastShownAt: new Date(now).toISOString() }
}

export function recordPromptDone(state) {
  return { ...normalizePromptState(state), done: true }
}

function safeStorage(kind) {
  try {
    return typeof window !== 'undefined' ? window[kind] : null
  } catch {
    return null
  }
}

export function readLocalPromptState(userId) {
  const store = safeStorage('localStorage')
  if (!userId || !store) return normalizePromptState(null)
  try {
    return normalizePromptState(JSON.parse(store.getItem(`${LOCAL_PREFIX}${userId}`) || 'null'))
  } catch {
    return normalizePromptState(null)
  }
}

export function writeLocalPromptState(userId, state) {
  const store = safeStorage('localStorage')
  if (!userId || !store) return
  try {
    store.setItem(`${LOCAL_PREFIX}${userId}`, JSON.stringify(normalizePromptState(state)))
  } catch {
    /* quota / mode privé */
  }
}

export function wasPromptShownThisSession(userId) {
  const store = safeStorage('sessionStorage')
  try {
    return Boolean(userId && store?.getItem(`${SESSION_PREFIX}${userId}`) === '1')
  } catch {
    return false
  }
}

export function markPromptShownThisSession(userId) {
  const store = safeStorage('sessionStorage')
  try {
    if (userId) store?.setItem(`${SESSION_PREFIX}${userId}`, '1')
  } catch {
    /* ignore */
  }
}

/** QA : efface les miroirs locaux (l’état serveur est remis à zéro par l’appelant). */
export function clearLocalPromptState(userId) {
  try {
    safeStorage('localStorage')?.removeItem(`${LOCAL_PREFIX}${userId}`)
    safeStorage('sessionStorage')?.removeItem(`${SESSION_PREFIX}${userId}`)
  } catch {
    /* ignore */
  }
}

/** Préférences à fusionner quand un avatar est enregistré (portrait, illustré ou photo). */
export function promptDonePreferences(userId, serverState) {
  const next = recordPromptDone(mergePromptStates(serverState, readLocalPromptState(userId)))
  writeLocalPromptState(userId, next)
  return { avatarPrompt: next }
}
