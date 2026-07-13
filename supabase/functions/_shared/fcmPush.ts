/**
 * FCM HTTP v1 — envoi push Android / iOS (tokens Capacitor).
 */
import { SignJWT, importPKCS8 } from 'npm:jose@5'

type ServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
}

type NativePushPayload = {
  title: string
  body: string
  data?: Record<string, unknown>
}

let cachedToken: { value: string; expiresAt: number } | null = null

function parseServiceAccount(raw: string): ServiceAccount | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as ServiceAccount
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null
    return parsed
  } catch {
    return null
  }
}

export function getFcmProjectId(serviceAccountJson: string) {
  return parseServiceAccount(serviceAccountJson)?.project_id || ''
}

export async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  const sa = parseServiceAccount(serviceAccountJson)
  if (!sa) throw new Error('FCM_SERVICE_ACCOUNT_JSON invalide.')

  const privateKey = await importPKCS8(sa.private_key.replace(/\\n/g, '\n'), 'RS256')
  const now = Math.floor(Date.now() / 1000)
  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    throw new Error(`FCM token OAuth échoué: ${tokenRes.status} ${text}`)
  }

  const tokenBody = (await tokenRes.json()) as { access_token?: string; expires_in?: number }
  if (!tokenBody.access_token) throw new Error('FCM access_token absent.')

  cachedToken = {
    value: tokenBody.access_token,
    expiresAt: Date.now() + (tokenBody.expires_in || 3600) * 1000,
  }
  return cachedToken.value
}

export async function sendFcmToDevice(
  serviceAccountJson: string,
  deviceToken: string,
  payload: NativePushPayload,
) {
  const sa = parseServiceAccount(serviceAccountJson)
  if (!sa) throw new Error('FCM_SERVICE_ACCOUNT_JSON invalide.')

  const accessToken = await getFcmAccessToken(serviceAccountJson)
  const data: Record<string, string> = {}
  for (const [key, value] of Object.entries(payload.data || {})) {
    if (value != null) data[key] = String(value)
  }

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data,
          android: { priority: 'HIGH' },
          apns: {
            headers: { 'apns-priority': '10' },
            payload: { aps: { sound: 'default', badge: 1 } },
          },
        },
      }),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    const error = new Error(`FCM ${res.status}: ${text}`) as Error & { status?: number }
    error.status = res.status
    throw error
  }
}

export function isStaleFcmError(error: unknown) {
  const status = (error as { status?: number })?.status
  if (status === 404 || status === 410) return true
  const message = String((error as Error)?.message || error || '')
  return (
    message.includes('NOT_FOUND') ||
    message.includes('UNREGISTERED') ||
    message.includes('registration-token-not-registered')
  )
}
