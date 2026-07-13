import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const sourcePng = path.join(publicDir, 'assets', 'brand', 'moxt-x.png')

if (!fs.existsSync(sourcePng)) {
  throw new Error(`Logo introuvable: ${sourcePng}`)
}

const BRAND_DARK = { r: 6, g: 12, b: 28 }

async function writeIcon(size, filename, { pad = 0 } = {}) {
  const inner = pad ? Math.round(size * (1 - pad * 2)) : size
  const offset = pad ? Math.round((size - inner) / 2) : 0
  const logo = await sharp(sourcePng)
    .resize(inner, inner, { fit: 'cover' })
    .png()
    .toBuffer()

  const buffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BRAND_DARK,
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(publicDir, filename), buffer)
}

// Noms actuels
await writeIcon(32, 'moxt-x-32.png')
await writeIcon(180, 'moxt-x-180.png')
await writeIcon(192, 'moxt-x-192.png')
await writeIcon(512, 'moxt-x-512.png')
await writeIcon(512, 'moxt-x-512-maskable.png', { pad: 0.1 })

// Chemins legacy (Safari / caches / CDN) → toujours la nouvelle image
await writeIcon(32, 'favicon-32.png')
await writeIcon(180, 'apple-touch-icon.png')
await writeIcon(192, 'icon-192.png')
await writeIcon(512, 'icon-512.png')
await writeIcon(512, 'icon-512-maskable.png', { pad: 0.1 })

// Supprimer les vieux SVG placeholders teal
for (const stale of [
  'favicon.svg',
  'app-icon.svg',
  path.join('assets', 'logos', 'X.svg'),
  path.join('assets', 'logos', 'MOXTlogo.svg'),
]) {
  const full = path.join(publicDir, stale)
  if (fs.existsSync(full)) {
    fs.unlinkSync(full)
    console.log('deleted', stale)
  }
}

fs.copyFileSync(sourcePng, path.join(publicDir, 'assets', 'logos', 'X.png'))

console.log('PWA icons aligned from assets/brand/moxt-x.png (+ legacy names overwritten)')
