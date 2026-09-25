/**
 * Portraits photoréalistes Moxt (v1) : genre × teint × coiffure = 60 JPEG sur le CDN.
 * Le manifeste est embarqué (copie statique de cdn.moxtapp.ru/avatars/portraits/v1/manifest.json)
 * pour un premier affichage instantané, sans requête réseau.
 */
import manifest from './portraitManifest.v1.json'
import { parseLibraryPortraitUrl } from './portraitLibrary.js'

export const PORTRAIT_MANIFEST = manifest
export const PORTRAIT_VERSION = 1
export const GENDERS = ['f', 'm']
export const TONES = manifest.tones
export const HAIRSTYLES = manifest.hairstyles

const ITEMS_BY_KEY = new Map(
  manifest.items.map((item) => [`${item.gender}|${item.tone}|${item.hair}`, item]),
)
const ITEMS_BY_ID = new Map(manifest.items.map((item) => [item.id, item]))
const TONE_IDS = TONES.map((tone) => tone.id)

export function hairstylesFor(gender) {
  return HAIRSTYLES[gender] || HAIRSTYLES.f
}

/** Portrait exact pour une combinaison (null si absente du manifeste). */
export function findPortrait({ gender, tone, hair } = {}) {
  return ITEMS_BY_KEY.get(`${gender}|${tone}|${hair}`) || null
}

export function findPortraitById(id) {
  return ITEMS_BY_ID.get(id) || null
}

function hashSeed(seed) {
  const s = String(seed || 'moxt')
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Choix valide garanti : corrige genre / teint / coiffure incohérents. */
export function normalizePortraitChoice(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const gender = GENDERS.includes(src.gender) ? src.gender : 'f'
  const tone = TONE_IDS.includes(src.tone) ? src.tone : TONE_IDS[2]
  const hairs = hairstylesFor(gender)
  const hair = hairs.some((h) => h.id === src.hair) ? src.hair : hairs[0].id
  return { gender, tone, hair }
}

/** Valeur par défaut déterministe (même userId → même portrait). */
export function defaultPortraitChoice(userId) {
  const h = hashSeed(String(userId || 'moxt').trim() || 'moxt')
  const gender = GENDERS[h % GENDERS.length]
  const tone = TONE_IDS[Math.floor(h / 2) % TONE_IDS.length]
  const hairs = hairstylesFor(gender)
  const hair = hairs[Math.floor(h / 12) % hairs.length].id
  return { gender, tone, hair }
}

export function randomPortraitChoice({ random = Math.random } = {}) {
  const pick = (list) => list[Math.floor(random() * list.length) % list.length]
  const gender = pick(GENDERS)
  return { gender, tone: pick(TONE_IDS), hair: pick(hairstylesFor(gender)).id }
}

/** Choix correspondant à une URL de portrait (avatar_url existant), sinon null. */
export function choiceFromPortraitUrl(url) {
  const parsed = parseLibraryPortraitUrl(url)
  const item = parsed ? findPortraitById(parsed.id) : null
  return item ? { gender: item.gender, tone: item.tone, hair: item.hair } : null
}

/**
 * Restaure le choix à l’ouverture : avatar_url (s’il s’agit d’un portrait) prime,
 * puis preferences.avatarPortrait, sinon valeur déterministe du userId.
 */
export function initialPortraitChoice({ prefs, avatarUrl, userId } = {}) {
  const fromUrl = choiceFromPortraitUrl(avatarUrl)
  if (fromUrl) return fromUrl
  if (prefs && typeof prefs === 'object' && findPortrait(prefs))
    return normalizePortraitChoice(prefs)
  return defaultPortraitChoice(userId)
}

/** Forme stockée dans profiles.preferences.avatarPortrait. */
export function serializePortraitPreferences(choice) {
  const { gender, tone, hair } = normalizePortraitChoice(choice)
  return { gender, tone, hair, v: PORTRAIT_VERSION }
}

/** Changement de genre : garde la coiffure au même rang. */
export function withGender(choice, gender) {
  const current = normalizePortraitChoice(choice)
  if (current.gender === gender) return current
  const index = Math.max(
    0,
    hairstylesFor(current.gender).findIndex((h) => h.id === current.hair),
  )
  const hairs = hairstylesFor(gender)
  return normalizePortraitChoice({ ...current, gender, hair: hairs[index % hairs.length].id })
}

export function portraitChoiceKey(choice) {
  const { gender, tone, hair } = normalizePortraitChoice(choice)
  return `${gender}|${tone}|${hair}`
}
