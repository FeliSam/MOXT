import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor } from '../_shared/cors.ts'
import {
  buildPublicCdnUrl,
  createYandexS3Client,
  deleteObject,
  headObject,
  presignGet,
  presignPut,
  readYandexS3Config,
  resolveS3Bucket,
} from '../_shared/yandexS3.ts'

const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type, x-supabase-api-version'

type MediaKind = 'avatar' | 'image' | 'video' | 'document' | 'proof'
type Visibility = 'public' | 'private'

function json(body: Record<string, unknown>, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req || new Request('https://moxtapp.ru'), ALLOW_HEADERS),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
  })
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asVisibility(value: unknown): Visibility {
  return value === 'private' ? 'private' : 'public'
}

function asKind(value: unknown): MediaKind {
  const allowed = new Set(['avatar', 'image', 'video', 'document', 'proof'])
  const kind = asString(value)
  return allowed.has(kind) ? (kind as MediaKind) : 'image'
}

async function requireUser(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) throw new Error('supabase_env_missing')

  const authHeader = req.headers.get('Authorization') || ''
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('unauthorized')
  return { user: data.user, client }
}

async function serviceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) throw new Error('service_role_missing')
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function handlePresign(req: Request, body: Record<string, unknown>) {
  const yandex = readYandexS3Config()
  if (!yandex) return json({ error: 'yandex_not_configured' }, 503, req)

  const { user } = await requireUser(req)
  const objectKey = asString(body.objectKey)
  const mimeType = asString(body.mimeType) || 'application/octet-stream'
  const visibility = asVisibility(body.visibility)
  const kind = asKind(body.kind)
  const entityType = asString(body.entityType) || null
  const entityId = asString(body.entityId) || null
  const legacySupabaseBucket = asString(body.legacySupabaseBucket) || null
  const legacySupabasePath = asString(body.legacySupabasePath) || null
  const expiresAt = asString(body.expiresAt) || null

  if (!objectKey) return json({ error: 'object_key_required' }, 400, req)
  if (visibility === 'public' && !objectKey.startsWith('public/')) {
    return json({ error: 'invalid_public_key' }, 400, req)
  }
  if (visibility === 'private' && !objectKey.startsWith('private/')) {
    return json({ error: 'invalid_private_key' }, 400, req)
  }

  const bucket = resolveS3Bucket(yandex, visibility)
  const admin = await serviceClient()
  const { data: row, error: insertError } = await admin
    .from('media_objects')
    .insert({
      owner_id: user.id,
      kind,
      visibility,
      bucket,
      object_key: objectKey,
      mime_type: mimeType,
      entity_type: entityType,
      entity_id: entityId,
      status: 'pending',
      legacy_supabase_bucket: legacySupabaseBucket,
      legacy_supabase_path: legacySupabasePath,
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (insertError || !row?.id) {
    console.error('[media-api] insert pending failed', insertError?.message)
    return json({ error: 'media_register_failed' }, 500, req)
  }

  const s3 = createYandexS3Client(yandex)
  const uploadUrl = await presignPut(s3, bucket, objectKey, mimeType)

  return json(
    {
      mediaId: row.id,
      uploadUrl,
      objectKey,
      bucket,
      visibility,
      publicUrl: visibility === 'public' ? buildPublicCdnUrl(yandex, objectKey) : null,
    },
    200,
    req,
  )
}

async function handleFinalize(req: Request, body: Record<string, unknown>) {
  const yandex = readYandexS3Config()
  if (!yandex) return json({ error: 'yandex_not_configured' }, 503, req)

  const { user, client } = await requireUser(req)
  const mediaId = asString(body.mediaId)
  const byteSize = body.byteSize != null ? Number(body.byteSize) : null
  const checksum = asString(body.checksumSha256) || null
  const width = body.width != null ? Number(body.width) : null
  const height = body.height != null ? Number(body.height) : null
  const durationMs = body.durationMs != null ? Number(body.durationMs) : null

  if (!mediaId) return json({ error: 'media_id_required' }, 400, req)

  const { data: media, error: fetchError } = await client
    .from('media_objects')
    .select('*')
    .eq('id', mediaId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (fetchError || !media) return json({ error: 'media_not_found' }, 404, req)
  if (media.status === 'ready') {
    return json(
      {
        mediaId: media.id,
        status: 'ready',
        publicUrl: media.public_url,
        objectKey: media.object_key,
      },
      200,
      req,
    )
  }

  const s3 = createYandexS3Client(yandex)
  try {
    const head = await headObject(s3, media.bucket, media.object_key)
    const verifiedSize = head.ContentLength ?? byteSize
    const publicUrl =
      media.visibility === 'public' ? buildPublicCdnUrl(yandex, media.object_key) : null

    const { data: finalized, error: finalizeError } = await client.rpc('moxt_media_finalize', {
      p_media_id: mediaId,
      p_byte_size: verifiedSize,
      p_checksum_sha256: checksum,
      p_public_url: publicUrl,
      p_width: width,
      p_height: height,
      p_duration_ms: durationMs,
    })

    if (finalizeError || !finalized) {
      console.error('[media-api] finalize rpc failed', finalizeError?.message)
      return json({ error: 'media_finalize_failed' }, 500, req)
    }

    return json(
      {
        mediaId: finalized.id,
        status: finalized.status,
        publicUrl: finalized.public_url,
        objectKey: finalized.object_key,
        byteSize: finalized.byte_size,
      },
      200,
      req,
    )
  } catch (error) {
    console.error('[media-api] head object failed', error)
    await client.from('media_objects').update({ status: 'error' }).eq('id', mediaId)
    return json({ error: 'object_missing_on_yandex' }, 409, req)
  }
}

async function handleSignedGet(req: Request, body: Record<string, unknown>) {
  const yandex = readYandexS3Config()
  if (!yandex) return json({ error: 'yandex_not_configured' }, 503, req)

  const { user, client } = await requireUser(req)
  const mediaId = asString(body.mediaId)
  if (!mediaId) return json({ error: 'media_id_required' }, 400, req)

  const { data: media, error } = await client
    .from('media_objects')
    .select('*')
    .eq('id', mediaId)
    .maybeSingle()

  if (error || !media || media.status !== 'ready') {
    return json({ error: 'media_not_found' }, 404, req)
  }

  const isOwner = media.owner_id === user.id
  const isPublic = media.visibility === 'public'
  if (!isPublic && !isOwner) {
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'
    if (!isAdmin) return json({ error: 'forbidden' }, 403, req)
  }

  if (isPublic && media.public_url) {
    return json({ url: media.public_url, mediaId }, 200, req)
  }

  const s3 = createYandexS3Client(yandex)
  const url = await presignGet(s3, media.bucket, media.object_key, 3600)
  return json({ url, mediaId, expiresIn: 3600 }, 200, req)
}

async function handleDelete(req: Request, body: Record<string, unknown>) {
  const yandex = readYandexS3Config()
  if (!yandex) return json({ error: 'yandex_not_configured' }, 503, req)

  const { user, client } = await requireUser(req)
  const mediaId = asString(body.mediaId)
  if (!mediaId) return json({ error: 'media_id_required' }, 400, req)

  const { data: media, error } = await client
    .from('media_objects')
    .select('*')
    .eq('id', mediaId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error || !media) return json({ error: 'media_not_found' }, 404, req)

  const s3 = createYandexS3Client(yandex)
  try {
    await deleteObject(s3, media.bucket, media.object_key)
  } catch (deleteError) {
    console.warn('[media-api] delete object warning', deleteError)
  }

  await client.rpc('moxt_media_mark_deleted', { p_media_id: mediaId })
  return json({ deleted: true, mediaId }, 200, req)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeadersFor(req, ALLOW_HEADERS),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, req)
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, req)
  }

  const action = asString(body.action)
  try {
    if (action === 'presign') return await handlePresign(req, body)
    if (action === 'finalize') return await handleFinalize(req, body)
    if (action === 'signed-get') return await handleSignedGet(req, body)
    if (action === 'delete') return await handleDelete(req, body)
    return json({ error: 'unknown_action' }, 400, req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    if (message === 'unauthorized') return json({ error: 'unauthorized' }, 401, req)
    console.error('[media-api]', message)
    return json({ error: message }, 500, req)
  }
})
