/** SIGMA Messaging — Telegram + FlashCall (derniers chiffres de l’appelant). */

/** Canal app : telegram | flashcall. L’API Sigma attend `telegramcode` pour Telegram. */
export type SigmaSendType = 'telegram' | 'flashcall'

function sigmaToken() {
  return (
    Deno.env.get('SIGMA_SMS_API_KEY') ||
    Deno.env.get('SIGMA_API_KEY') ||
    Deno.env.get('Sigma_Moxt_API_Key') ||
    ''
  ).trim()
}

export function isSigmaConfigured() {
  return Boolean(sigmaToken())
}

export function phoneToSigma(phone: string) {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`
  if (digits.length === 10) return `7${digits}`
  if (digits.startsWith('7') && digits.length === 11) return digits
  throw new Error('Sigma SMS : numéro russe (+7) requis.')
}

export function flashcallDigits(otp: string) {
  const digits = String(otp).replace(/\D/g, '')
  return digits.slice(-4).padStart(4, '0')
}

export async function sendViaSigma(
  phone: string,
  otp: string,
  type: SigmaSendType,
  timeoutMs: number,
): Promise<string> {
  const token = sigmaToken()
  if (!token) throw new Error('Sigma SMS non configuré (SIGMA_SMS_API_KEY).')

  const recipient = phoneToSigma(phone)
  const digits = String(otp).replace(/\D/g, '')
  const telegramSender = (Deno.env.get('SIGMA_TELEGRAM_SENDER') || Deno.env.get('SIGMA_SENDER') || 'MOXT').trim()
  const flashSender = (Deno.env.get('SIGMA_FLASHCALL_SENDER') || 'flashcall').trim()
  const template =
    Deno.env.get('SMS_MESSAGE_TEMPLATE') || 'Код MOXT: {otp}. Никому не сообщайте.'
  const text =
    type === 'flashcall'
      ? flashcallDigits(otp)
      : template.replaceAll('{otp}', digits).replaceAll('{code}', digits)

  const apiType = type === 'telegram' ? 'telegramcode' : 'flashcall'

  const body = JSON.stringify({
    recipient,
    type: apiType,
    payload: {
      sender: type === 'flashcall' ? flashSender : telegramSender,
      text,
    },
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetch('https://online.sigmasms.ru/api/sendings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Accept: 'application/json',
        Authorization: token.replace(/^Bearer\s+/i, ''),
      },
      body,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Sigma ${type} timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }

  const raw = await res.text()
  let data: Record<string, unknown> | null = null
  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const detail = String(data?.error || data?.message || raw || res.status)
    throw new Error(`Sigma ${type} HTTP ${res.status} — ${detail}`)
  }
  if (data && (data.error || data.errors)) {
    throw new Error(`Sigma ${type} — ${JSON.stringify(data.error || data.errors)}`)
  }
  const id = data?.id || data?.sendingId
  return id ? String(id) : 'ok'
}
