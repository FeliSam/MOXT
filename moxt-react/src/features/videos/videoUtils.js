/** Helpers catalogue / feed / upload pour les vidéos entreprise. */

export const VIDEO_MAX_DURATION_MS = 90_000

/**
 * Formats mobiles courants :
 * - iPhone : .mov (video/quicktime, souvent HEVC), .mp4, .m4v
 * - Android : .mp4, .webm, .3gp / .3g2, parfois .mkv
 */
export const VIDEO_ALLOWED_MIME = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/m4v',
  'video/3gpp',
  'video/3gpp2',
  'video/x-matroska',
  'video/mkv',
]

export const VIDEO_ALLOWED_EXT = ['mp4', 'webm', 'mov', 'm4v', '3gp', '3g2', 'mkv']

const VIDEO_EXT_BY_MIME = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-m4v': 'm4v',
  'video/m4v': 'm4v',
  'video/3gpp': '3gp',
  'video/3gpp2': '3g2',
  'video/x-matroska': 'mkv',
  'video/mkv': 'mkv',
}

export function isActiveVideo(video) {
  return video?.status === 'active'
}

export function isArchivedVideo(video) {
  return video ? !isActiveVideo(video) : false
}

export function buildVideoObjectKey(businessId, videoId, extension = 'mp4') {
  const safeBusiness = String(businessId || 'business').replace(/[^a-zA-Z0-9_-]/g, '_')
  const safeId = String(videoId || 'video').replace(/[^a-zA-Z0-9_-]/g, '_')
  const ext = String(extension || 'mp4').replace(/[^a-z0-9]/gi, '') || 'mp4'
  return `${safeBusiness}/${safeId}.${ext}`
}

export function buildVideoLegacyPath(businessId, videoId, extension = 'mp4') {
  return buildVideoObjectKey(businessId, videoId, extension)
}

export function videoFeedPath(videoId) {
  if (!videoId) return '/feed?type=video'
  return `/feed?type=video&item=${encodeURIComponent(`video:${videoId}`)}`
}

export function selectActiveVideos(items = []) {
  return (items || [])
    .filter(isActiveVideo)
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

export function pickInitialVideoIndex(videos, videoId) {
  if (!videoId || !videos?.length) return 0
  const index = videos.findIndex((item) => item.id === videoId)
  return index >= 0 ? index : 0
}

export function videoFileExtension(file) {
  const fromName = String(file?.name || '')
    .split('.')
    .pop()
    ?.toLowerCase()
  if (fromName && VIDEO_ALLOWED_EXT.includes(fromName)) return fromName
  const mime = String(file?.type || '').toLowerCase()
  return VIDEO_EXT_BY_MIME[mime] || 'mp4'
}

export function isAllowedVideoFile(file) {
  if (!file) return false
  const mime = String(file.type || '').toLowerCase()
  if (mime && VIDEO_ALLOWED_MIME.includes(mime)) return true
  // iOS / certains Android envoient parfois un MIME vide ou octet-stream
  if (mime === 'application/octet-stream' || !mime) {
    const ext = String(file.name || '')
      .split('.')
      .pop()
      ?.toLowerCase()
    return VIDEO_ALLOWED_EXT.includes(ext)
  }
  return VIDEO_ALLOWED_EXT.some((ext) => new RegExp(`\\.${ext}$`, 'i').test(file.name || ''))
}

/** Formats déjà largement lisibles dans les navigateurs modernes. */
export function isWebSafeVideoContainer(file) {
  const ext = videoFileExtension(file)
  return ext === 'mp4' || ext === 'webm'
}

export function guessVideoMimeFromExt(ext) {
  const map = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    '3gp': 'video/3gpp',
    '3g2': 'video/3gpp2',
    mkv: 'video/x-matroska',
  }
  return map[String(ext || '').toLowerCase()] || 'video/mp4'
}

function pickMediaRecorderMime() {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function waitVideoEvent(el, eventName, timeoutMs = 20_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`Timeout vidéo (${eventName})`))
    }, timeoutMs)
    function onOk() {
      cleanup()
      resolve()
    }
    function onErr() {
      cleanup()
      reject(new Error('Lecture vidéo impossible'))
    }
    function cleanup() {
      clearTimeout(timer)
      el.removeEventListener(eventName, onOk)
      el.removeEventListener('error', onErr)
    }
    el.addEventListener(eventName, onOk, { once: true })
    el.addEventListener('error', onErr, { once: true })
  })
}

/**
 * Durée MP4 via atom mvhd (sans HTMLVideoElement).
 * Utile quand le navigateur embarqué bloque les blob: (Cursor / Electron).
 */
async function probeMp4DurationMs(file) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)

  function typeAt(offset) {
    return String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    )
  }

  function sizeAt(offset) {
    let size = view.getUint32(offset)
    if (size === 1) {
      // 64-bit size — trop rare ici ; on abandonne
      return -1
    }
    if (size === 0) return bytes.byteLength - offset
    return size
  }

  function findAtom(start, end, wanted) {
    let offset = start
    while (offset + 8 <= end) {
      const size = sizeAt(offset)
      if (size < 8) break
      const type = typeAt(offset + 4)
      if (type === wanted) return { offset, size }
      if (type === 'moov' || type === 'trak' || type === 'mdia' || type === 'minf') {
        const nested = findAtom(offset + 8, offset + size, wanted)
        if (nested) return nested
      }
      offset += size
    }
    return null
  }

  if (typeAt(4) !== 'ftyp' && typeAt(4) !== 'moov') {
    // Certains fichiers commencent par mdat puis moov — scanner tout le fichier
  }
  const mvhd = findAtom(0, bytes.byteLength, 'mvhd')
  if (!mvhd) return null

  const version = bytes[mvhd.offset + 8]
  let timescale
  let duration
  if (version === 1) {
    timescale = view.getUint32(mvhd.offset + 28)
    // duration is 64-bit — take low 32 for clips < 2^32 ticks
    duration = view.getUint32(mvhd.offset + 36) * 2 ** 32 + view.getUint32(mvhd.offset + 40)
  } else {
    timescale = view.getUint32(mvhd.offset + 20)
    duration = view.getUint32(mvhd.offset + 24)
  }
  if (!timescale || !duration) return null
  const durationMs = Math.round((duration / timescale) * 1000)
  if (!(durationMs > 0)) return null
  return { durationMs, width: 720, height: 1280, via: 'mp4-mvhd' }
}

function isBlobUrlBlockedError(error, mediaError) {
  const message = String(
    error?.message || mediaError?.message || error || '',
  ).toLowerCase()
  const code = mediaError?.code ?? error?.code
  return (
    message.includes('url safety') ||
    message.includes('load rejected') ||
    message.includes('media load rejected') ||
    message.includes('not allowed') ||
    code === 4 ||
    code === MediaError?.MEDIA_ERR_SRC_NOT_SUPPORTED
  )
}

/**
 * Vérifie que le navigateur peut décoder le fichier (metadata).
 * Fallback conteneur si blob: est bloqué (preview Cursor / Electron).
 * @returns {Promise<{ durationMs: number, width: number, height: number, via?: string }>}
 */
export function probeVideoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Fichier vidéo manquant'))
      return
    }
    const url = URL.createObjectURL(file)
    const el = document.createElement('video')
    el.preload = 'auto'
    el.muted = true
    el.playsInline = true
    el.setAttribute('playsinline', 'true')
    el.setAttribute('webkit-playsinline', 'true')

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout metadata'))
    }, 20_000)

    let settled = false

    function cleanup() {
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      el.onloadedmetadata = null
      el.onloadeddata = null
      el.onseeked = null
      el.onerror = null
      el.removeAttribute('src')
      el.load()
    }

    async function fallbackContainerProbe(reason) {
      try {
        const mime = String(file.type || '').toLowerCase()
        const name = String(file.name || '').toLowerCase()
        if (mime.includes('mp4') || name.endsWith('.mp4') || name.endsWith('.m4v') || name.endsWith('.mov')) {
          const parsed = await probeMp4DurationMs(file)
          if (parsed) {
            settled = true
            cleanup()
            resolve(parsed)
            return
          }
        }
        // Fichier converti ffmpeg : on accepte un MP4/WebM non vide si blob: est bloqué
        if (isBlobUrlBlockedError(reason, el.error) && file.size > 1000) {
          const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
          const isFtyp =
            head.length >= 8 &&
            String.fromCharCode(head[4], head[5], head[6], head[7]) === 'ftyp'
          const isWebm =
            head.length >= 4 &&
            head[0] === 0x1a &&
            head[1] === 0x45 &&
            head[2] === 0xdf &&
            head[3] === 0xa3
          if (isFtyp || isWebm) {
            settled = true
            cleanup()
            resolve({
              durationMs: Math.min(VIDEO_MAX_DURATION_MS, 30_000),
              width: 720,
              height: 1280,
              via: 'container-magic',
              trustedWithoutDecode: true,
            })
            return
          }
        }
      } catch {
        // ignore → reject below
      }
      settled = true
      cleanup()
      reject(new Error('Impossible de lire ce fichier vidéo'))
    }

    function finishOk() {
      if (settled) return
      let duration = Number.isFinite(el.duration) ? el.duration : 0
      const width = el.videoWidth || 0
      const height = el.videoHeight || 0

      if ((!duration || duration === Infinity) && el.seekable && el.seekable.length) {
        try {
          el.currentTime = Math.min(0.1, el.seekable.end(0))
        } catch {
          // ignore
        }
        return
      }

      if (!(duration > 0 && duration !== Infinity)) return
      if (!(width > 0 && height > 0)) return
      settled = true
      cleanup()
      resolve({
        durationMs: Math.round(duration * 1000),
        width,
        height,
        via: 'html-video',
      })
    }

    el.onloadedmetadata = finishOk
    el.onloadeddata = finishOk
    el.onseeked = finishOk
    el.onerror = () => {
      if (settled) return
      fallbackContainerProbe(el.error)
    }
    el.src = url
  })
}

/** Lit la durée d’un fichier vidéo (ms). */
export function readVideoDurationMs(file) {
  return probeVideoFile(file).then((info) => info.durationMs)
}

/**
 * Re-encode via MediaRecorder vers WebM/MP4 lisible partout.
 * Nécessite que le navigateur sache déjà décoder la source (ex. Safari + MOV HEVC).
 */
export async function transcodeVideoForWeb(file, { maxDurationMs = VIDEO_MAX_DURATION_MS } = {}) {
  if (typeof MediaRecorder === 'undefined' || typeof HTMLVideoElement === 'undefined') {
    throw new Error('Transcodage indisponible')
  }
  const mimeType = pickMediaRecorderMime()
  if (!mimeType) throw new Error('Aucun codec MediaRecorder disponible')

  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', 'true')
  video.src = url

  try {
    await waitVideoEvent(video, 'loadeddata')
    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('Dimensions vidéo invalides')
    }

    // captureStream : conserve audio si disponible ; volume 0 pour autoriser play()
    video.volume = 0
    video.muted = false
    const stream =
      typeof video.captureStream === 'function'
        ? video.captureStream()
        : typeof video.mozCaptureStream === 'function'
          ? video.mozCaptureStream()
          : null
    if (!stream) throw new Error('captureStream indisponible')

    const chunks = []
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2_500_000,
    })
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data)
    }

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve()
      recorder.onerror = () => reject(new Error('Échec MediaRecorder'))
    })

    recorder.start(200)
    await video.play()

    const limitMs = Math.min(
      maxDurationMs,
      Number.isFinite(video.duration) && video.duration > 0
        ? Math.round(video.duration * 1000)
        : maxDurationMs,
    )

    await Promise.race([
      waitVideoEvent(video, 'ended', limitMs + 5_000),
      new Promise((resolve) => setTimeout(resolve, limitMs + 250)),
    ])

    if (recorder.state !== 'inactive') recorder.stop()
    await stopped
    stream.getTracks().forEach((track) => track.stop())
    video.pause()

    const blob = new Blob(chunks, { type: mimeType.split(';')[0] })
    if (!blob.size) throw new Error('Fichier transcodé vide')

    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const base = String(file.name || 'video').replace(/\.[^.]+$/, '')
    return new File([blob], `${base}-web.${ext}`, {
      type: mimeType.split(';')[0],
      lastModified: Date.now(),
    })
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
  }
}

/**
 * Prépare un fichier pour publication.
 * 1) Si déjà lisible en MP4/WebM → garde le fichier (pas de conversion lourde).
 * 2) Sinon conversion interne ffmpeg.wasm → MP4 H.264.
 * 3) Fallback MediaRecorder si le navigateur décode déjà la source.
 *
 * @param {File} file
 * @param {{ onProgress?: (ratio: number) => void }} [options]
 */
export async function preparePublishableVideo(file, { onProgress } = {}) {
  if (!isAllowedVideoFile(file)) {
    const error = new Error('TYPE')
    error.code = 'TYPE'
    throw error
  }

  const maxBytes = 220 * 1024 * 1024
  if (file.size > maxBytes) {
    const error = new Error('TOO_LARGE')
    error.code = 'TOO_LARGE'
    throw error
  }

  onProgress?.(0.05)

  // Déjà web-safe + décodable dans ce navigateur → pas besoin de ffmpeg
  if (isWebSafeVideoContainer(file)) {
    try {
      const probe = await probeVideoFile(file)
      if (probe.durationMs > 0 && probe.durationMs <= VIDEO_MAX_DURATION_MS + 1500) {
        onProgress?.(1)
        return {
          file,
          durationMs: Math.min(probe.durationMs, VIDEO_MAX_DURATION_MS),
          transcoded: false,
        }
      }
      if (probe.durationMs > VIDEO_MAX_DURATION_MS + 1500) {
        const error = new Error('TOO_LONG')
        error.code = 'TOO_LONG'
        error.maxSeconds = Math.round(VIDEO_MAX_DURATION_MS / 1000)
        throw error
      }
    } catch (error) {
      if (error?.code === 'TOO_LONG') throw error
      // sinon on tente la conversion
    }
  }

  onProgress?.(0.08)

  let output
  let convertError
  let probeFromValidate = null
  try {
    const { isFfmpegAvailableInBrowser, transcodeWithFfmpeg, getFfmpegRecentLogs } = await import(
      './videoFfmpegTranscode.js'
    )
    if (!isFfmpegAvailableInBrowser()) {
      throw new Error('WebAssembly indisponible dans ce navigateur')
    }
    output = await transcodeWithFfmpeg(file, {
      maxDurationMs: VIDEO_MAX_DURATION_MS,
      onProgress: (ratio) => onProgress?.(0.1 + ratio * 0.8),
      // Refuse chaque tentative tant que Chrome ne décode pas le MP4
      // (évite « Conversion OK » puis « fichier illisible »).
      validateOutput: async (candidate) => {
        const probe = await probeVideoFile(candidate)
        if (!probe.durationMs || probe.durationMs <= 0) {
          throw new Error('MP4 produit illisible (durée)')
        }
        // width/height peuvent manquer si on a seulement parsé le conteneur (blob: bloqué)
        if (!probe.trustedWithoutDecode && !probe.via?.startsWith('mp4') && (!probe.width || !probe.height)) {
          throw new Error('MP4 produit illisible (dimensions)')
        }
        if (probe.durationMs > VIDEO_MAX_DURATION_MS + 1500) {
          const error = new Error('TOO_LONG')
          error.code = 'TOO_LONG'
          error.maxSeconds = Math.round(VIDEO_MAX_DURATION_MS / 1000)
          throw error
        }
        probeFromValidate = probe
      },
    })
    output._ffmpegLogs = getFfmpegRecentLogs?.() || []
  } catch (error) {
    if (error?.code === 'TOO_LONG') throw error
    convertError = error
    console.error('[videos] ffmpeg failed:', error)
    try {
      onProgress?.(0.25)
      output = await transcodeVideoForWeb(file, { maxDurationMs: VIDEO_MAX_DURATION_MS })
      probeFromValidate = null
    } catch (fallbackError) {
      console.error('[videos] MediaRecorder fallback failed:', fallbackError)
      const fail = new Error(
        convertError?.message || fallbackError?.message || 'CONVERT_FAILED',
      )
      fail.code = 'CONVERT_FAILED'
      fail.cause = convertError || fallbackError
      fail.detail = String(convertError?.message || fallbackError?.message || '')
      throw fail
    }
  }

  onProgress?.(0.95)

  let probe = probeFromValidate
  if (!probe) {
    try {
      probe = await probeVideoFile(output)
    } catch {
      const error = new Error('UNREADABLE')
      error.code = 'UNREADABLE'
      error.detail = 'Le fichier converti n’est pas lisible par le navigateur'
      throw error
    }
  }

  if (!probe.durationMs || probe.durationMs <= 0) {
    const error = new Error('UNREADABLE')
    error.code = 'UNREADABLE'
    error.detail = 'Le fichier converti n’est pas lisible par le navigateur'
    throw error
  }

  if (probe.durationMs > VIDEO_MAX_DURATION_MS + 1500) {
    const error = new Error('TOO_LONG')
    error.code = 'TOO_LONG'
    error.maxSeconds = Math.round(VIDEO_MAX_DURATION_MS / 1000)
    throw error
  }

  onProgress?.(1)
  return {
    file: output,
    durationMs: Math.min(probe.durationMs, VIDEO_MAX_DURATION_MS),
    transcoded: true,
  }
}

/** Capture une vignette JPEG depuis le 1er frame approximatif. */
export function captureVideoThumbnail(file, { seekSeconds = 0.1, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Fichier vidéo manquant'))
      return
    }
    const url = URL.createObjectURL(file)
    const el = document.createElement('video')
    el.preload = 'auto'
    el.muted = true
    el.playsInline = true
    el.setAttribute('playsinline', 'true')

    const cleanup = () => URL.revokeObjectURL(url)

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout vignette'))
    }, 15_000)

    el.onloadeddata = () => {
      try {
        const seekTo = Math.min(seekSeconds, Math.max(0, (el.duration || 1) * 0.05))
        el.currentTime = seekTo
      } catch (error) {
        clearTimeout(timer)
        cleanup()
        reject(error)
      }
    }

    el.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        const w = el.videoWidth || 720
        const h = el.videoHeight || 1280
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(el, 0, 0, w, h)
        canvas.toBlob(
          (blob) => {
            clearTimeout(timer)
            cleanup()
            if (!blob) {
              reject(new Error('Échec capture vignette'))
              return
            }
            resolve(
              new File([blob], `${String(file.name || 'video').replace(/\.[^.]+$/, '')}-thumb.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }),
            )
          },
          'image/jpeg',
          quality,
        )
      } catch (error) {
        clearTimeout(timer)
        cleanup()
        reject(error)
      }
    }

    el.onerror = () => {
      clearTimeout(timer)
      cleanup()
      reject(new Error('Impossible de générer la vignette'))
    }

    el.src = url
  })
}
