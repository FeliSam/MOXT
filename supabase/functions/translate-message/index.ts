import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, corsPreflight } from '../_shared/cors.ts'
import {
  isSupportedTargetLang,
  translateViaLibreTranslate,
} from '../_shared/libreTranslate.ts'
import { checkRateLimit, clientIp } from '../_shared/rateLimit.ts'

const MAX_CHARS = 2000
const RATE_MAX = 20
const RATE_WINDOW_SEC = 60

function json(body: Record<string, unknown>, status: number, req: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req),
      'Content-Type': 'application/json',
    },
  })
}

function participantIdsInclude(participantIds: unknown, userId: string) {
  if (!Array.isArray(participantIds)) return false
  return participantIds.some((id) => String(id) === userId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, req)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Configuration Supabase incomplète.' }, 503, req)
    }

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return json({ error: 'Session expirée.' }, 401, req)
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return json({ error: 'Session expirée.' }, 401, req)
    }

    const userId = userData.user.id
    const ip = clientIp(req)
    const rateOk = await checkRateLimit(
      admin,
      `translate-message:user:${userId}`,
      RATE_MAX,
      RATE_WINDOW_SEC,
    )
    if (!rateOk) {
      return json({ error: 'Trop de traductions. Réessayez dans un instant.' }, 429, req)
    }
    await checkRateLimit(admin, `translate-message:ip:${ip}`, RATE_MAX * 2, RATE_WINDOW_SEC)

    const body = await req.json().catch(() => ({}))
    const messageId = String(body.messageId || '').trim()
    const text = String(body.text || body.content || '').trim()
    const targetLang = String(body.targetLang || body.language || '').trim().toLowerCase()

    if (!messageId) return json({ error: 'Message requis' }, 400, req)
    if (!text) return json({ error: 'Message vide' }, 400, req)
    if (!isSupportedTargetLang(targetLang)) {
      return json({ error: 'Langue cible non supportée' }, 400, req)
    }
    if (text.length > MAX_CHARS) {
      return json({ error: `Texte trop long (max ${MAX_CHARS} caractères)` }, 400, req)
    }

    const { data: messageRow, error: messageError } = await supabase
      .from('messages')
      .select('id, conversation_id, text')
      .eq('id', messageId)
      .maybeSingle()

    if (messageError || !messageRow) {
      return json({ error: 'Message introuvable' }, 404, req)
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('participant_ids')
      .eq('id', messageRow.conversation_id)
      .maybeSingle()

    if (conversationError || !conversation) {
      return json({ error: 'Conversation introuvable' }, 404, req)
    }

    if (!participantIdsInclude(conversation.participant_ids, userId)) {
      return json({ error: 'Accès refusé' }, 403, req)
    }

    const { data: cached } = await admin
      .from('message_translations')
      .select('translated_text')
      .eq('message_id', messageId)
      .eq('target_lang', targetLang)
      .maybeSingle()

    if (cached?.translated_text) {
      return json(
        {
          translatedText: cached.translated_text,
          targetLang,
          cached: true,
        },
        200,
        req,
      )
    }

    const result = await translateViaLibreTranslate(text, targetLang)
    if (result.error || !result.text) {
      return json(
        { error: result.error || 'Traduction vide' },
        result.status || 502,
        req,
      )
    }

    await admin.from('message_translations').upsert(
      {
        message_id: messageId,
        target_lang: targetLang,
        translated_text: result.text,
      },
      { onConflict: 'message_id,target_lang' },
    ).then(({ error: cacheError }) => {
      if (cacheError) {
        console.warn('message_translations cache skip:', cacheError.message)
      }
    })

    return json(
      {
        translatedText: result.text,
        targetLang,
        cached: false,
      },
      200,
      req,
    )
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : 'Erreur de traduction',
      },
      500,
      req,
    )
  }
})
