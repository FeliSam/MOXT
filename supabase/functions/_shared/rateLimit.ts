import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type AdminClient = ReturnType<typeof createClient>

export function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/** true = allowed, false = blocked. Fail-closed on RPC errors. */
export async function checkRateLimit(
  admin: AdminClient,
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc('moxt_edge_rate_check', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('[rateLimit] check failed:', error.message)
      return false
    }
    return data !== false
  } catch (error) {
    console.error('[rateLimit] check error:', error)
    return false
  }
}

/** Best-effort — never throws to the caller. */
export async function logSecurityEvent(
  admin: AdminClient,
  kind: string,
  subject = '',
  meta: Record<string, unknown> = {},
) {
  try {
    await admin.rpc('moxt_log_security_event', {
      p_kind: kind,
      p_subject: subject,
      p_meta: meta,
    })
  } catch (error) {
    console.warn('[rateLimit] logSecurityEvent failed:', error)
  }
}

/** Constant-time string compare (length + bytes). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const aa = enc.encode(a)
  const bb = enc.encode(b)
  const len = Math.max(aa.length, bb.length)
  let diff = aa.length ^ bb.length
  for (let i = 0; i < len; i++) {
    diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0)
  }
  return diff === 0
}
