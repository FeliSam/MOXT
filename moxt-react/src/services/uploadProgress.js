/**
 * Helpers de progression d’upload (phases + ticker pendant le fetch Supabase).
 * onProgress({ phase, percent, fileIndex?, fileCount?, fileName? })
 */

export const UPLOAD_PHASES = {
  preparing: 'preparing',
  compressing: 'compressing',
  uploading: 'uploading',
  finalizing: 'finalizing',
  done: 'done',
  error: 'error',
}

/**
 * Raccourcit un nom de fichier pour l’UI (évite d’élargir la mise en page).
 * Conserve l’extension quand elle est courte.
 */
export function shortenFileName(name, maxLen = 32) {
  const raw = String(name || '').trim()
  if (!raw || raw.length <= maxLen) return raw
  const dot = raw.lastIndexOf('.')
  const ext =
    dot > 0 && raw.length - dot <= 8 && !raw.slice(dot + 1).includes(' ')
      ? raw.slice(dot)
      : ''
  const base = ext ? raw.slice(0, dot) : raw
  const keep = Math.max(8, maxLen - ext.length - 1)
  return `${base.slice(0, keep)}…${ext}`
}

export function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
}

export function reportProgress(onProgress, update) {
  if (typeof onProgress !== 'function') return
  onProgress({
    phase: update.phase || UPLOAD_PHASES.uploading,
    percent: clampPercent(update.percent),
    fileIndex: update.fileIndex,
    fileCount: update.fileCount,
    fileName: update.fileName,
  })
}

/** Fait avancer la barre pendant une promesse sans événements byte-level. */
export function startProgressTicker(onProgress, { from = 35, to = 92, intervalMs = 160 } = {}) {
  let current = from
  reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: current })
  const id = setInterval(() => {
    const gap = to - current
    current = Math.min(current + Math.max(gap * 0.14, 1.2), to)
    reportProgress(onProgress, { phase: UPLOAD_PHASES.uploading, percent: current })
  }, intervalMs)
  return () => clearInterval(id)
}

export async function runWithUploadProgress(onProgress, work, { from = 35, to = 92 } = {}) {
  const stop = startProgressTicker(onProgress, { from, to })
  try {
    return await work()
  } finally {
    stop()
  }
}

/** Progression globale pour N fichiers séquentiels (0-based index). */
export function fileSliceProgress(fileIndex, fileCount, localPercent) {
  const total = Math.max(1, fileCount)
  const slice = 100 / total
  return clampPercent(fileIndex * slice + (localPercent / 100) * slice)
}
