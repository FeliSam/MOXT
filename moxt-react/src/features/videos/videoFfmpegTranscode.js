import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
/**
 * Worker bundlé par Vite (évite le 404 `.vite/deps/worker.js` et le chemin cassé en prod).
 * @see https://github.com/ffmpegwasm/ffmpeg.wasm/issues/617
 */
import ffmpegClassWorkerUrl from '@ffmpeg/ffmpeg/worker?worker&url'

const FFMPEG_CORE_VERSION = '0.12.10'
const INPUT_STEM = 'input'
const OUTPUT_NAME = 'output.mp4'
const DEFAULT_MAX_DURATION_MS = 90_000
const ALLOWED_EXT = ['mp4', 'webm', 'mov', 'm4v', '3gp', '3g2', 'mkv']
const LOAD_TIMEOUT_MS = 120_000
const EXEC_TIMEOUT_MS = 240_000

function fileExtension(file) {
  const fromName = String(file?.name || '')
    .split('.')
    .pop()
    ?.toLowerCase()
  if (fromName && ALLOWED_EXT.includes(fromName)) return fromName
  const mime = String(file?.type || '').toLowerCase()
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('quicktime')) return 'mov'
  if (mime.includes('3gpp2')) return '3g2'
  if (mime.includes('3gpp')) return '3gp'
  if (mime.includes('matroska') || mime.includes('mkv')) return 'mkv'
  if (mime.includes('m4v')) return 'm4v'
  return 'mp4'
}

let ffmpegInstance = null
let loadPromise = null
let progressHandler = null
const recentLogs = []

function progressRatio(event) {
  if (!event || typeof event.progress !== 'number') return 0
  if (!Number.isFinite(event.progress)) return 0
  return Math.max(0, Math.min(1, event.progress))
}

function pushLog(message) {
  if (!message) return
  recentLogs.push(String(message))
  if (recentLogs.length > 80) recentLogs.shift()
  console.debug('[ffmpeg]', message)
}

function withTimeout(promise, ms, label) {
  let timer
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${label} (timeout ${Math.round(ms / 1000)}s)`)),
        ms,
      )
    }),
  ])
}

function publicFfmpegBase() {
  const base = String(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  return `${base}ffmpeg`
}

function resolveClassWorkerURL() {
  const raw = String(ffmpegClassWorkerUrl || '')
  if (!raw) return undefined
  if (raw.startsWith('blob:') || raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw
  }
  if (typeof window !== 'undefined') {
    try {
      return new URL(raw, window.location.origin).href
    } catch {
      return raw
    }
  }
  return raw
}

async function resolveCoreUrls() {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const localBase = `${origin}${publicFfmpegBase()}`
  // ESM obligatoire : le UMD casse avec « failed to import ffmpeg-core.js » dans le worker.
  const cdnBase = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`

  for (const base of [localBase, cdnBase]) {
    try {
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      ])
      return { coreURL, wasmURL }
    } catch (error) {
      console.warn('[ffmpeg] Core indisponible depuis', base, error?.message || error)
    }
  }
  throw new Error('Impossible de télécharger le moteur de conversion vidéo')
}

async function destroyFfmpeg() {
  const current = ffmpegInstance
  ffmpegInstance = null
  loadPromise = null
  if (!current) return
  try {
    current.terminate()
  } catch {
    // ignore
  }
}

/**
 * Charge ffmpeg.wasm (core single-thread + worker Vite).
 */
export async function ensureFfmpegLoaded({ forceReload = false } = {}) {
  if (forceReload) await destroyFfmpeg()
  if (ffmpegInstance?.loaded) return ffmpegInstance
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg()
    ffmpeg.on('log', ({ message }) => pushLog(message))
    ffmpeg.on('progress', (event) => {
      progressHandler?.(progressRatio(event))
    })
    const urls = await resolveCoreUrls()
    const classWorkerURL = resolveClassWorkerURL()
    pushLog(`load classWorkerURL=${classWorkerURL || '(default)'}`)
    await withTimeout(
      ffmpeg.load({
        ...urls,
        ...(classWorkerURL ? { classWorkerURL } : {}),
      }),
      LOAD_TIMEOUT_MS,
      'Chargement moteur vidéo',
    )
    if (!ffmpeg.loaded) throw new Error('Moteur vidéo non initialisé')
    ffmpegInstance = ffmpeg
    return ffmpeg
  })().catch(async (error) => {
    await destroyFfmpeg()
    console.error('[ffmpeg] load failed:', error)
    throw error
  })

  return loadPromise
}

function inputFileName(file) {
  return `${INPUT_STEM}.${fileExtension(file) || 'mp4'}`
}

async function runExec(ffmpeg, args) {
  recentLogs.length = 0
  const code = await withTimeout(
    ffmpeg.exec(args, EXEC_TIMEOUT_MS),
    EXEC_TIMEOUT_MS + 5_000,
    'Conversion',
  )
  if (code !== 0) {
    const tail = recentLogs.slice(-12).join(' | ')
    throw new Error(`ffmpeg exit ${code}${tail ? ` — ${tail}` : ''}`)
  }
}

/**
 * Toujours re-encoder (jamais `-c copy`).
 * Scale simple + H.264 baseline = max compat Chrome/Android/Safari.
 */
function buildAttempts(inName, maxSeconds, fileSize) {
  const heavy = fileSize > 40 * 1024 * 1024
  const scale720 = 'scale=720:-2:flags=fast_bilinear,setsar=1,format=yuv420p'
  const scale480 = 'scale=480:-2:flags=fast_bilinear,setsar=1,format=yuv420p'
  const scale360 = 'scale=360:-2:flags=fast_bilinear,setsar=1,format=yuv420p'

  const head = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-threads',
    '1',
    '-i',
    inName,
    '-t',
    String(maxSeconds),
  ]
  const x264 = [
    '-c:v',
    'libx264',
    '-profile:v',
    'baseline',
    '-level',
    '3.1',
    '-preset',
    'ultrafast',
    '-crf',
    heavy ? '30' : '28',
    '-pix_fmt',
    'yuv420p',
    '-tag:v',
    'avc1',
    '-movflags',
    '+faststart',
    '-f',
    'mp4',
  ]
  const aac = ['-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '44100']
  const vp8 = [
    '-c:v',
    'libvpx',
    '-b:v',
    '1M',
    '-cpu-used',
    '8',
    '-deadline',
    'realtime',
    '-pix_fmt',
    'yuv420p',
    '-f',
    'webm',
  ]

  return [
    [...head, '-vf', scale720, ...x264, ...aac, OUTPUT_NAME],
    [...head, '-vf', scale720, ...x264, '-an', OUTPUT_NAME],
    [...head, '-vf', scale480, ...x264, '-an', OUTPUT_NAME],
    // Dernier recours Chrome : WebM VP8 (toujours décodable)
    [...head, '-vf', scale360, ...vp8, '-an', 'output.webm'],
  ]
}

function looksLikeMp4(bytes) {
  if (!bytes || bytes.byteLength < 12) return false
  const head = String.fromCharCode(...bytes.subarray(4, 8))
  return head === 'ftyp'
}

function looksLikeWebm(bytes) {
  // EBML header 0x1A45DFA3
  return (
    bytes &&
    bytes.byteLength >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  )
}

async function readOutputFile(ffmpeg, outputName = OUTPUT_NAME) {
  const data = await ffmpeg.readFile(outputName)
  if (!data?.length) throw new Error('Sortie ffmpeg vide')
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const isWebm = outputName.endsWith('.webm')
  if (isWebm) {
    if (!looksLikeWebm(copy)) throw new Error('Sortie ffmpeg sans en-tête WebM')
  } else if (!looksLikeMp4(copy)) {
    throw new Error('Sortie ffmpeg sans en-tête MP4 (ftyp)')
  }
  const mime = isWebm ? 'video/webm' : 'video/mp4'
  const blob = new Blob([copy], { type: mime })
  if (!blob.size) throw new Error('Blob vidéo vide')
  return { blob, mime, ext: isWebm ? 'webm' : 'mp4', outputName }
}

/**
 * Convertit vers MP4 H.264 (+ AAC si possible).
 * @param {File} file
 * @param {{
 *   onProgress?: (ratio: number) => void,
 *   maxDurationMs?: number,
 *   validateOutput?: (file: File) => Promise<void>,
 * }} [options]
 * Si `validateOutput` est fourni, chaque tentative est refusée tant que le navigateur
 * ne peut pas lire le fichier (évite d’accepter un MP4 « exit 0 » mais illisible).
 * @returns {Promise<File>}
 */
export async function transcodeWithFfmpeg(
  file,
  { onProgress, maxDurationMs = DEFAULT_MAX_DURATION_MS, validateOutput } = {},
) {
  if (!file) throw new Error('Fichier vidéo manquant')

  let ffmpeg = await ensureFfmpegLoaded()
  const inName = inputFileName(file)
  const maxSeconds = Math.max(1, Math.ceil(maxDurationMs / 1000))
  progressHandler = typeof onProgress === 'function' ? onProgress : null

  try {
    await ffmpeg.writeFile(inName, await fetchFile(file))

    const attempts = buildAttempts(inName, maxSeconds, file.size || 0)
    let lastError = null

    for (let i = 0; i < attempts.length; i += 1) {
      const args = attempts[i]
      const outName = args[args.length - 1] || OUTPUT_NAME
      try {
        try {
          await ffmpeg.deleteFile(OUTPUT_NAME)
        } catch {
          // ignore
        }
        try {
          await ffmpeg.deleteFile('output.webm')
        } catch {
          // ignore
        }
        pushLog(`attempt ${i + 1}/${attempts.length}: ${args.join(' ')}`)
        await runExec(ffmpeg, args)
        const { blob, mime, ext } = await readOutputFile(ffmpeg, outName)
        const base = String(file.name || 'video').replace(/\.[^.]+$/, '')
        const outFile = new File([blob], `${base}.${ext}`, {
          type: mime,
          lastModified: Date.now(),
        })
        if (typeof validateOutput === 'function') {
          await validateOutput(outFile)
        }
        return outFile
      } catch (error) {
        lastError = error
        console.warn('[ffmpeg] tentative échouée:', error?.message || error)
        const msg = String(error?.message || '')
        // Même une sortie « exit 0 » peut être illisible → on enchaîne les tentatives.
        // Reload seulement si le runtime est mort.
        if (
          msg.includes('timeout') ||
          msg.includes('Terminated') ||
          msg.includes('not loaded')
        ) {
          try {
            ffmpeg = await ensureFfmpegLoaded({ forceReload: true })
            await ffmpeg.writeFile(inName, await fetchFile(file))
          } catch (rewriteError) {
            lastError = rewriteError
            break
          }
        }
      }
    }

    throw lastError || new Error('Échec conversion ffmpeg')
  } finally {
    progressHandler = null
    try {
      await ffmpeg.deleteFile(inName)
    } catch {
      // ignore
    }
    try {
      await ffmpeg.deleteFile(OUTPUT_NAME)
    } catch {
      // ignore
    }
    try {
      await ffmpeg.deleteFile('output.webm')
    } catch {
      // ignore
    }
  }
}

export function isFfmpegAvailableInBrowser() {
  return typeof window !== 'undefined' && typeof WebAssembly !== 'undefined'
}

export function getFfmpegRecentLogs() {
  return [...recentLogs]
}
