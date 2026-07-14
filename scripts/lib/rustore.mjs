/**
 * Auth RuStore Public API (keyId + clé privée RSA → token JWE).
 * Docs : https://www.rustore.ru/help/work-with-rustore-api/api-authorization-token
 *
 * La console RuStore (UI FR) n’envoie parfois pas de fichier .pem : modal « Clé API »
 * avec un blob Base64 PKCS#8 (sans headers PEM). On accepte PEM complet ou Base64 seul.
 */
import { createSign, createPrivateKey } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { root, loadPhase2Env } from './env.mjs'

export const RUSTORE_AUTH_URL = 'https://public-api.rustore.ru/public/auth'
export const DEFAULT_RUSTORE_KEY_PATH = 'scripts/rustore-private-key.pem'
export const DEFAULT_RUSTORE_PACKAGE = 'com.moxt.app'

const PEM_BEGIN = '-----BEGIN PRIVATE KEY-----'
const PEM_END = '-----END PRIVATE KEY-----'

/** Timestamp accepté par RuStore (±60s côté serveur). */
export function rustoreTimestamp(date = new Date()) {
  return date.toISOString().replace('Z', '+00:00')
}

/**
 * Remplit un corps Base64 DER PKCS#8 en PEM PKCS#8.
 * @param {string} base64Body Base64 sans headers (whitespace OK)
 */
export function wrapPkcs8Base64AsPem(base64Body) {
  const compact = String(base64Body).replace(/\s+/g, '')
  if (!compact) throw new Error('Corps Base64 RuStore vide')
  if (!/^[A-Za-z0-9+/]+=*$/.test(compact)) {
    throw new Error('Contenu clé RuStore : Base64 PKCS#8 invalide (caractères non Base64)')
  }
  const lines = compact.match(/.{1,64}/g) || []
  return `${PEM_BEGIN}\n${lines.join('\n')}\n${PEM_END}\n`
}

/**
 * Normalise une clé RuStore (fichier ou env) en PEM utilisable par Node crypto.
 * Accepte :
 * - PEM standard (BEGIN PRIVATE KEY / BEGIN RSA PRIVATE KEY)
 * - Blob Base64 PKCS#8 seul (modal console RuStore), avec ou sans whitespace
 */
export function normalizeRustorePrivateKeyPem(raw) {
  if (raw == null) return null
  const text = String(raw).trim()
  if (!text) return null

  if (text.includes('BEGIN')) {
    return text.includes('\\n') && !text.includes('\n')
      ? text.replace(/\\n/g, '\n')
      : text
  }

  return wrapPkcs8Base64AsPem(text)
}

/**
 * Signature SHA512withRSA (PKCS#1) de `${keyId}${timestamp}`, Base64.
 */
export function signRustoreAuth(keyId, timestamp, privateKeyPem) {
  const pem = normalizeRustorePrivateKeyPem(privateKeyPem)
  if (!pem) throw new Error('Clé privée RuStore vide')
  const key = createPrivateKey(pem)
  const signer = createSign('RSA-SHA512')
  signer.update(`${keyId}${timestamp}`, 'utf8')
  signer.end()
  return signer.sign(key, 'base64')
}

/**
 * Résout le PEM : fichier d’abord (RUSTORE_PRIVATE_KEY_PATH / défaut),
 * sinon repli sur RUSTORE_PRIVATE_KEY dans phase2.env / process.env
 * (pratique si on colle le Base64 dans l’env — préférer quand même le .pem).
 */
export function resolveRustorePrivateKeyPem(env = loadPhase2Env()) {
  const rel = env.RUSTORE_PRIVATE_KEY_PATH || DEFAULT_RUSTORE_KEY_PATH
  const abs = path.isAbsolute(rel) ? rel : path.resolve(root, rel)
  if (existsSync(abs)) {
    return normalizeRustorePrivateKeyPem(readFileSync(abs, 'utf8'))
  }
  const inline = env.RUSTORE_PRIVATE_KEY?.trim()
  if (inline) return normalizeRustorePrivateKeyPem(inline)
  return null
}

/** keyId RuStore réel = court ; un blob PKCS#8 collé par erreur est long / commence par MII. */
export function looksLikeMisfiledRustorePrivateKey(keyId) {
  const v = String(keyId || '').replace(/\s+/g, '')
  return v.length > 200 && /^MII[A-Za-z0-9+/=]+$/.test(v)
}

export function getRustoreConfig(env = loadPhase2Env()) {
  const rel = env.RUSTORE_PRIVATE_KEY_PATH || DEFAULT_RUSTORE_KEY_PATH
  const abs = path.isAbsolute(rel) ? rel : path.resolve(root, rel)
  const fromFile = existsSync(abs)
  const fromEnv = Boolean(env.RUSTORE_PRIVATE_KEY?.trim())
  return {
    keyId: (env.RUSTORE_KEY_ID || '').trim(),
    packageName: (env.RUSTORE_PACKAGE_NAME || DEFAULT_RUSTORE_PACKAGE).trim(),
    privateKeyPath: rel,
    privateKeyPem: resolveRustorePrivateKeyPem(env),
    keySource: fromFile ? rel : fromEnv ? 'RUSTORE_PRIVATE_KEY' : rel,
  }
}

/**
 * Obtient un token JWE (header Public-Token pour les appels suivants).
 * @returns {Promise<{ jwe: string, ttl: number }>}
 */
export async function fetchRustoreAuthToken(env = loadPhase2Env()) {
  const { keyId, privateKeyPem } = getRustoreConfig(env)
  if (!keyId) throw new Error('RUSTORE_KEY_ID manquant dans scripts/phase2.env')
  if (!privateKeyPem) {
    throw new Error(
      `Clé privée RuStore introuvable — fichier ${DEFAULT_RUSTORE_KEY_PATH} (PEM ou Base64) / RUSTORE_PRIVATE_KEY_PATH, ou RUSTORE_PRIVATE_KEY dans phase2.env`,
    )
  }

  // Valide le format avant l’appel HTTP
  try {
    createPrivateKey(privateKeyPem)
  } catch {
    throw new Error(
      'Clé privée RuStore illisible — coller le Base64 de la modal (ou un PEM) dans ' +
        DEFAULT_RUSTORE_KEY_PATH,
    )
  }

  const timestamp = rustoreTimestamp()
  const signature = signRustoreAuth(keyId, timestamp, privateKeyPem)
  const res = await fetch(RUSTORE_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId, timestamp, signature }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.code !== 'OK' || !json.body?.jwe) {
    const detail = json.message || json.code || res.statusText || String(res.status)
    throw new Error(`Auth RuStore échouée : ${detail}`)
  }
  return { jwe: json.body.jwe, ttl: json.body.ttl }
}
