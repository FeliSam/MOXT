import { readdir, readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url)
const MAX_JS_BYTES = 250 * 1024
const MAX_CSS_BYTES = 120 * 1024

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const directoryPath = fileURLToPath(directory)
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directoryPath, entry.name)
      return entry.isDirectory() ? filesIn(new URL(`${entry.name}/`, directory)) : path
    }),
  )
  return nested.flat()
}

const required = ['index.html', 'manifest.webmanifest', 'offline.html', 'sw.js', 'version.json']
await Promise.all(
  required.map(async (name) => {
    const content = await readFile(new URL(name, DIST), 'utf8')
    if (!content.trim()) throw new Error(`Artefact vide: ${name}`)
  }),
)

const files = await filesIn(DIST)
const violations = []
for (const file of files) {
  const size = (await stat(file)).size
  if (file.endsWith('.js') && size > MAX_JS_BYTES) {
    violations.push(`${file}: ${(size / 1024).toFixed(1)} KiB JS`)
  }
  if (file.endsWith('.css') && size > MAX_CSS_BYTES) {
    violations.push(`${file}: ${(size / 1024).toFixed(1)} KiB CSS`)
  }
}

if (violations.length) {
  throw new Error(`Budgets dépassés:\n${violations.join('\n')}`)
}

console.log(`Qualité livraison validée: ${files.length} artefacts, budgets respectés.`)
