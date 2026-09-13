/**
 * APNs HTTP/2 — Capacitor iOS fournit un jeton APNs (hex), pas un jeton FCM.
 */
import { SignJWT, importPKCS8 } from 'npm:jose@5'

type NativePushPayload = {
  title: string
  body: string
  data?: Record<string, unknown>
}

let cachedJwt: { value: string; expiresAt: number } | null = null

export function isLikelyApnsDeviceToken(token: string) {
  const value = String(token || '').replace(/\s/g, '')
  if (!value || value.includes(':') || value.includes('-')) return false
  return /^[0-9a-fA-F]{64,200}$/.test(value)
}

function getApnsConfig() {
  const key = (Deno.env.get('APNS_KEY_P8') || '').replace(/\\n/g, '\n').trim()
  const keyId = (Deno.env.get('APNS_KEY_ID') || '').trim()
  const teamId = (Deno.env.get('APNS_TEAM_ID') || '').trim()
  const topic = (Deno.env.get('APNS_BUNDLE_ID') || 'com.moxt.app').trim()
  const production = Deno.env.get('APNS_PRODUCTION') !== 'false'
  if (!key || !keyId || !teamId) return null
  return { key, keyId, teamId, topic, production }
}

async function getApnsJwt(config: NonNullable<ReturnType<typeof getApnsConfig>>) {
  if (cachedJwt && cachedJwt.expiresAt > Date.now() + 60_000) {
    return cachedJwt.value
  }
  const pem = config.key.includes('BEGIN PRIVATE KEY')
    ? config.key
    : `-----BEGIN PRIVATE KEY-----\n${config.key}\n-----END PRIVATE KEY-----`
  const privateKey = await importPKCS8(pem, 'ES256')
  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
    .setIssuer(config.teamId)
    .setIssuedAt(now)
    .sign(privateKey)
  cachedJwt = { value: jwt, expiresAt: Date.now() + 50 * 60 * 1000 }
  return jwt
}

export function hasApnsCredentials() {
  return Boolean(getApnsConfig())
}

export async function sendApnsToDevice(deviceToken: string, payload: NativePushPayload) {
  const config = getApnsConfig()
  if (!config) throw new Error('APNS_KEY_P8 / APNS_KEY_ID / APNS_TEAM_ID manquants.')

  const token = deviceToken.replace(/\s/g, '')
  const jwt = await getApnsJwt(config)
  const host = config.production ? 'api.push.apple.com' : 'api.sandbox.push.apple.com'
  const custom: Record<string, string> = {}
  for (const [key, value] of Object.entries(payload.data || {})) {
    if (value != null) custom[key] = String(value)
  }

  const res = await fetch(`https://${host}/3/device/${token}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${jwt}`,
      'apns-topic': config.topic,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: 'default',
        badge: 1,
      },
      ...custom,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    const error = new Error(`APNs ${res.status}: ${text}`) as Error & { status?: number }
    error.status = res.status
    throw error
  }
}

export function isStaleApnsError(error: unknown) {
  const status = (error as { status?: number })?.status
  return status === 410 || status === 400
}
