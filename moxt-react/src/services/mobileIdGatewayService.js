import { supabase } from './supabaseClient'

async function extractFunctionError(error, data) {
  if (data?.error) return String(data.error)

  const context = error?.context
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json()
      if (body?.error) return String(body.error)
      if (typeof body?.message === 'string') return body.message
    } catch {
      // corps non JSON
    }
  }

  if (error?.message && !/non-2xx|FunctionsHttpError/i.test(error.message)) {
    return error.message
  }
  return 'La vérification MobileID a échoué. Réessayez.'
}

export async function invokeMobileIdGateway(payload) {
  if (!supabase) {
    throw new Error('Supabase non configuré.')
  }

  const { data, error } = await supabase.functions.invoke('mobileid-gateway', {
    body: payload,
  })

  if (error) {
    throw new Error(await extractFunctionError(error, data))
  }
  if (data?.error) {
    throw new Error(String(data.error))
  }
  return data
}
