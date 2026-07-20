import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SNSClient, PublishCommand } from 'npm:@aws-sdk/client-sns@3'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { phoneToSmsc } from '../_shared/smscPhone.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeE164(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`
  if (digits.length === 10) return `+7${digits}`
  if (String(phone).trim().startsWith('+')) return `+${digits}`
  return `+${digits}`
}

function phoneToSmsRu(phone: string) {
  const e164 = normalizeE164(phone)
  if (!e164.startsWith('+7') || e164.length !== 12) {
    throw new Error('SMS.ru : seuls les numéros russes (+7) sont pris en charge pour l’instant.')
  }
  return e164.slice(1)
}

/** Baked into the function source (UTF-8). Do not rely on Windows-synced secrets for Cyrillic. */
const DEFAULT_SMS_TEMPLATE = 'Код MOXT: {otp}. Никому не сообщайте.'

/** UTF-8 Cyrillic mis-decoded as Windows-1251/Latin-1 → "РљРѕРґ" instead of "Код". */
function looksLikeMojibake(text = '') {
  return /Р[А-Яа-яЁё]{2,}/.test(text) || text.includes('РљРѕРґ') || text.includes('РќРёРєРѕРјСѓ')
}

function buildSmsText(otp: string) {
  const fromEnv =
    Deno.env.get('SMS_MESSAGE_TEMPLATE') || Deno.env.get('YC_SNS_MESSAGE_TEMPLATE') || ''
  const template =
    fromEnv && !looksLikeMojibake(fromEnv) && /[А-Яа-яЁё]/.test(fromEnv)
      ? fromEnv
      : DEFAULT_SMS_TEMPLATE
  if (fromEnv && looksLikeMojibake(fromEnv)) {
    console.warn('[send-sms] SMS_MESSAGE_TEMPLATE corrompu (mojibake) — template source utilisé')
  }
  return template.replaceAll('{otp}', otp).replaceAll('{code}', otp)
}

/** SMSC-safe form body: explicit UTF-8 percent-encoding (avoids corrupted env charset). */
function encodeSmscForm(params: Record<string, string>) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

type SmsProvider = 'smsru' | 'yandex' | 'smsc' | 'p1sms'

/** Auth send_sms hook hard-timeout is 5s — stay under that including cold start. */
const HOOK_BUDGET_MS = 4_200
const PROVIDER_TIMEOUT_MS = 2_800

function isInfraLocked() {
  const locked = (Deno.env.get('SMS_INFRA_LOCKED') || '').toLowerCase()
  return locked === 'true' || locked === '1'
}

function resolveProvider(): SmsProvider {
  if (isInfraLocked()) {
    if (Deno.env.get('SMSC_LOGIN') && (Deno.env.get('SMSC_PASSWORD') || Deno.env.get('SMSC_API_KEY'))) {
      return 'smsc'
    }
  }

  const explicit = (Deno.env.get('SMS_PROVIDER') || 'auto').toLowerCase()
  if (explicit === 'smsru') return 'smsru'
  if (explicit === 'yandex') return 'yandex'
  if (explicit === 'smsc') return 'smsc'
  if (explicit === 'p1sms') return 'p1sms'
  if (Deno.env.get('SMSC_LOGIN') && (Deno.env.get('SMSC_PASSWORD') || Deno.env.get('SMSC_API_KEY'))) {
    return 'smsc'
  }
  if (Deno.env.get('P1SMS_API_KEY')) return 'p1sms'
  if (Deno.env.get('SMS_RU_API_ID')) return 'smsru'
  return 'yandex'
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
  label: string,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${label} timeout after ${ms}ms`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function sendViaSmsRu(phone: string, otp: string) {
  const apiId = Deno.env.get('SMS_RU_API_ID')
  if (!apiId) {
    throw new Error('SMS.ru non configuré (SMS_RU_API_ID).')
  }

  const to = phoneToSmsRu(phone)
  const message = buildSmsText(otp)
  const body = new URLSearchParams({
    api_id: apiId,
    to,
    msg: message,
    json: '1',
  })

  const from = Deno.env.get('SMS_RU_FROM')
  if (from) body.set('from', from)

  const res = await fetchWithTimeout(
    'https://sms.ru/sms/send',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body,
    },
    PROVIDER_TIMEOUT_MS,
    'SMS.ru',
  )

  const text = await res.text()
  let data: Record<string, unknown> | null = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(`SMS.ru HTTP ${res.status}${text ? ` — ${text}` : ''}`)
  }

  if (!data || data.status !== 'OK') {
    const code = data?.status_code ?? 'inconnu'
    const detail = data?.status_text || text || 'réponse invalide'
    throw new Error(`SMS.ru ${code} — ${detail}`)
  }

  const sms = data.sms as Record<string, { status?: string; status_code?: number; status_text?: string; sms_id?: string }> | undefined
  const entry = sms?.[to]
  if (!entry || entry.status !== 'OK') {
    const code = entry?.status_code ?? 'inconnu'
    const detail = entry?.status_text || 'échec envoi'
    if (code === 221) {
      throw new Error(
        'SMS.ru : créez un expéditeur alphabétique (ex. MOXT) sur https://sms.ru/?panel=senders puis définissez SMS_RU_FROM dans phase2.env.',
      )
    }
    if (code === 201) {
      throw new Error('SMS.ru : solde insuffisant. Rechargez votre compte sur sms.ru.')
    }
    throw new Error(`SMS.ru ${code} — ${detail}`)
  }

  return entry.sms_id || 'ok'
}

async function sendViaSmscOnce(phone: string, otp: string, sender?: string) {
  const login = Deno.env.get('SMSC_LOGIN')
  const password = Deno.env.get('SMSC_PASSWORD')
  const apikey = Deno.env.get('SMSC_API_KEY')
  if (!login || (!password && !apikey)) {
    throw new Error('SMSC non configuré (SMSC_LOGIN + SMSC_PASSWORD ou SMSC_API_KEY).')
  }

  const phones = phoneToSmsc(phone)
  const message = buildSmsText(otp)
  const fields: Record<string, string> = {
    login,
    phones,
    mes: message,
    fmt: '3',
    charset: 'utf-8',
    cost: '3',
  }
  // Prefer apikey so SMSC API logs never echo the account password.
  if (apikey) fields.apikey = apikey
  else if (password) fields.psw = password
  if (sender) fields.sender = sender

  const res = await fetchWithTimeout(
    'https://smsc.ru/sys/send.php',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: encodeSmscForm(fields),
    },
    PROVIDER_TIMEOUT_MS,
    'SMSC',
  )

  const text = await res.text()
  let data: Record<string, unknown> | null = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(`SMSC HTTP ${res.status}${text ? ` — ${text}` : ''}`)
  }

  if (!data || data.error) {
    const code = data?.error_code ?? 'inconnu'
    const detail = String(data?.error || text || 'réponse invalide')
    const lower = detail.toLowerCase()
    if (Number(code) === 3) {
      throw new Error('SMSC : solde insuffisant. Rechargez votre compte sur smsc.ru.')
    }
    if (lower.includes('message is denied') || Number(code) === 8) {
      // Often operator/sender specific — not necessarily SMSC "test mode".
      throw new Error(`SMSC_NUMBER_DENIED — ${detail}`)
    }
    if (
      Number(code) === 6 ||
      lower.includes('test') ||
      lower.includes('тест') ||
      lower.includes('запрещ')
    ) {
      throw new Error(
        'SMSC : envoi refusé pour ce numéro. Vérifiez le mode test / numéros autorisés sur smsc.ru, ou réessayez avec un autre numéro.',
      )
    }
    if (isSmscSenderError(code, detail)) {
      throw new Error(
        `SMSC_SENDER_INVALID — ${detail}`,
      )
    }
    throw new Error(`SMSC ${code} — ${detail}`)
  }

  const id = data.id
  return id ? String(id) : 'ok'
}

function isSmscSenderError(code: unknown, detail = '') {
  const lower = detail.toLowerCase()
  return (
    lower.includes('sender') ||
    lower.includes('отправител') ||
    lower.includes('имя отправителя') ||
    lower.includes('подпись') ||
    (Number(code) === 6 && (lower.includes('имя') || lower.includes('sender')))
  )
}

function shouldRetrySmscWithoutSender(message = '') {
  const lower = String(message).toLowerCase()
  return (
    lower.includes('smsc_sender_invalid') ||
    lower.includes('smsc_number_denied') ||
    lower.includes('message is denied') ||
    lower.includes('envoi refusé') ||
    isSmscSenderError('inconnu', message)
  )
}

async function sendViaSmsc(phone: string, otp: string) {
  const sender = (Deno.env.get('SMSC_SENDER') || '').trim()
  if (!sender) {
    return sendViaSmscOnce(phone, otp)
  }

  try {
    return await sendViaSmscOnce(phone, otp, sender)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (shouldRetrySmscWithoutSender(message)) {
      console.warn('[send-sms] SMSC refus (sender/numéro), nouvel essai sans sender:', message)
      return sendViaSmscOnce(phone, otp)
    }
    throw error
  }
}

/** Default ON — SMSC Telegram channel when SMS is denied for the number. */
function isSmscTelegramFailoverEnabled() {
  const v = (Deno.env.get('SMSC_TG_FAILOVER') || '1').toLowerCase()
  return !(v === '0' || v === 'false' || v === 'no' || v === 'off')
}

function shouldFailoverToTelegram(message = '') {
  const lower = String(message).toLowerCase()
  if (lower.includes('solde insuffisant') || lower.includes('non configuré')) return false
  return (
    lower.includes('smsc_number_denied') ||
    lower.includes('message is denied') ||
    lower.includes('envoi refusé') ||
    lower.includes('smsc_sender_invalid') ||
    lower.includes('smsc ') ||
    lower.startsWith('smsc')
  )
}

/**
 * SMSC Telegram OTP (tg=1 or bot=@…).
 * Docs: verification codes must be 4–8 digits only in `mes`.
 * Recipient must have started the SMSC Telegram bot once.
 */
async function sendViaSmscTelegram(phone: string, otp: string) {
  const login = Deno.env.get('SMSC_LOGIN')
  const password = Deno.env.get('SMSC_PASSWORD')
  const apikey = Deno.env.get('SMSC_API_KEY')
  if (!login || (!password && !apikey)) {
    throw new Error('SMSC Telegram non configuré (SMSC_LOGIN + SMSC_PASSWORD ou SMSC_API_KEY).')
  }

  const digits = String(otp).replace(/\D/g, '')
  if (digits.length < 4 || digits.length > 8) {
    throw new Error('SMSC Telegram : le code OTP doit faire entre 4 et 8 chiffres.')
  }

  const phones = phoneToSmsc(phone)
  const fields: Record<string, string> = {
    login,
    phones,
    mes: digits,
    fmt: '3',
    charset: 'utf-8',
    cost: '3',
  }
  if (apikey) fields.apikey = apikey
  else if (password) fields.psw = password

  const customBot = (Deno.env.get('SMSC_TG_BOT') || '').trim()
  if (customBot) {
    fields.bot = customBot.startsWith('@') ? customBot : `@${customBot}`
  } else {
    fields.tg = '1'
  }

  const res = await fetchWithTimeout(
    'https://smsc.ru/sys/send.php',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: encodeSmscForm(fields),
    },
    PROVIDER_TIMEOUT_MS,
    'SMSC-Telegram',
  )

  const text = await res.text()
  let data: Record<string, unknown> | null = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(`SMSC Telegram HTTP ${res.status}${text ? ` — ${text}` : ''}`)
  }
  if (!data || data.error) {
    const code = data?.error_code ?? 'inconnu'
    const detail = String(data?.error || text || 'réponse invalide')
    throw new Error(
      `SMSC Telegram ${code} — ${detail}. Ouvrez le bot Telegram SMSC (Start) avec ce numéro, puis renvoyez le code.`,
    )
  }
  const id = data.id
  return id ? String(id) : 'ok'
}

function phoneToP1sms(phone: string) {
  // P1SMS expects 11 digits without '+' (e.g. 79001234567).
  const e164 = normalizeE164(phone)
  if (!e164.startsWith('+7') || e164.length !== 12) {
    throw new Error('P1SMS : seuls les numéros russes (+7) sont pris en charge pour l’instant.')
  }
  return e164.slice(1)
}

async function sendViaP1sms(phone: string, otp: string) {
  const apiKey = (Deno.env.get('P1SMS_API_KEY') || '').trim()
  if (!apiKey) {
    throw new Error('P1SMS non configuré (P1SMS_API_KEY).')
  }

  const channel = ((Deno.env.get('P1SMS_CHANNEL') || 'digit').trim().toLowerCase() || 'digit')
  const sender = (Deno.env.get('P1SMS_SENDER') || '').trim()
  if ((channel === 'char' || channel === 'viber') && !sender) {
    throw new Error(
      'P1SMS : canal char/viber nécessite P1SMS_SENDER (nom d’expéditeur validé dans le cabinet P1SMS).',
    )
  }

  const to = phoneToP1sms(phone)
  const message = buildSmsText(otp)
  const smsItem: Record<string, string> = {
    channel,
    text: message,
    phone: to,
  }
  if (sender) smsItem.sender = sender

  const payload: Record<string, unknown> = {
    apiKey,
    sms: [smsItem],
  }
  const webhookUrl = (Deno.env.get('P1SMS_WEBHOOK_URL') || '').trim()
  if (webhookUrl) payload.webhookUrl = webhookUrl

  const res = await fetchWithTimeout(
    'https://admin.p1sms.ru/apiSms/create',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    },
    PROVIDER_TIMEOUT_MS,
    'P1SMS',
  )

  const text = await res.text()
  let data: Record<string, unknown> | null = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(`P1SMS HTTP ${res.status}${text ? ` — ${text}` : ''}`)
  }

  if (!data || data.status !== 'success') {
    const detail =
      (typeof data?.error === 'string' && data.error) ||
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.errorDescription === 'string' && data.errorDescription) ||
      text ||
      'réponse invalide'
    throw new Error(`P1SMS — ${detail}`)
  }

  const rows = Array.isArray(data.data) ? data.data as Array<Record<string, unknown>> : []
  const entry = rows[0]
  if (!entry) {
    throw new Error('P1SMS : envoi sans entrée dans data[].')
  }

  const entryStatus = String(entry.status || '').toLowerCase()
  if (entryStatus === 'error' || entryStatus === 'low_balance' || entryStatus === 'not_delivered') {
    const detail = String(entry.errorDescription || entry.message || entryStatus)
    if (entryStatus === 'low_balance' || detail.toLowerCase().includes('balance')) {
      throw new Error('P1SMS : solde insuffisant. Rechargez votre compte sur p1sms.ru.')
    }
    throw new Error(`P1SMS ${entryStatus} — ${detail}`)
  }

  const id = entry.id
  return id != null ? String(id) : 'ok'
}

async function sendViaYandexCns(phone: string, otp: string) {
  const accessKeyId = Deno.env.get('YC_SNS_ACCESS_KEY_ID')
  const secretAccessKey = Deno.env.get('YC_SNS_SECRET_ACCESS_KEY')
  const senderId = Deno.env.get('YC_SNS_SENDER_ID') || 'MOXT'

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Yandex CNS non configuré (YC_SNS_ACCESS_KEY_ID / YC_SNS_SECRET_ACCESS_KEY).')
  }

  const e164 = normalizeE164(phone)
  if (!e164.startsWith('+7')) {
    throw new Error('Yandex CNS : seuls les numéros russes (+7) sont pris en charge pour l’instant.')
  }

  const client = new SNSClient({
    endpoint: 'https://notifications.yandexcloud.net/',
    region: 'ru-central1',
    credentials: { accessKeyId, secretAccessKey },
  })

  const message = buildSmsText(otp)
  const result = await withTimeout(
    client.send(
      new PublishCommand({
        PhoneNumber: e164,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: senderId,
          },
        },
      }),
    ),
    PROVIDER_TIMEOUT_MS,
    'Yandex CNS',
  )

  if (!result.MessageId) {
    throw new Error('Yandex CNS : envoi sans MessageId.')
  }

  return result.MessageId
}

function providerAvailable(provider: SmsProvider) {
  if (provider === 'smsru') return Boolean(Deno.env.get('SMS_RU_API_ID'))
  if (provider === 'p1sms') return Boolean((Deno.env.get('P1SMS_API_KEY') || '').trim())
  if (provider === 'smsc') {
    return Boolean(
      Deno.env.get('SMSC_LOGIN') &&
        (Deno.env.get('SMSC_PASSWORD') || Deno.env.get('SMSC_API_KEY')),
    )
  }
  if (provider === 'yandex') {
    return Boolean(
      Deno.env.get('YC_SNS_ACCESS_KEY_ID') && Deno.env.get('YC_SNS_SECRET_ACCESS_KEY'),
    )
  }
  return false
}

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

type OtpRoutePeek = { send_count: number; last_provider: string }

/** Read prior routing row before claim (client may have set prefer_p1sms). */
async function peekOtpSmsRoute(phone: string): Promise<OtpRoutePeek | null> {
  const admin = getServiceClient()
  if (!admin) return null
  const routePhone = normalizeE164(phone)
  const { data, error } = await admin
    .from('otp_sms_route')
    .select('send_count, last_provider')
    .eq('phone', routePhone)
    .maybeSingle()
  if (error || !data) return null
  return {
    send_count: Number(data.send_count || 0),
    last_provider: String(data.last_provider || ''),
  }
}

/**
 * Atomic attempt counter (3h window). Used to split providers without dual-send:
 * attempt 1 → SMSC, attempt 2+ → P1SMS.
 */
async function claimOtpSmsAttempt(phone: string): Promise<number> {
  const admin = getServiceClient()
  if (!admin) {
    console.warn('[send-sms] service role absent — routage par défaut (tentative 1 → SMSC)')
    return 1
  }
  const routePhone = normalizeE164(phone)
  const { data, error } = await admin.rpc('claim_otp_sms_attempt', { p_phone: routePhone })
  if (!error && data != null) {
    return Number(data) || 1
  }
  console.warn('[send-sms] claim_otp_sms_attempt:', error?.message || 'empty')

  // Table fallback when RPC is unavailable (still service-role only).
  const { data: row } = await admin
    .from('otp_sms_route')
    .select('send_count, updated_at')
    .eq('phone', routePhone)
    .maybeSingle()
  const updatedAt = row?.updated_at ? new Date(String(row.updated_at)).getTime() : 0
  const stale = !updatedAt || Date.now() - updatedAt > 3 * 60 * 60 * 1000
  const next = stale || !row ? 1 : Number(row.send_count || 0) + 1
  const { error: upsertError } = await admin.from('otp_sms_route').upsert({
    phone: routePhone,
    send_count: next,
    updated_at: new Date().toISOString(),
  })
  if (upsertError) {
    console.warn('[send-sms] claim fallback upsert:', upsertError.message)
    return 1
  }
  return next
}

async function markOtpSmsProvider(phone: string, provider: SmsProvider) {
  const admin = getServiceClient()
  if (!admin) return
  const routePhone = normalizeE164(phone)
  const { error } = await admin.rpc('mark_otp_sms_provider', {
    p_phone: routePhone,
    p_provider: provider,
  })
  if (error) {
    console.warn('[send-sms] mark_otp_sms_provider:', error.message)
  }
}

/**
 * Force every OTP (signup + login + resend) through SMSC only.
 * P1SMS is not used on the account-creation / OTP path.
 * Secrets: SMS_OTP_FORCE_SMSC=1 (default).
 */
function isSmsForceSmsc() {
  const v = (Deno.env.get('SMS_OTP_FORCE_SMSC') || Deno.env.get('MOXT_SMS_DEV') || '1').toLowerCase()
  // Default ON unless explicitly disabled (0/false/no).
  return !(v === 'false' || v === '0' || v === 'no' || v === 'off')
}

/**
 * Provider selection for Auth send_sms (inscription / connexion / renvoi OTP):
 * - Default (SMS_OTP_FORCE_SMSC): SMSC only — never P1SMS
 * - If force disabled: 1st → SMSC, 2nd+ → P1SMS (legacy; keep off in prod)
 */
function selectProviderForAttempt(attempt: number): SmsProvider | null {
  if (isSmsForceSmsc()) {
    return providerAvailable('smsc') ? 'smsc' : null
  }
  const preferP1 = attempt >= 2
  if (preferP1) {
    if (providerAvailable('p1sms')) return 'p1sms'
    if (providerAvailable('smsc')) return 'smsc'
  } else {
    if (providerAvailable('smsc')) return 'smsc'
    if (providerAvailable('p1sms')) return 'p1sms'
  }
  if (providerAvailable('smsru')) return 'smsru'
  if (providerAvailable('yandex')) return 'yandex'
  const primary = resolveProvider()
  return providerAvailable(primary) ? primary : null
}

async function sendWithProvider(provider: SmsProvider, phone: string, otp: string) {
  if (provider === 'smsru') return sendViaSmsRu(phone, otp)
  if (provider === 'yandex') return sendViaYandexCns(phone, otp)
  if (provider === 'p1sms') return sendViaP1sms(phone, otp)
  return sendViaSmsc(phone, otp)
}

async function sendOtpSms(phone: string, otp: string) {
  // Peek before claim (legacy prefer_p1sms). Ignored while SMSC is forced for all attempts.
  const prior = await peekOtpSmsRoute(phone)
  const forceSmsc = isSmsForceSmsc()
  const forceP1 =
    !forceSmsc &&
    (prior?.last_provider === 'prefer_p1sms' ||
      (Number(prior?.send_count || 0) >= 1 &&
        Boolean(prior?.last_provider) &&
        prior.last_provider !== 'prefer_p1sms'))

  const attempt = await claimOtpSmsAttempt(phone)
  const routeAttempt = forceP1 ? Math.max(attempt, 2) : attempt
  const provider = selectProviderForAttempt(routeAttempt)

  if (!provider) {
    throw new Error('Aucun fournisseur SMS configuré (SMSC, P1SMS, SMS.ru ou Yandex CNS).')
  }

  console.log(
    `[send-sms] tentative ${attempt} (route ${routeAttempt}) → ${provider} (${normalizeE164(phone)})` +
      (forceSmsc ? ' [force SMSC]' : '') +
      (prior?.last_provider ? ` prior=${prior.last_provider}` : ''),
  )

  const started = Date.now()
  const remaining = HOOK_BUDGET_MS - (Date.now() - started)
  const attemptMs = Math.min(PROVIDER_TIMEOUT_MS, Math.max(900, remaining))

  try {
    const id = await withTimeout(sendWithProvider(provider, phone, otp), attemptMs, provider)
    await markOtpSmsProvider(phone, provider)
    return id
  } catch (error) {
    const message = error instanceof Error ? error.message : 'échec inconnu'
    console.warn(`[send-sms] ${provider} échoué (tentative ${attempt}):`, message)

    // SMSC SMS denied (ex. Yota) → Telegram OTP on the same phone.
    if (
      provider === 'smsc' &&
      isSmscTelegramFailoverEnabled() &&
      shouldFailoverToTelegram(message)
    ) {
      const budgetLeft = HOOK_BUDGET_MS - (Date.now() - started)
      if (budgetLeft > 800) {
        const tgMs = Math.min(PROVIDER_TIMEOUT_MS, Math.max(800, budgetLeft))
        console.warn(`[send-sms] failover SMSC SMS → Telegram (${tgMs}ms)`)
        try {
          const id = await withTimeout(sendViaSmscTelegram(phone, otp), tgMs, 'smsc-tg')
          await markOtpSmsProvider(phone, 'smsc')
          return id
        } catch (tgError) {
          const tgMessage = tgError instanceof Error ? tgError.message : 'échec Telegram'
          console.warn('[send-sms] Telegram failover échoué:', tgMessage)
          throw new Error(`smsc: ${message}; telegram: ${tgMessage}`)
        }
      }
    }

    throw new Error(`${provider}: ${message}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRET')
  if (!hookSecret) {
    return json({ error: 'SEND_SMS_HOOK_SECRET manquant.' }, 503)
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  const base64Secret = hookSecret.replace('v1,whsec_', '')
  const wh = new Webhook(base64Secret)

  let user: { phone?: string }
  let sms: { otp?: string }
  try {
    ;({ user, sms } = wh.verify(payload, headers) as {
      user: { phone?: string }
      sms: { otp?: string }
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'signature invalide'
    console.error('[send-sms] hook signature:', detail)
    return json(
      {
        error: {
          http_code: 401,
          message:
            'Hook SMS : secret de signature invalide. Relancez npm run setup:smsc pour resynchroniser SEND_SMS_HOOK_SECRET.',
        },
      },
      401,
    )
  }

  const phone = user?.phone
  const otp = sms?.otp
  if (!phone || !otp) {
    return json({ error: 'Payload SMS incomplet.' }, 400)
  }

  try {
    await sendOtpSms(phone, otp)
    return json({})
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Échec envoi SMS.'
    console.error('[send-sms]', message)
    // Auth only parses the error body when the hook returns HTTP 200/202.
    // A raw HTTP 500 becomes "Unexpected status code returned from hook: 500"
    // and the client loses the SMSC/P1SMS reason (then shows a false VPN message).
    return json(
      {
        error: {
          http_code: 422,
          message,
        },
      },
      200,
    )
  }
})
