/**
 * Écritures de compte alignées sur supabaseMiddleware :
 * préférences (coverStyle), documents personnels, demande de vérification.
 */

export function buildPersonalDocumentPath(userId, category, fileName, now = Date.now()) {
  const owner = String(userId || '').trim()
  if (!owner) throw new Error('Utilisateur requis pour l’adressage document.')
  const safeCategory =
    String(category || 'other')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'other'
  const safeName =
    String(fileName || 'document')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(0, 60) || 'document'
  return `${owner}/${safeCategory}/${now}-${safeName}`
}

export function personalDocumentRow(doc) {
  const row = {
    id: doc.id,
    user_id: doc.userId,
    category: doc.category || 'identity',
    name: doc.name || '',
    size: Number(doc.size) || 0,
    type: doc.type || 'application/octet-stream',
    url: doc.url || null,
    status: doc.status || 'pending_review',
    created_at: doc.createdAt || new Date().toISOString(),
  }
  if (doc.storagePath) row.storage_path = doc.storagePath
  if (doc.deletedAt) row.deleted_at = doc.deletedAt
  if (doc.deletedByUser != null) row.deleted_by_user = Boolean(doc.deletedByUser)
  return row
}

export function verificationRequestRow(request) {
  return {
    id: request.id,
    user_id: request.userId,
    level: request.level || 'identity',
    document_ids: request.documentIds || [],
    note: request.note || '',
    status: request.status || 'pending_review',
    created_at: request.createdAt || new Date().toISOString(),
  }
}

function createId(prefix) {
  const suffix =
    globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}-${suffix.toUpperCase()}`
}

/** Fusionne les préférences puis met à jour `profiles` (account/updateAccountPreferences). */
export async function updateAccountPreferences(client, userId, patch, current = {}) {
  if (!client || !userId) throw new Error('Profil indisponible')
  const preferences = { ...current, ...patch }
  const updates = {
    preferences,
    updated_at: new Date().toISOString(),
  }
  if (patch?.activityVisibility) updates.activity_visibility = patch.activityVisibility
  const { error } = await client.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
  return preferences
}

export function buildPersonalDocument(values, now = new Date()) {
  return {
    id: values.id || createId('PDOC'),
    userId: values.userId,
    category: values.category,
    name: values.name,
    size: Number(values.size) || 0,
    type: values.type || 'application/octet-stream',
    url: values.url || null,
    storagePath: values.storagePath || null,
    status: 'pending_review',
    createdAt: values.createdAt || now.toISOString(),
  }
}

export async function savePersonalDocument(client, doc) {
  if (!client) throw new Error('Client Supabase indisponible')
  const { error } = await client.from('personal_documents').upsert(personalDocumentRow(doc), { onConflict: 'id' })
  if (error) throw error
  return doc
}

/**
 * Insert puis, en cas de doublon (23505), mise à jour de la demande en cours
 * (account/submitVerificationRequest).
 */
export async function submitVerificationRequest(client, values) {
  if (!client) throw new Error('Client Supabase indisponible')
  const request = {
    id: values.id || createId('VER'),
    userId: values.userId,
    level: values.level || 'identity',
    documentIds: values.documentIds || [],
    note: values.note || '',
    status: 'pending_review',
    createdAt: values.createdAt || new Date().toISOString(),
  }
  const row = verificationRequestRow(request)
  const { error: insertError } = await client.from('verification_requests').insert(row)
  if (!insertError) return request
  if (insertError.code === '23505') {
    const { error: updateError } = await client
      .from('verification_requests')
      .update({
        level: row.level,
        document_ids: row.document_ids,
        note: row.note,
        status: row.status,
      })
      .eq('id', row.id)
      .eq('user_id', row.user_id)
    if (updateError) throw updateError
    return request
  }
  throw insertError
}
