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

// Nouveaux noms uniquement — évite le cache Safari/CDN des anciens icon-*.png
await writeIcon(32, 'moxt-x-32.png')
await writeIcon(180, 'moxt-x-180.png')
await writeIcon(192, 'moxt-x-192.png')
await writeIcon(512, 'moxt-x-512.png')
await writeIcon(512, 'moxt-x-512-maskable.png', { pad: 0.1 })

console.log('PWA icons generated from assets/brand/moxt-x.png (nouveaux noms)')
