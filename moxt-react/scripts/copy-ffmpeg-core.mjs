/**
 * Copie @ffmpeg/core (ESM) vers public/ffmpeg.
 * Le build UMD échoue avec « failed to import ffmpeg-core.js » via toBlobURL + worker ES.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const rootDir = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(rootDir, '..')
const outDir = path.join(appRoot, 'public', 'ffmpeg')

function resolveCoreEsm() {
  try {
    const pkg = require.resolve('@ffmpeg/core/package.json')
    return path.join(path.dirname(pkg), 'dist', 'esm')
  } catch {
    const monorepo = path.resolve(appRoot, '..', 'node_modules', '@ffmpeg', 'core', 'dist', 'esm')
    if (fs.existsSync(path.join(monorepo, 'ffmpeg-core.wasm'))) return monorepo
    throw new Error('@ffmpeg/core introuvable — npm install @ffmpeg/core')
  }
}

const dist = resolveCoreEsm()
fs.mkdirSync(outDir, { recursive: true })
for (const name of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  const from = path.join(dist, name)
  const to = path.join(outDir, name)
  if (!fs.existsSync(from)) throw new Error(`Manquant: ${from}`)
  fs.copyFileSync(from, to)
  console.log(`[ffmpeg] ${name} → public/ffmpeg/ (ESM, ${fs.statSync(to).size} bytes)`)
}
