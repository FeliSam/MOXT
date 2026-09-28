/**
 * Son du Fil, même règles que moxt-react/src/features/videos/videoFeedAudio.js :
 * son activé par défaut, réglage admin `soundOnByDefault` tant que l'utilisateur
 * n'a pas touché au volume (préférence en mémoire, pas en base).
 */

type Listener = () => void;

let feedMuted = false;
let userOverride = false;
const listeners = new Set<Listener>();

export function getVideoFeedMuted() {
  return feedMuted;
}

export function setVideoFeedMuted(next: boolean, fromUser = true) {
  feedMuted = Boolean(next);
  if (fromUser) userOverride = true;
  listeners.forEach((listener) => listener());
}

export function applyFeedPlaybackDefaults(config: { soundOnByDefault?: boolean } | null | undefined) {
  if (userOverride) return;
  const soundOn = config?.soundOnByDefault !== false;
  feedMuted = !soundOn;
  listeners.forEach((listener) => listener());
}

export function subscribeFeedMuted(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
