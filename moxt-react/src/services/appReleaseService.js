import { createId } from './createId'
import { supabase } from './supabaseClient'

const BUCKET = 'app-releases'

function publicUrlFor(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data?.publicUrl || null
}

export const appReleaseService = {
  async getActiveRelease(platform = 'android') {
    const { data, error } = await supabase
      .from('app_releases')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
      id: data.id,
      platform: data.platform,
      version: data.version || '',
      fileName: data.file_name || '',
      storagePath: data.storage_path,
      fileSize: Number(data.file_size) || 0,
      notes: data.notes || '',
      createdAt: data.created_at,
      downloadUrl: publicUrlFor(data.storage_path),
    }
  },

  async uploadAndroidApk(file, { version = '', notes = '', uploadedBy } = {}) {
    if (!file) throw new Error('Fichier APK manquant')
    const id = createId('APK')
    const safeName = String(file.name || 'moxt.apk').replace(/[^\w.\-]+/g, '_')
    const path = `android/${id}/${safeName}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || 'application/vnd.android.package-archive',
    })
    if (uploadError) throw uploadError

    // Désactive les anciennes releases Android actives
    await supabase
      .from('app_releases')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('platform', 'android')
      .eq('is_active', true)

    const row = {
      id,
      platform: 'android',
      version: String(version || '').trim(),
      file_name: safeName,
      storage_path: path,
      file_size: Number(file.size) || 0,
      is_active: true,
      notes: String(notes || '').trim(),
      uploaded_by: uploadedBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase.from('app_releases').insert(row)
    if (insertError) throw insertError

    return {
      id,
      platform: 'android',
      version: row.version,
      fileName: safeName,
      storagePath: path,
      fileSize: row.file_size,
      notes: row.notes,
      createdAt: row.created_at,
      downloadUrl: publicUrlFor(path),
    }
  },
}
