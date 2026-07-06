import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const workspaceRoot = path.resolve(root, '..')
const mobileAssets = path.join(workspaceRoot, 'apps', 'mobile', 'assets', 'images')

const sources = {
  icon: path.join(mobileAssets, 'icon.png'),
  splash: path.join(mobileAssets, 'splash-icon.png'),
  androidForeground: path.join(mobileAssets, 'android-icon-foreground.png'),
  androidBackground: path.join(mobileAssets, 'android-icon-background.png'),
}

const targets = {
  iosIcon: [path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png')],
  iosSplash: [
    path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset', 'splash-2732x2732.png'),
    path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset', 'splash-2732x2732-1.png'),
    path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset', 'splash-2732x2732-2.png'),
  ],
  androidIcon: [
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-mdpi', 'ic_launcher.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xhdpi', 'ic_launcher.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', 'ic_launcher.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi', 'ic_launcher.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-mdpi', 'ic_launcher_round.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher_round.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xhdpi', 'ic_launcher_round.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', 'ic_launcher_round.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi', 'ic_launcher_round.png'),
  ],
  androidForeground: [
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-mdpi', 'ic_launcher_foreground.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher_foreground.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xhdpi', 'ic_launcher_foreground.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', 'ic_launcher_foreground.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi', 'ic_launcher_foreground.png'),
  ],
  androidSplash: [
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-port-mdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-port-hdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-port-xhdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-port-xxhdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-port-xxxhdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-land-mdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-land-hdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-land-xhdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-land-xxhdpi', 'splash.png'),
    path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-land-xxxhdpi', 'splash.png'),
  ],
}

const white = { r: 255, g: 255, b: 255, alpha: 1 }

async function ensureExists(file) {
  await fs.access(file)
}

async function overwriteMatchingSize(source, destination, options = {}) {
  await ensureExists(destination)
  const metadata = await sharp(destination).metadata()
  const width = metadata.width
  const height = metadata.height

  if (!width || !height) {
    throw new Error(`Dimensions introuvables pour ${destination}`)
  }

  let pipeline = sharp(source).resize({
    width,
    height,
    fit: options.fit || 'contain',
    background: options.background || white,
  })

  if (options.flatten) {
    pipeline = pipeline.flatten({ background: options.background || white })
  }

  await pipeline.png().toFile(destination)
}

async function run() {
  await Promise.all(Object.values(sources).map(ensureExists))

  await Promise.all(targets.iosIcon.map((file) => overwriteMatchingSize(sources.icon, file, { fit: 'cover' })))
  await Promise.all(
    targets.iosSplash.map((file) =>
      overwriteMatchingSize(sources.splash, file, {
        fit: 'contain',
        background: white,
      }),
    ),
  )
  await Promise.all(
    targets.androidIcon.map((file) =>
      overwriteMatchingSize(sources.icon, file, {
        fit: 'cover',
      }),
    ),
  )
  await Promise.all(
    targets.androidForeground.map((file) =>
      overwriteMatchingSize(sources.androidForeground, file, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      }),
    ),
  )
  await Promise.all(
    targets.androidSplash.map((file) =>
      overwriteMatchingSize(sources.splash, file, {
        fit: 'contain',
        background: white,
        flatten: true,
      }),
    ),
  )

  console.log('Capacitor native assets synced from apps/mobile/assets/images')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
