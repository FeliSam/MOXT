import { createHash } from 'node:crypto'
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export function walkDistFiles(sourceDir) {
  const files = []
  for (const entry of readdirSync(sourceDir)) {
    const full = path.join(sourceDir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...walkDistFiles(full))
    } else {
      files.push(full)
    }
  }
  return files
}

export function toObjectKey(sourceDir, file) {
  return path.relative(sourceDir, file).split(path.sep).join('/')
}

export function md5File(filePath) {
  const hash = createHash('md5')
  const data = createReadStream(filePath)
  return new Promise((resolve, reject) => {
    data.on('data', (chunk) => hash.update(chunk))
    data.on('error', reject)
    data.on('end', () => resolve(hash.digest('hex')))
  })
}

export async function buildDeployManifest(sourceDir, buildId) {
  const files = walkDistFiles(sourceDir)
  const entries = {}

  for (const file of files) {
    const key = toObjectKey(sourceDir, file)
    const { size } = statSync(file)
    const md5 = await md5File(file)
    entries[key] = { size, md5 }
  }

  return {
    buildId,
    builtAt: new Date().toISOString(),
    files: entries,
  }
}

export function readDeployManifest(filePath) {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

export function writeDeployManifest(filePath, manifest) {
  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

/** Retourne les clés dont le md5 ou la taille a changé (ou nouvelles). */
export function diffDeployManifests(previous, current) {
  if (!current?.files) return []
  if (!previous?.files) return Object.keys(current.files)

  const changed = []
  for (const [key, meta] of Object.entries(current.files)) {
    const prev = previous.files[key]
    if (!prev || prev.md5 !== meta.md5 || prev.size !== meta.size) {
      changed.push(key)
    }
  }
  return changed
}

export function manifestKeysToUpload(sourceDir, manifest, keys) {
  return keys.map((key) => {
    const file = path.join(sourceDir, ...key.split('/'))
    const meta = manifest.files[key]
    return { file, key, size: meta?.size ?? 0, localEtag: meta?.md5 }
  })
}
