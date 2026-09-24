/** Réglages globaux du Fil vidéo (admin). Appliqués à tous les utilisateurs. */

export const DEFAULT_FEED_PLAYBACK = {
  /** Son activé par défaut (unmuted). Les navigateurs peuvent forcer muet puis on réessaie. */
  soundOnByDefault: true,
  /**
   * Tap sur la vidéo en lecture → pause + overlay play.
   * Si false : tap bascule le mute (ancien comportement).
   */
  tapPausesVideo: true,
}

export function normalizeFeedPlaybackConfig(raw = {}) {
  return {
    soundOnByDefault:
      raw.soundOnByDefault === undefined ? DEFAULT_FEED_PLAYBACK.soundOnByDefault : Boolean(raw.soundOnByDefault),
    tapPausesVideo:
      raw.tapPausesVideo === undefined ? DEFAULT_FEED_PLAYBACK.tapPausesVideo : Boolean(raw.tapPausesVideo),
  }
}
