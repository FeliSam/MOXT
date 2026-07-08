import { supabase } from './supabaseClient'

function parseGatewayError(error, data) {
  if (data?.error) return String(data.error)
  if (error?.message) return error.message
  return 'Le service Telegram est indisponible.'
}

export async function invokeTelegramGateway(payload) {
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  const { data, error } = await supabase.functions.invoke('telegram-gateway', {
    body: payload,
  })

  if (error) {
    throw new Error(parseGatewayError(error, data))
  }
  if (data?.error) {
    throw new Error(String(data.error))
  }
  return data
}

export async function sendTelegramVerificationCode({ phone, userId, requestId }) {
  return invokeTelegramGateway({
    action: 'send',
    phone,
    userId,
    ...(requestId ? { requestId } : {}),
  })
}

export async function verifyTelegramVerificationCode({ phone, userId, requestId, code }) {
  return invokeTelegramGateway({
    action: 'verify',
    phone,
    userId,
    requestId,
    code,
  })
}
