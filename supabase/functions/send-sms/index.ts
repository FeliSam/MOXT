import { SNSClient, PublishCommand } from 'npm:@aws-sdk/client-sns@3'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

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

function buildSmsText(otp: string) {
  const template =
    Deno.env.get('SMS_MESSAGE_TEMPLATE') ||
    Deno.env.get('YC_SNS_MESSAGE_TEMPLATE') ||
    'Код MOXT: {otp}. Никому не сообщайте.'
  return template.replaceAll('{otp}', otp).replaceAll('{code}', otp)
}

type SmsProvider = 'smsru' | 'yandex'

function resolveProvider(): SmsProvider {
  const explicit = (Deno.env.get('SMS_PROVIDER') || 'auto').toLowerCase()
  if (explicit === 'smsru') return 'smsru'
  if (explicit === 'yandex') return 'yandex'
  if (Deno.env.get('SMS_RU_API_ID')) return 'smsru'
  return 'yandex'
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

  const res = await fetch('https://sms.ru/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  })

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
  const result = await client.send(
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
  )

  if (!result.MessageId) {
    throw new Error('Yandex CNS : envoi sans MessageId.')
  }

  return result.MessageId
}

async function sendOtpSms(phone: string, otp: string) {
  const provider = resolveProvider()
  if (provider === 'smsru') {
    return sendViaSmsRu(phone, otp)
  }
  return sendViaYandexCns(phone, otp)
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

  try {
    const base64Secret = hookSecret.replace('v1,whsec_', '')
    const wh = new Webhook(base64Secret)
    const { user, sms } = wh.verify(payload, headers) as {
      user: { phone?: string }
      sms: { otp?: string }
    }

    const phone = user?.phone
    const otp = sms?.otp
    if (!phone || !otp) {
      return json({ error: 'Payload SMS incomplet.' }, 400)
    }

    await sendOtpSms(phone, otp)
    return json({})
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Échec envoi SMS.'
    console.error('[send-sms]', message)
    return json(
      {
        error: {
          http_code: 500,
          message,
        },
      },
      500,
    )
  }
})
