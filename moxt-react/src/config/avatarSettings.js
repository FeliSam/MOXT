/**
 * Réglages globaux du module Avatar (admin). Appliqués à tous les utilisateurs.
 * Les valeurs par défaut reproduisent le comportement livré avec l’éditeur (PR #48) :
 * rien ne change tant que l’admin ne touche à rien, même sans ligne en base.
 */

/** Styles « générés » proposés par l’éditeur (la photo perso est un lien à part). */
export const AVATAR_GENERATED_STYLES = ['portrait', 'lorelei']

export const DEFAULT_AVATAR_SETTINGS = Object.freeze({
  /** Portraits photoréalistes de la bibliothèque CDN. */
  portraitEnabled: true,
  /** Avatar illustré DiceBear Lorelei. */
  loreleiEnabled: true,
  /** Lien « Photo à la place » dans l’éditeur. */
  photoEnabled: true,
  /** Onglet ouvert par défaut dans l’éditeur. */
  defaultStyle: 'portrait',
  /** Invitation « Personnaliser mon avatar » à la connexion. */
  promptEnabled: true,
  promptMaxShows: 3,
  promptIntervalHours: 12,
  promptDelaySeconds: 3.5,
  /** Pastille « Avatar » sur les avatars créés avec l’éditeur. */
  badgeEnabled: true,
})

export const AVATAR_SETTINGS_LIMITS = Object.freeze({
  promptMaxShows: { min: 1, max: 10, step: 1 },
  promptIntervalHours: { min: 0, max: 720, step: 1 },
  promptDelaySeconds: { min: 0, max: 30, step: 0.5 },
})

function readBool(raw, key) {
  return raw[key] === undefined || raw[key] === null
    ? DEFAULT_AVATAR_SETTINGS[key]
    : Boolean(raw[key])
}

function readNumber(raw, key, { integer = false } = {}) {
  const { min, max } = AVATAR_SETTINGS_LIMITS[key]
  const value = Number(raw[key])
  if (raw[key] === undefined || raw[key] === null || raw[key] === '' || !Number.isFinite(value)) {
    return DEFAULT_AVATAR_SETTINGS[key]
  }
  const clamped = Math.min(max, Math.max(min, value))
  return integer ? Math.round(clamped) : Math.round(clamped * 10) / 10
}

export function normalizeAvatarSettings(raw = {}) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const next = {
    portraitEnabled: readBool(src, 'portraitEnabled'),
    loreleiEnabled: readBool(src, 'loreleiEnabled'),
    photoEnabled: readBool(src, 'photoEnabled'),
    defaultStyle: AVATAR_GENERATED_STYLES.includes(src.defaultStyle)
      ? src.defaultStyle
      : DEFAULT_AVATAR_SETTINGS.defaultStyle,
    promptEnabled: readBool(src, 'promptEnabled'),
    promptMaxShows: readNumber(src, 'promptMaxShows', { integer: true }),
    promptIntervalHours: readNumber(src, 'promptIntervalHours'),
    promptDelaySeconds: readNumber(src, 'promptDelaySeconds'),
    badgeEnabled: readBool(src, 'badgeEnabled'),
  }
  // Au moins un style actif : sinon on retombe sur le portrait (comportement historique).
  if (!next.portraitEnabled && !next.loreleiEnabled && !next.photoEnabled) {
    next.portraitEnabled = true
  }
  const styles = enabledAvatarStyles(next)
  if (styles.length && !styles.includes(next.defaultStyle)) next.defaultStyle = styles[0]
  return next
}

/** Styles générés actifs, dans l’ordre d’affichage de l’éditeur. */
export function enabledAvatarStyles(settings = DEFAULT_AVATAR_SETTINGS) {
  return AVATAR_GENERATED_STYLES.filter((id) =>
    id === 'portrait' ? settings.portraitEnabled : settings.loreleiEnabled,
  )
}

/**
 * Vue dérivée consommée par l’app (éditeur, invitation, badge).
 * `moduleEnabled` = app_module_flags.avatar (liste « Modules » de l’admin).
 * Module coupé → pas d’éditeur généré, pas d’invitation, pas de badge ;
 * l’upload photo classique (Informations personnelles) reste toujours possible.
 */
export function resolveAvatarModule({ moduleEnabled = true, settings } = {}) {
  const config = normalizeAvatarSettings(settings)
  const enabled = moduleEnabled !== false
  const styles = enabled ? enabledAvatarStyles(config) : []
  const editorAvailable = styles.length > 0
  return {
    enabled,
    settings: config,
    styles,
    editorAvailable,
    defaultStyle: config.defaultStyle,
    photoEnabled: enabled && config.photoEnabled,
    promptEnabled: editorAvailable && config.promptEnabled,
    promptMaxShows: config.promptMaxShows,
    promptIntervalMs: Math.round(config.promptIntervalHours * 60 * 60 * 1000),
    promptDelayMs: Math.round(config.promptDelaySeconds * 1000),
    badgeEnabled: enabled && config.badgeEnabled,
  }
}
