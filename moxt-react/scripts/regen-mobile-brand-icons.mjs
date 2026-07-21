import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const brand = path.join(root, 'public', 'assets', 'brand', 'mark.png')
const mobile = path.join(root, '..', 'apps', 'mobile', 'assets', 'images')
const teal = { r: 8, g: 112, b: 95, alpha: 1 }
const transparent = { r: 0, g: 0, b: 0, alpha: 0 }
const white = { r: 255, g: 255, b: 255, alpha: 1 }

await sharp(brand)
  .resize(1024, 1024, { fit: 'cover', position: 'centre' })
  .png()
  .toFile(path.join(mobile, 'icon.png'))

const fgSize = 1024
const inset = Math.round(fgSize * 0.18)
const inner = fgSize - inset * 2
const logo = await sharp(brand)
  .resize(inner, inner, { fit: 'contain', background: transparent })
  .png()
  .toBuffer()

await sharp({
  create: { width: fgSize, height: fgSize, channels: 4, background: transparent },
})
  .composite([{ input: logo, left: inset, top: inset }])
  .png()
  .toFile(path.join(mobile, 'android-icon-foreground.png'))

await sharp({
  create: { width: 1024, height: 1024, channels: 3, background: teal },
})
  .png()
  .toFile(path.join(mobile, 'android-icon-background.png'))

await sharp(brand)
  .resize(512, 512, { fit: 'contain', background: white })
  .flatten({ background: white })
  .png()
  .toFile(path.join(mobile, 'splash-icon.png'))

console.log('Mobile brand assets rewritten from mark.png')
