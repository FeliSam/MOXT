import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
const xLogoPath = path.join(publicDir, 'assets', 'logos', 'X.svg')
const xLogoSvg = fs.readFileSync(xLogoPath, 'utf8')

async function writePng(size, filename, { padding = 0.12 } = {}) {
  const inner = Math.round(size * (1 - padding * 2))
  const buffer = await sharp(Buffer.from(xLogoSvg))
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.round(size * padding),
      bottom: Math.round(size * padding),
      left: Math.round(size * padding),
      right: Math.round(size * padding),
      background: { r: 7, g: 89, b: 77, alpha: 1 },
    })
    .png()
    .toBuffer()
  fs.writeFileSync(path.join(publicDir, filename), buffer)
}

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), xLogoSvg)
fs.copyFileSync(xLogoPath, path.join(publicDir, 'app-icon.svg'))

await writePng(192, 'icon-192.png')
await writePng(512, 'icon-512.png')
await writePng(180, 'apple-touch-icon.png', { padding: 0.1 })

console.log('PWA icons generated from assets/logos/X.svg')
