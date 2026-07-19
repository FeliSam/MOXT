const WIDTH = 1080
const HEIGHT = 1350

const PALETTES = {
  personal: {
    bg: ['#0f766e', '#0d9488', '#22d3ee'],
    blobA: 'rgba(34,211,238,0.35)',
    blobB: 'rgba(255,255,255,0.14)',
    accent: '#22d3ee',
    chipBg: 'rgba(255,255,255,0.12)',
    emojis: ['💬', '📦', '💸', '✨'],
    tagline: '🚀',
  },
  business: {
    bg: ['#020617', '#0f172a', '#134e4a'],
    blobA: 'rgba(245,158,11,0.28)',
    blobB: 'rgba(255,255,255,0.08)',
    accent: '#f59e0b',
    chipBg: 'rgba(245,158,11,0.16)',
    emojis: ['💼', '📈', '🤝', '⭐'],
    tagline: '⭐',
  },
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
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
  const words = text.split(/\s+/)
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

function drawBackground(ctx, palette) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  gradient.addColorStop(0, palette.bg[0])
  gradient.addColorStop(0.55, palette.bg[1])
  gradient.addColorStop(1, palette.bg[2])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.save()
  ctx.filter = 'blur(60px)'
  ctx.fillStyle = palette.blobA
  ctx.beginPath()
  ctx.arc(WIDTH - 120, 160, 260, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = palette.blobB
  ctx.beginPath()
  ctx.arc(90, HEIGHT - 220, 240, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Subtle dot-grid texture for depth.
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.fillStyle = '#ffffff'
  for (let x = 40; x < WIDTH; x += 46) {
    for (let y = 40; y < HEIGHT; y += 46) {
      ctx.beginPath()
      ctx.arc(x, y, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  // Large decorative emoji, low opacity, purely atmospheric.
  ctx.save()
  ctx.globalAlpha = 0.1
  ctx.font = '210px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.fillText(palette.emojis[1], -30, 300)
  ctx.font = '170px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.fillText(palette.emojis[2], WIDTH - 190, HEIGHT - 120)
  ctx.restore()
}

export async function renderShareBadge({
  variant = 'personal',
  title = 'MOXT',
  city = '',
  verified = false,
  qrUrl,
  avatarUrl,
  tagline,
  subtitle,
}) {
  const palette = PALETTES[variant === 'business' ? 'business' : 'personal']
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  drawBackground(ctx, palette)

  // Top brand chip.
  ctx.save()
  roundRect(ctx, 60, 60, 220, 64, 32)
  ctx.fillStyle = palette.chipBg
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 30px "Manrope", "Segoe UI", sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('MOXT', 92, 93)
  ctx.restore()

  ctx.save()
  ctx.font = '54px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(palette.emojis[3], WIDTH - 64, 108)
  ctx.textAlign = 'left'
  ctx.restore()

  // Avatar.
  const avatarCx = WIDTH / 2
  const avatarCy = 300
  const avatarR = 96
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
  ctx.arc(avatarCx, avatarCy, avatarR + 6, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (avatarImg) {
    ctx.drawImage(avatarImg, avatarCx - avatarR, avatarCy - avatarR, avatarR * 2, avatarR * 2)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.16)'
    ctx.fillRect(avatarCx - avatarR, avatarCy - avatarR, avatarR * 2, avatarR * 2)
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 68px "Manrope", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials(title), avatarCx, avatarCy + 6)
    ctx.textAlign = 'left'
  }
  ctx.restore()

  // Name.
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.font = '800 62px "Manrope", "Segoe UI", sans-serif'
  const nameY = avatarCy + avatarR + 90
  ctx.fillText(title, WIDTH / 2, nameY)
  if (verified) {
    const nameWidth = ctx.measureText(title).width
    ctx.font = '46px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
    ctx.fillText('✅', WIDTH / 2 + nameWidth / 2 + 48, nameY - 4)
  }
  ctx.restore()

  // Subtitle / city.
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '500 34px "Manrope", "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  const metaParts = [subtitle, city].filter(Boolean)
  if (metaParts.length) {
    ctx.fillText(metaParts.join('  ·  '), WIDTH / 2, nameY + 52)
  }
  ctx.restore()

  // QR panel.
  const qrSize = 460
  const qrX = (WIDTH - qrSize) / 2
  const qrY = nameY + (metaParts.length ? 110 : 70)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 18
  roundRect(ctx, qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 40)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  if (qrUrl) {
    try {
      const qrImg = await loadImage(qrUrl, { crossOrigin: 'anonymous' })
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    } catch {
      // Leave the white panel empty rather than failing the whole export.
    }
  }

  // Tagline + CTA.
  const ctaY = qrY + qrSize + 110
  ctx.save()
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 52px "Manrope", "Segoe UI", sans-serif'
  ctx.fillText(`${tagline?.line1 || "J'utilise MOXT"} ${palette.tagline}`, WIDTH / 2, ctaY)
  ctx.font = '600 36px "Manrope", "Segoe UI", sans-serif'
  ctx.fillStyle = palette.accent
  const ctaLines = wrapText(ctx, tagline?.line2 || 'Rejoins-moi sur MOXT', WIDTH - 160)
  ctaLines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, ctaY + 56 + index * 46)
  })
  ctx.restore()

  // Footer.
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, HEIGHT - 90)
  ctx.lineTo(WIDTH - 80, HEIGHT - 90)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = '600 30px "Manrope", "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('moxtapp.ru', WIDTH / 2, HEIGHT - 46)
  ctx.restore()

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas-export-failed'))
    }, 'image/png')
  })
}
