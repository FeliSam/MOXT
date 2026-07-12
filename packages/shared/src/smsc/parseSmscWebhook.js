/**
 * Parse le corps d'un webhook SMSC (POST form ou JSON).
 * SMS entrants : phone, mes, id, to
 * Statuts      : phone, status, time, ts, id
 */
export function readSmscField(payload, ...keys) {
  if (!payload || typeof payload !== 'object') return ''
  for (const key of keys) {
    const value = payload[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

export function parseSmscWebhookPayload(payload) {
  const id = readSmscField(payload, 'id', 'sms_id', 'msg_id')
  const message = readSmscField(payload, 'mes', 'message', 'text', 'body')
  const status = readSmscField(payload, 'status', 'stat')
  const fromPhone = readSmscField(payload, 'phone', 'from', 'sender')
  const toPhone = readSmscField(payload, 'to', 'to_phone')

  if (message) {
    return {
      kind: 'incoming',
      smscId: id,
      fromPhone,
      toPhone,
      message,
      eventTime: readSmscField(payload, 'sent', 'received', 'time', 'ts') || null,
      payload,
    }
  }

  if (status) {
    return {
      kind: 'status',
      smscId: id,
      fromPhone,
      toPhone: '',
      deliveryStatus: status,
      eventTime: readSmscField(payload, 'time', 'ts', 'sent') || null,
      payload,
    }
  }

  return null
}

export async function readSmscRequestBody(req) {
  const contentType = (req.headers.get('content-type') || '').toLowerCase()
  const raw = await req.text()
  if (!raw) return {}

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw))
  }

  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    // ignore
  }

  const params = new URLSearchParams(raw)
  if ([...params.keys()].length) {
    return Object.fromEntries(params)
  }

  return {}
}
