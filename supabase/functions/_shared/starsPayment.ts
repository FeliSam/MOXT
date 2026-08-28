/** Interchangeable RUB payment adapter for MOXT Stars. Default: stub. */

export type StarsPaymentProvider = {
  name: string
}

export async function refund(
  provider: StarsPaymentProvider,
  _payload: { purchaseId?: string; amountRub?: number },
): Promise<{ ok: boolean; status: string }> {
  if (provider.name === 'stub') {
    return { ok: true, status: 'stub_manual' }
  }
  return { ok: false, status: 'not_configured' }
}

export type CheckoutResult = {
  provider: string
  status: 'pending' | 'paid' | 'failed'
  checkoutUrl?: string | null
}

export async function createPayment(
  provider: StarsPaymentProvider,
  payload: { purchaseId?: string; amountRub?: number; stars?: number; userId?: string },
): Promise<CheckoutResult> {
  if (provider.name === 'stub') {
    return {
      provider: 'stub',
      status: 'pending',
      checkoutUrl: null,
    }
  }
  return {
    provider: provider.name,
    status: 'pending',
    checkoutUrl: null,
  }
}

export async function parseWebhook(
  provider: StarsPaymentProvider,
  req: Request,
): Promise<{ ok: boolean; reason?: string; purchaseId?: string; status?: 'paid' | 'failed' }> {
  if (provider.name !== 'stub') {
    return { ok: false, reason: `provider ${provider.name} not configured` }
  }
  const secret = Deno.env.get('MOXT_STARS_STUB_WEBHOOK_SECRET') || ''
  const header = req.headers.get('x-moxt-stars-provider') || ''
  if (!secret || header !== secret) {
    return { ok: false, reason: 'invalid stub signature' }
  }
  try {
    const body = await req.json()
    return {
      ok: true,
      purchaseId: body.purchaseId,
      status: body.status === 'failed' ? 'failed' : 'paid',
    }
  } catch {
    return { ok: false, reason: 'invalid json' }
  }
}
