import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, corsPreflight } from '../_shared/cors.ts'
import {
  isSupportedTargetLang,
  translateViaLibreTranslate,
} from '../_shared/libreTranslate.ts'
import { checkRateLimit, clientIp } from '../_shared/rateLimit.ts'
import {
  isSupportedTranslationLang,
  normalizeTranslationText,
  translationContentHash,
} from '../_shared/translationHash.ts'

const MAX_CHARS = 2000
const MAX_BATCH = 10
const RATE_MAX = 40
const RATE_WINDOW_SEC = 60

type TranslateItem = {
  messageId: string
  text: string
  targetLang: string
  sourceLang?: string | null
}

type TranslateResult = {
  messageId: string
  targetLang: string
  translatedText?: string
  cached?: boolean
  error?: string
}

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

function parseItems(body: Record<string, unknown>): TranslateItem[] {
  if (Array.isArray(body.items) && body.items.length) {
    return body.items
      .map((entry) => {
        const row = entry as Record<string, unknown>
        return {
          messageId: String(row.messageId || '').trim(),
          text: String(row.text || row.content || '').trim(),
          targetLang: String(row.targetLang || row.language || '').trim().toLowerCase(),
          sourceLang: row.sourceLang ? String(row.sourceLang).trim().toLowerCase() : null,
        }
      })
      .filter((item) => item.messageId && item.text && item.targetLang)
      .slice(0, MAX_BATCH)
  }

  const messageId = String(body.messageId || '').trim()
  const text = String(body.text || body.content || '').trim()
  const targetLang = String(body.targetLang || body.language || '').trim().toLowerCase()
  const sourceLang = body.sourceLang ? String(body.sourceLang).trim().toLowerCase() : null
  if (!messageId || !text || !targetLang) return []
  return [{ messageId, text, targetLang, sourceLang }]
}

async function cacheTranslation(
  admin: ReturnType<typeof createClient>,
  item: TranslateItem,
  translatedText: string,
  sourceLang: string | null,
) {
  const hash = await translationContentHash(item.text, item.targetLang)

  await admin.from('message_translations').upsert(
    {
      message_id: item.messageId,
      target_lang: item.targetLang,
      translated_text: translatedText,
    },
    { onConflict: 'message_id,target_lang' },
  ).then(({ error }) => {
    if (error) console.warn('message_translations cache skip:', error.message)
  })

  await admin.from('translation_content_cache').upsert(
    {
      content_hash: hash,
      target_lang: item.targetLang,
      source_lang: sourceLang,
      translated_text: translatedText,
    },
    { onConflict: 'content_hash,target_lang' },
  ).then(({ error }) => {
    if (error) console.warn('translation_content_cache skip:', error.message)
  })
}

async function resolveTranslation(
  admin: ReturnType<typeof createClient>,
  item: TranslateItem,
): Promise<TranslateResult> {
  const text = normalizeTranslationText(item.text)
  if (!text) return { messageId: item.messageId, targetLang: item.targetLang, error: 'Message vide' }
  if (!isSupportedTargetLang(item.targetLang)) {
    return { messageId: item.messageId, targetLang: item.targetLang, error: 'Langue cible non supportée' }
  }
  if (text.length > MAX_CHARS) {
    return {
      messageId: item.messageId,
      targetLang: item.targetLang,
      error: `Texte trop long (max ${MAX_CHARS} caractères)`,
    }
  }

  const sourceLang =
    item.sourceLang && isSupportedTranslationLang(item.sourceLang) ? item.sourceLang : null
  if (sourceLang && sourceLang === item.targetLang) {
    return {
      messageId: item.messageId,
      targetLang: item.targetLang,
      translatedText: text,
      cached: true,
    }
  }

  const { data: messageCached } = await admin
    .from('message_translations')
    .select('translated_text')
    .eq('message_id', item.messageId)
    .eq('target_lang', item.targetLang)
    .maybeSingle()

  if (messageCached?.translated_text) {
    return {
      messageId: item.messageId,
      targetLang: item.targetLang,
      translatedText: messageCached.translated_text,
      cached: true,
    }
  }

  const hash = await translationContentHash(text, item.targetLang)
  const { data: contentCached } = await admin
    .from('translation_content_cache')
    .select('translated_text')
    .eq('content_hash', hash)
    .eq('target_lang', item.targetLang)
    .maybeSingle()

  if (contentCached?.translated_text) {
    await cacheTranslation(admin, item, contentCached.translated_text, sourceLang)
    return {
      messageId: item.messageId,
      targetLang: item.targetLang,
      translatedText: contentCached.translated_text,
      cached: true,
    }
  }

  const result = await translateViaLibreTranslate(text, item.targetLang, sourceLang)
  if (result.error || !result.text) {
    return {
      messageId: item.messageId,
      targetLang: item.targetLang,
      error: result.error || 'Traduction vide',
    }
  }

  await cacheTranslation(admin, item, result.text, sourceLang)
  return {
    messageId: item.messageId,
    targetLang: item.targetLang,
    translatedText: result.text,
    cached: false,
  }
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
    const body = await req.json().catch(() => ({}))
    const items = parseItems(body as Record<string, unknown>)
    if (!items.length) {
      return json({ error: 'Message requis' }, 400, req)
    }

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

    const messageIds = [...new Set(items.map((item) => item.messageId))]
    const { data: messageRows, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .in('id', messageIds)

    if (messagesError) {
      return json({ error: 'Messages introuvables' }, 404, req)
    }

    const rowById = new Map((messageRows || []).map((row) => [String(row.id), row]))
    if (rowById.size !== messageIds.length) {
      return json({ error: 'Message introuvable' }, 404, req)
    }

    const conversationIds = [...new Set((messageRows || []).map((row) => row.conversation_id))]
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, participant_ids')
      .in('id', conversationIds)

    if (conversationsError || !conversations?.length) {
      return json({ error: 'Conversation introuvable' }, 404, req)
    }

    const conversationById = new Map(conversations.map((row) => [String(row.id), row]))
    for (const item of items) {
      const messageRow = rowById.get(item.messageId)
      const conversation = messageRow
        ? conversationById.get(String(messageRow.conversation_id))
        : null
      if (!conversation || !participantIdsInclude(conversation.participant_ids, userId)) {
        return json({ error: 'Accès refusé' }, 403, req)
      }
    }

    const results: TranslateResult[] = []
    for (const item of items) {
      results.push(await resolveTranslation(admin, item))
    }

    if (items.length === 1 && !Array.isArray((body as Record<string, unknown>).items)) {
      const single = results[0]
      if (single.error) {
        return json({ error: single.error }, 502, req)
      }
      return json(
        {
          translatedText: single.translatedText,
          targetLang: single.targetLang,
          cached: single.cached ?? false,
        },
        200,
        req,
      )
    }

    return json({ results }, 200, req)
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
