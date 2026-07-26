/** MOXT digital share badge — neon Russia–Africa card (1080×1620). */

const WIDTH = 1080
const HEIGHT = 1620

const COLORS = {
  bg0: '#04141c',
  bg1: '#0a2430',
  bg2: '#0d3a42',
  neon: '#39ff88',
  neonDim: 'rgba(57,255,136,0.55)',
  cyan: '#22d3ee',
  cyanSoft: 'rgba(34,211,238,0.35)',
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.72)',
  panel: 'rgba(8,28,36,0.72)',
  panelBorder: 'rgba(57,255,136,0.35)',
}

const FEATURES = [
  { emoji: '🔄', key: 'exchange' },
  { emoji: '📦', key: 'parcels' },
  { emoji: '🛒', key: 'marketplace' },
  { emoji: '👥', key: 'community' },
  { emoji: '💼', key: 'jobs' },
  { emoji: '📅', key: 'events' },
]

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function loadImage(src, { crossOrigin } = {}) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('no-src'))
      return
    }
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image-load-failed'))
    img.src = src
  })
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function splitName(title = '', firstName, lastName) {
  if (firstName || lastName) {
    return {
      first: String(firstName || '').trim(),
      last: String(lastName || '').trim(),
    }
  }
  const parts = String(title || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return { first: parts[0], last: parts.slice(1).join(' ') }
  }
  return { first: parts[0] || 'MOXT', last: '' }
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  gradient.addColorStop(0, COLORS.bg0)
  gradient.addColorStop(0.45, COLORS.bg1)
  gradient.addColorStop(1, COLORS.bg2)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.save()
  ctx.filter = 'blur(70px)'
  ctx.fillStyle = COLORS.cyanSoft
  ctx.beginPath()
  ctx.arc(WIDTH - 80, 120, 220, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(57,255,136,0.18)'
  ctx.beginPath()
  ctx.arc(120, HEIGHT - 180, 260, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.fillStyle = '#ffffff'
  for (let x = 28; x < WIDTH; x += 42) {
    for (let y = 28; y < HEIGHT; y += 42) {
      ctx.beginPath()
      ctx.arc(x, y, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawMoxtMark(ctx, x, y, size = 64) {
  ctx.save()
  ctx.translate(x, y)
  const thickness = size * 0.22
  const len = size * 0.9
  ctx.lineCap = 'round'
  // Blue arm
  ctx.strokeStyle = COLORS.cyan
  ctx.lineWidth = thickness
  ctx.shadowColor = COLORS.cyan
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.moveTo(-len * 0.35, -len * 0.35)
  ctx.lineTo(len * 0.35, len * 0.35)
  ctx.stroke()
  // Green arm
  ctx.strokeStyle = COLORS.neon
  ctx.shadowColor = COLORS.neon
  ctx.beginPath()
  ctx.moveTo(len * 0.35, -len * 0.35)
  ctx.lineTo(-len * 0.35, len * 0.35)
  ctx.stroke()
  ctx.restore()
}

function drawHeader(ctx, copy, verified) {
  drawMoxtMark(ctx, 78, 78, 58)
  ctx.save()
  ctx.fillStyle = COLORS.white
  ctx.font = '800 22px "Manrope", "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('MOXT', 78, 118)
  ctx.restore()

  ctx.save()
  const titleGrad = ctx.createLinearGradient(200, 40, 700, 90)
  titleGrad.addColorStop(0, COLORS.cyan)
  titleGrad.addColorStop(1, COLORS.neon)
  ctx.fillStyle = titleGrad
  ctx.font = '900 54px "Manrope", "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('MOXT', 160, 70)
  ctx.fillStyle = COLORS.muted
  ctx.font = '700 18px "Manrope", "Segoe UI", sans-serif'
  const sloganLines = wrapText(ctx, copy.slogan, 520)
  sloganLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line.toUpperCase(), 160, 100 + i * 24)
  })
  ctx.restore()

  if (verified) {
    ctx.save()
    roundRect(ctx, WIDTH - 290, 42, 230, 52, 26)
    ctx.fillStyle = 'rgba(8,40,48,0.85)'
    ctx.fill()
    ctx.strokeStyle = COLORS.neonDim
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = COLORS.neon
    ctx.font = '700 18px "Manrope", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`🛡 ${copy.verifiedChip}`, WIDTH - 175, 69)
    ctx.restore()
  }
}

async function drawAvatar(ctx, avatarUrl, name, cx, cy, r) {
  let avatarImg = null
  if (avatarUrl) {
    try {
      avatarImg = await loadImage(avatarUrl, { crossOrigin: 'anonymous' })
    } catch {
      avatarImg = null
    }
  }
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
  ctx.strokeStyle = COLORS.neonDim
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (avatarImg) {
    ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = COLORS.white
    ctx.font = '800 48px "Manrope", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials(name), cx, cy + 4)
  }
  ctx.restore()
}

function drawVerifiedDot(ctx, cx, cy) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.neon
  ctx.shadowColor = COLORS.neon
  ctx.shadowBlur = 10
  ctx.fill()
  ctx.fillStyle = COLORS.bg0
  ctx.font = '800 18px "Manrope", "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✓', cx, cy + 1)
  ctx.restore()
}

function drawProfileBlock(ctx, { first, last, city, country, verified, copy }, avatarCx, avatarCy, avatarR) {
  const textX = avatarCx + avatarR + 28
  let y = avatarCy - 36
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (first) {
    ctx.fillStyle = COLORS.white
    ctx.font = '800 40px "Manrope", "Segoe UI", sans-serif'
    ctx.fillText(first, textX, y)
    y += 44
  }
  if (last) {
    ctx.fillStyle = COLORS.neon
    ctx.font = '800 40px "Manrope", "Segoe UI", sans-serif'
    ctx.fillText(last, textX, y)
    y += 40
  }
  const location = [city, country].filter(Boolean).join(', ')
  if (location) {
    ctx.fillStyle = COLORS.muted
    ctx.font = '600 24px "Manrope", "Segoe UI", sans-serif'
    ctx.fillText(`📍 ${location}`, textX, y)
    y += 42
  }
  if (verified) {
    const label = copy.verifiedUser
    ctx.font = '700 20px "Manrope", "Segoe UI", sans-serif'
    const w = Math.min(ctx.measureText(label).width + 56, 420)
    roundRect(ctx, textX, y - 22, w, 40, 20)
    ctx.strokeStyle = COLORS.neon
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = COLORS.neon
    ctx.fillText(`🛡 ${label}`, textX + 16, y + 6)
  }
  ctx.restore()
}

function drawFeatureRail(ctx, copy, x, y) {
  FEATURES.forEach((feature, index) => {
    const fy = y + index * 72
    roundRect(ctx, x, fy, 210, 56, 28)
    ctx.fillStyle = COLORS.panel
    ctx.fill()
    ctx.strokeStyle = COLORS.panelBorder
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.font = '28px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(feature.emoji, x + 16, fy + 30)
    ctx.fillStyle = COLORS.white
    ctx.font = '700 20px "Manrope", "Segoe UI", sans-serif'
    ctx.fillText(copy.features?.[feature.key] || feature.key, x + 56, fy + 30)
  })
}

function drawQrFrame(ctx, qrX, qrY, qrSize) {
  const pad = 28
  const frameX = qrX - pad
  const frameY = qrY - pad
  const frameW = qrSize + pad * 2
  const frameH = qrSize + pad * 2
  roundRect(ctx, frameX, frameY, frameW, frameH, 28)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 12
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  const corner = 36
  const thick = 6
  ctx.strokeStyle = COLORS.neon
  ctx.lineWidth = thick
  ctx.lineCap = 'round'
  const corners = [
    [frameX, frameY, 1, 1],
    [frameX + frameW, frameY, -1, 1],
    [frameX, frameY + frameH, 1, -1],
    [frameX + frameW, frameY + frameH, -1, -1],
  ]
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(cx + dx * corner, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + dy * corner)
    ctx.stroke()
  })
}

function drawBridgeMap(ctx, x, y, w, h, caption) {
  ctx.save()
  roundRect(ctx, x, y, w, h, 28)
  ctx.fillStyle = 'rgba(6,30,40,0.55)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(34,211,238,0.25)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Dotted continents (deterministic dots for stable export).
  ctx.fillStyle = 'rgba(57,255,136,0.55)'
  const seedDots = (bx, by, br, count, seed) => {
    for (let i = 0; i < count; i += 1) {
      const t = (i * 37 + seed * 13) % 97
      const u = (i * 53 + seed * 7) % 89
      const a = (t / 97) * Math.PI * 2
      const d = (u / 89) * br
      ctx.beginPath()
      ctx.arc(bx + Math.cos(a) * d * 0.95, by + Math.sin(a) * d * 0.5, 2.1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  seedDots(x + w * 0.62, y + h * 0.32, 70, 55, 1) // Russia-ish
  seedDots(x + w * 0.38, y + h * 0.62, 55, 48, 2) // Africa-ish

  // Connection arc
  ctx.strokeStyle = COLORS.cyan
  ctx.lineWidth = 3
  ctx.shadowColor = COLORS.cyan
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.moveTo(x + w * 0.55, y + h * 0.35)
  ctx.quadraticCurveTo(x + w * 0.45, y + h * 0.18, x + w * 0.4, y + h * 0.58)
  ctx.stroke()
  ctx.shadowBlur = 0

  // Endpoints
  ctx.fillStyle = COLORS.neon
  ctx.beginPath()
  ctx.arc(x + w * 0.55, y + h * 0.35, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + w * 0.4, y + h * 0.58, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = COLORS.neon
  ctx.font = '600 18px "Manrope", "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  const lines = wrapText(ctx, caption, w - 28)
  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, y + h - 48 + i * 22)
  })
  ctx.restore()
}

function drawFooter(ctx, copy) {
  const bannerY = HEIGHT - 220
  roundRect(ctx, 48, bannerY, WIDTH - 96, 88, 22)
  ctx.fillStyle = 'rgba(6,28,36,0.9)'
  ctx.fill()
  ctx.strokeStyle = COLORS.panelBorder
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.font = '28px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('🌍', 72, bannerY + 44)
  ctx.fillStyle = COLORS.white
  ctx.font = '600 22px "Manrope", "Segoe UI", sans-serif'
  const ctaLines = wrapText(ctx, copy.cta, WIDTH - 200)
  ctaLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, 120, bannerY + 32 + i * 28)
  })

  ctx.fillStyle = COLORS.muted
  ctx.font = '600 22px "Manrope", "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🌐 moxtapp.ru', 56, HEIGHT - 70)
  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.neon
  ctx.font = '600 20px "Manrope", "Segoe UI", sans-serif'
  ctx.fillText(copy.footerTagline, WIDTH / 2, HEIGHT - 70)
  ctx.textAlign = 'right'
  ctx.font = '28px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.fillText('💱 📦 🤝', WIDTH - 56, HEIGHT - 70)
}

export async function renderShareBadge({
  variant = 'personal',
  title = 'MOXT',
  firstName,
  lastName,
  city = '',
  country = '',
  verified = false,
  qrUrl,
  avatarUrl,
  copy = {},
}) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  const resolvedCopy = {
    slogan: copy.slogan || 'Digital bridge between Russia and Africa',
    verifiedChip: copy.verifiedChip || 'MOXT VERIFIED',
    verifiedUser: copy.verifiedUser || 'Verified user',
    scanHint: copy.scanHint || 'Scan the QR code to contact me on MOXT',
    bridgeCaption: copy.bridgeCaption || 'Connecting Russia and Africa',
    cta: copy.cta || "I use MOXT. Join the Russia–Africa digital community",
    footerTagline: copy.footerTagline || 'Your bridge to new opportunities',
    features: {
      exchange: copy.features?.exchange || 'Exchange',
      parcels: copy.features?.parcels || 'Parcels',
      marketplace: copy.features?.marketplace || 'Marketplace',
      community: copy.features?.community || 'Community',
      jobs: copy.features?.jobs || 'Jobs',
      events: copy.features?.events || 'Events',
    },
  }

  drawBackground(ctx)
  drawHeader(ctx, resolvedCopy, verified)

  const { first, last } = splitName(title, firstName, lastName)
  const fullName = [first, last].filter(Boolean).join(' ')
  const avatarCx = 130
  const avatarCy = 230
  const avatarR = 78
  await drawAvatar(ctx, avatarUrl, fullName, avatarCx, avatarCy, avatarR)
  if (verified) drawVerifiedDot(ctx, avatarCx + avatarR * 0.7, avatarCy + avatarR * 0.7)
  drawProfileBlock(
    ctx,
    {
      first,
      last,
      city,
      country: country || (variant === 'business' ? '' : ''),
      verified,
      copy: resolvedCopy,
    },
    avatarCx,
    avatarCy,
    avatarR,
  )

  const railX = 48
  const railY = 380
  drawFeatureRail(ctx, resolvedCopy, railX, railY)

  const qrSize = 360
  const qrX = (WIDTH - qrSize) / 2 + 20
  const qrY = 430
  drawQrFrame(ctx, qrX, qrY, qrSize)
  if (qrUrl) {
    try {
      const qrImg = await loadImage(qrUrl, { crossOrigin: 'anonymous' })
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    } catch {
      /* leave white panel */
    }
  }

  ctx.save()
  ctx.fillStyle = COLORS.muted
  ctx.font = '600 22px "Manrope", "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  const hintLines = wrapText(ctx, resolvedCopy.scanHint, 420)
  hintLines.forEach((line, i) => {
    ctx.fillText(line, qrX + qrSize / 2, qrY + qrSize + 52 + i * 28)
  })
  ctx.restore()

  drawBridgeMap(ctx, WIDTH - 320, 400, 270, 420, resolvedCopy.bridgeCaption)
  drawFooter(ctx, resolvedCopy)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas-export-failed'))
    }, 'image/png')
  })
}
