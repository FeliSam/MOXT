# Fil — son & lecture (défauts)

## Son ON par défaut

- `videoFeedAudio.js` initialise `feedMuted = false`.
- `useFeedVideoPlayback` tente d’abord l’autoplay **avec** le mute global (donc unmuted si défaut ON).
- Si le navigateur bloque (souvent iOS Safari sans geste), le hook **rejoue en muet et y reste** jusqu’à un tap sur le bouton volume (unmute = geste utilisateur). Ne pas forcer `muted = false` juste après le fallback : cela coupe la lecture et affiche l’overlay play.
- La slide synchronise un `policyMuted` local pour que l’attribut React `muted` reste aligné avec l’élément (sinon React ré-applique unmuted et bloque l’autoplay).
- L’utilisateur peut toujours couper/réactiver le son via le bouton volume (override local de session).
- L’admin peut forcer le muet global via `app_feed_playback.soundOnByDefault` (Admin → Fil vidéo).

## Autoplay au swipe

- Slide active : `autoPlay` + `play()` via le hook (watchdog si media ready mais paused).
- Devenir active (snap suivant / retour) réinitialise la pause utilisateur et relance la lecture ; la précédente est pausée.
- Tap-to-pause (`tapPausesVideo`) reste disponible, mais l’état initial / actif doit être en lecture.

## Tap = pause + overlay play

- Si `tapPausesVideo` (défaut `true`) : tap sur la vidéo en lecture → pause + bouton play centré ; tap / play → reprise.
- Si `false` : tap bascule le mute (ancien comportement).
- Le bouton volume reste indépendant.

## Stockage admin

Table publique `app_feed_playback` (id=1, jsonb `config`), lecture anon/authenticated, écriture via RPC `admin_update_app_feed_playback` (même pattern que `app_store_locales`).
