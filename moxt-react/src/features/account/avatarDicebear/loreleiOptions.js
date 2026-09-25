/**
 * Lorelei (DiceBear 9.x) — catalogues d’options, persistance et valeurs par défaut
 * stables (seed = userId). Aucun appel réseau : tout est rendu côté client.
 */

export const LORELEI_STYLE = 'lorelei'

/** Teints inclusifs (hex sans #). */
export const SKIN_COLORS = [
  'ffdbb4',
  'f2d3b1',
  'edb98a',
  'e0ac69',
  'd08b5b',
  'c68642',
  'ae5d29',
  '8d5524',
  '6b3f2a',
  '614335',
  '4a2c1a',
  '3b2219',
]

export const HAIR_COLORS = [
  '0a0a0a',
  '2c1b18',
  '4a3728',
  '6b4423',
  'a55728',
  'b58143',
  'd6b370',
  'e8d5b7',
  '7f8c8d',
  'c0392b',
  '8e44ad',
  '1a5276',
  '117a65',
  'f5b041',
]

/** Fonds : transparent + teintes douces compatibles clair / sombre. */
export const BACKGROUND_COLORS = [
  'transparent',
  'e8f3f0',
  'f3efe6',
  'e7ecf5',
  'f5e6ea',
  'ede7f6',
  'fff4d6',
  '12bfa3',
  '1f2937',
]

/** Sous-ensemble premium de coiffures (le schéma Lorelei en compte 48). */
export const HAIR_VARIANTS = [
  'variant01',
  'variant04',
  'variant07',
  'variant10',
  'variant13',
  'variant16',
  'variant19',
  'variant22',
  'variant25',
  'variant28',
  'variant31',
  'variant34',
  'variant37',
  'variant40',
  'variant43',
  'variant46',
]

export const EYE_VARIANTS = [
  'variant01',
  'variant04',
  'variant07',
  'variant10',
  'variant13',
  'variant16',
  'variant19',
  'variant22',
]

export const GLASSES_VARIANTS = ['variant01', 'variant02', 'variant03', 'variant04', 'variant05']

export const EARRINGS_VARIANTS = ['variant01', 'variant02', 'variant03']

const HEX_RE = /^(transparent|[a-fA-F0-9]{6})$/
const VARIANT_RE = /^[a-z]+[0-9]{2}$/

function hashSeed(seed) {
  const s = String(seed || 'moxt')
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick(list, hash, salt = 0) {
  return list[(hash + salt) % list.length]
}

function firstOf(value) {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

function cleanColor(value, fallback) {
  const raw = String(firstOf(value) || '')
    .trim()
    .replace(/^#/, '')
  return HEX_RE.test(raw) ? raw.toLowerCase() : fallback
}

function cleanVariant(value, allowed, fallback) {
  const raw = String(firstOf(value) || '').trim()
  if (!VARIANT_RE.test(raw)) return fallback
  return allowed.includes(raw) ? raw : fallback
}

/**
 * Forme canonique utilisée par l’UI : valeurs scalaires + booléens d’accessoires.
 */
export function normalizeLoreleiOptions(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const seed = String(src.seed || 'moxt').trim() || 'moxt'
  const glassesOn = Boolean(src.glassesOn ?? Number(src.glassesProbability) > 0)
  const earringsOn = Boolean(src.earringsOn ?? Number(src.earringsProbability) > 0)
  return {
    seed,
    skinColor: cleanColor(src.skinColor, SKIN_COLORS[1]),
    hair: cleanVariant(src.hair, HAIR_VARIANTS, HAIR_VARIANTS[0]),
    hairColor: cleanColor(src.hairColor, HAIR_COLORS[1]),
    eyes: cleanVariant(src.eyes, EYE_VARIANTS, EYE_VARIANTS[0]),
    glasses: cleanVariant(src.glasses, GLASSES_VARIANTS, GLASSES_VARIANTS[0]),
    earrings: cleanVariant(src.earrings, EARRINGS_VARIANTS, EARRINGS_VARIANTS[0]),
    glassesOn,
    earringsOn,
    backgroundColor: cleanColor(src.backgroundColor, BACKGROUND_COLORS[1]),
  }
}

/** Valeurs par défaut stables à la première ouverture (seed = userId). */
export function defaultLoreleiOptions(userId) {
  const seed = String(userId || 'moxt').trim() || 'moxt'
  const h = hashSeed(seed)
  return normalizeLoreleiOptions({
    seed,
    skinColor: pick(SKIN_COLORS, h, 1),
    hair: pick(HAIR_VARIANTS, h, 3),
    hairColor: pick(HAIR_COLORS.slice(0, 8), h, 5),
    eyes: pick(EYE_VARIANTS, h, 7),
    glassesOn: false,
    earringsOn: false,
    backgroundColor: BACKGROUND_COLORS[1],
  })
}

/** Tirage aléatoire (conserve le seed pour les détails non exposés). */
export function randomizeLoreleiOptions(current = {}, { random = Math.random } = {}) {
  const base = normalizeLoreleiOptions(current)
  const r = (list) => list[Math.floor(random() * list.length) % list.length]
  return normalizeLoreleiOptions({
    ...base,
    skinColor: r(SKIN_COLORS),
    hair: r(HAIR_VARIANTS),
    hairColor: r(HAIR_COLORS),
    eyes: r(EYE_VARIANTS),
    glasses: r(GLASSES_VARIANTS),
    earrings: r(EARRINGS_VARIANTS),
    glassesOn: random() < 0.25,
    earringsOn: random() < 0.25,
    backgroundColor: r(BACKGROUND_COLORS.slice(1)),
  })
}

/** Forme compacte stockée dans profiles.preferences.avatarDicebear. */
export function serializeLoreleiPreferences(options, { avatarUrl = '', now = new Date() } = {}) {
  const o = normalizeLoreleiOptions(options)
  return {
    style: LORELEI_STYLE,
    version: 9,
    seed: o.seed,
    skinColor: o.skinColor,
    hair: o.hair,
    hairColor: o.hairColor,
    eyes: o.eyes,
    glasses: o.glasses,
    earrings: o.earrings,
    glassesOn: o.glassesOn,
    earringsOn: o.earringsOn,
    backgroundColor: o.backgroundColor,
    avatarUrl: avatarUrl || '',
    updatedAt: now.toISOString(),
  }
}

/** Restaure les options de l’éditeur depuis les préférences (ou défauts du seed). */
export function preferencesToLoreleiOptions(prefs, userId) {
  if (!prefs || typeof prefs !== 'object' || prefs.style !== LORELEI_STYLE) {
    return defaultLoreleiOptions(userId)
  }
  return normalizeLoreleiOptions({ ...prefs, seed: prefs.seed || userId })
}

/** Options DiceBear createAvatar (tableaux + probabilités). */
export function toCreateAvatarOptions(options, { size = 256 } = {}) {
  const o = normalizeLoreleiOptions(options)
  return {
    seed: o.seed,
    size,
    skinColor: [o.skinColor],
    hair: [o.hair],
    hairColor: [o.hairColor],
    eyes: [o.eyes],
    glasses: [o.glasses],
    glassesProbability: o.glassesOn ? 100 : 0,
    earrings: [o.earrings],
    earringsProbability: o.earringsOn ? 100 : 0,
    // Détails non exposés : figés pour un rendu stable (pas de barbe/taches aléatoires).
    beardProbability: 0,
    frecklesProbability: 0,
    hairAccessoriesProbability: 0,
    backgroundColor: [o.backgroundColor],
  }
}

/** Clé d’égalité pour détecter les changements non enregistrés. */
export function loreleiOptionsKey(options) {
  const o = normalizeLoreleiOptions(options)
  return [
    o.seed,
    o.skinColor,
    o.hair,
    o.hairColor,
    o.eyes,
    o.glassesOn ? o.glasses : '-',
    o.earringsOn ? o.earrings : '-',
    o.backgroundColor,
  ].join('|')
}
