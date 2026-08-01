import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const brand = path.join(root, 'public', 'assets', 'brand', 'mark.png')
const mobile = path.join(root, '..', 'apps', 'mobile', 'assets', 'images')
const dark = { r: 10, g: 14, b: 24, alpha: 1 }
const white = { r: 255, g: 255, b: 255, alpha: 1 }

/**
 * Carré plein (pas de coins arrondis dans le PNG).
 * Évite le double masque Android (squircle du fichier + masque launcher).
 */
async function squareBrandIcon(size) {
  const layered = await sharp(brand)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .png()
    .toBuffer()

  return sharp({
    create: { width: size, height: size, channels: 3, background: dark },
  })
    .composite([{ input: layered }])
    .flatten({ background: dark })
    .png()
    .toBuffer()
}

const iconBuf = await squareBrandIcon(1024)
await fs.writeFile(path.join(mobile, 'icon.png'), iconBuf)
await fs.writeFile(path.join(mobile, 'android-icon-foreground.png'), iconBuf)

await sharp({
  create: { width: 1024, height: 1024, channels: 3, background: dark },
})
  .png()
  .toFile(path.join(mobile, 'android-icon-background.png'))

await sharp(brand)
  .resize(512, 512, { fit: 'contain', background: white })
  .flatten({ background: white })
  .png()
  .toFile(path.join(mobile, 'splash-icon.png'))

console.log('Mobile brand icons: full-square mark (no baked squircle)')
