import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const sourcePng = path.join(publicDir, 'assets', 'logos', 'X.png')

if (!fs.existsSync(sourcePng)) {
  throw new Error(`Logo introuvable: ${sourcePng}`)
}

const BRAND_DARK = { r: 6, g: 12, b: 28, alpha: 1 }

/**
 * Icônes PWA / Apple depuis le vrai logo X.png (bleu/cyan néon).
 * Carré opaque — iOS applique son propre masque.
 */
async function writeAppIcon(size, filename) {
  const rendered = await sharp(sourcePng)
    .resize(size, size, { fit: 'cover' })
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
    .composite([{ input: rendered, left: 0, top: 0 }])
    .flatten({ background: BRAND_DARK })
    .removeAlpha()
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(publicDir, filename), buffer)
}

/** Maskable Android : zone sûre ~80 %. */
async function writeMaskableIcon(size, filename) {
  const inner = Math.round(size * 0.8)
  const offset = Math.round((size - inner) / 2)
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
    .flatten({ background: BRAND_DARK })
    .removeAlpha()
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(publicDir, filename), buffer)
}

await writeAppIcon(192, 'icon-192.png')
await writeAppIcon(512, 'icon-512.png')
await writeAppIcon(180, 'apple-touch-icon.png')
await writeAppIcon(32, 'favicon-32.png')
await writeMaskableIcon(512, 'icon-512-maskable.png')

fs.copyFileSync(sourcePng, path.join(publicDir, 'app-icon.png'))

console.log('PWA icons generated from assets/logos/X.png (logo marque)')
