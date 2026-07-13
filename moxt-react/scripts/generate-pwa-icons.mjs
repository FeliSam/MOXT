import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="MOXT">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07594d"/>
      <stop offset="55%" stop-color="#08705f"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d2f8ec"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="396" cy="116" r="72" fill="#36c6aa" opacity="0.35"/>
  <circle cx="96" cy="404" r="88" fill="#60a5fa" opacity="0.28"/>
  <path fill="url(#mark)" d="M148 156h72v200H148zm116 0h72l56 120 56-120h72L332 356h-72z"/>
  <path fill="#ffffff" opacity="0.92" d="M148 372h244v28H148z"/>
</svg>`

async function writePng(size, filename) {
  const buffer = await sharp(Buffer.from(appIconSvg)).resize(size, size).png().toBuffer()
  fs.writeFileSync(path.join(publicDir, filename), buffer)
}

fs.writeFileSync(path.join(publicDir, 'app-icon.svg'), appIconSvg)
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), appIconSvg)
await writePng(192, 'icon-192.png')
await writePng(512, 'icon-512.png')
await writePng(180, 'apple-touch-icon.png')

console.log('PWA icons generated in public/')
