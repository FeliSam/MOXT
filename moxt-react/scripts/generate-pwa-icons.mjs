import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const logoPath = path.join(publicDir, 'assets', 'logos', 'X.svg')
const logoSvg = fs.readFileSync(logoPath, 'utf8')

/** Fond plein cadre (sans coins pré-arrondis) — obligatoire pour iOS / PWA. */
const flatIconSvg = logoSvg.replace(/rx="36"/g, 'rx="0"')

const BRAND = { r: 7, g: 89, b: 77, alpha: 1 }

/**
 * Icône « any » / Apple : carré opaque, dégradé bord à bord.
 * iOS applique lui-même le masque squircle — ne jamais livrer de PNG pré-arrondi.
 */
async function writeAppIcon(size, filename) {
  const rendered = await sharp(Buffer.from(flatIconSvg))
    .resize(size, size, { fit: 'fill' })
    .png()
    .toBuffer()

  // Aplatit toute transparence résiduelle (shadow SVG, antialias) sur le vert marque.
  const buffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND,
    },
  })
    .composite([{ input: rendered, left: 0, top: 0 }])
    .flatten({ background: BRAND })
    .removeAlpha()
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(publicDir, filename), buffer)
}

/** Icône maskable Android : zone sûre ~80 %, fond marque opaque. */
async function writeMaskableIcon(size, filename) {
  const inner = Math.round(size * 0.8)
  const offset = Math.round((size - inner) / 2)
  const logo = await sharp(Buffer.from(flatIconSvg))
    .resize(inner, inner, { fit: 'fill' })
    .png()
    .toBuffer()

  const buffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND,
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .flatten({ background: BRAND })
    .removeAlpha()
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(publicDir, filename), buffer)
}

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), logoSvg)
fs.copyFileSync(logoPath, path.join(publicDir, 'app-icon.svg'))

await writeAppIcon(192, 'icon-192.png')
await writeAppIcon(512, 'icon-512.png')
await writeAppIcon(180, 'apple-touch-icon.png')
await writeMaskableIcon(512, 'icon-512-maskable.png')

console.log('PWA icons generated (full-bleed opaque) from assets/logos/X.svg')
