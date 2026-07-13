import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const logoPath = path.join(publicDir, 'assets', 'logos', 'X.svg')
const logoSvg = fs.readFileSync(logoPath, 'utf8')

/** Rendu plein cadre : le SVG inclut déjà le fond dégradé et les coins arrondis. */
async function writeAppIcon(size, filename) {
  const buffer = await sharp(Buffer.from(logoSvg))
    .resize(size, size, { fit: 'fill' })
    .png()
    .toBuffer()
  fs.writeFileSync(path.join(publicDir, filename), buffer)
}

/** Icône maskable Android : logo réduit dans la zone sûre (~80 %). */
async function writeMaskableIcon(size, filename) {
  const inner = Math.round(size * 0.8)
  const offset = Math.round((size - inner) / 2)
  const logo = await sharp(Buffer.from(logoSvg)).resize(inner, inner, { fit: 'fill' }).png().toBuffer()
  const buffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 7, g: 89, b: 77, alpha: 1 },
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
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

console.log('PWA icons generated from assets/logos/X.svg')
