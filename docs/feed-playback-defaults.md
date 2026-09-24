# Fil — son & lecture (défauts)

## Son ON par défaut

- `videoFeedAudio.js` initialise `feedMuted = false`.
- `useFeedVideoPlayback` tente d’abord l’autoplay **avec** le mute global (donc unmuted si défaut ON).
- Si le navigateur bloque (souvent iOS Safari sans geste), le hook **rejoue en muet**, puis tente `muted = false` juste après `play()` réussi.
- L’utilisateur peut toujours couper/réactiver le son via le bouton volume (override local de session).
- L’admin peut forcer le muet global via `app_feed_playback.soundOnByDefault` (Admin → Fil vidéo).

## Tap = pause + overlay play

- Si `tapPausesVideo` (défaut `true`) : tap sur la vidéo en lecture → pause + bouton play centré ; tap / play → reprise.
- Si `false` : tap bascule le mute (ancien comportement).
- Le bouton volume reste indépendant.

## Stockage admin

Table publique `app_feed_playback` (id=1, jsonb `config`), lecture anon/authenticated, écriture via RPC `admin_update_app_feed_playback` (même pattern que `app_store_locales`).
