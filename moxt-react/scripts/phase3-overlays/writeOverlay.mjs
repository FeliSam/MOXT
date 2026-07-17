import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const dir = path.dirname(fileURLToPath(import.meta.url))

export function writeOverlay(name, rows) {
  const fr = JSON.parse(fs.readFileSync(path.join(dir, `${name}-fr.json`), 'utf8'))
  const out = { en: {}, ru: {}, pt: {} }
  const seen = new Set()
  for (const [key, en, ru, pt] of rows) {
    if (!fr[key]) throw new Error(`${name}: unknown key ${key}`)
    const frPh = [...String(fr[key]).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
    for (const [lang, val] of [
      ['en', en],
      ['ru', ru],
      ['pt', pt],
    ]) {
      const ph = [...String(val).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
      if (ph !== frPh) {
        throw new Error(`${name} ${lang} ${key}: placeholder mismatch FR=[${frPh}] vs [${ph}]`)
      }
      out[lang][key] = val
    }
    seen.add(key)
  }
  const missing = Object.keys(fr).filter((k) => !seen.has(k))
  if (missing.length) {
    throw new Error(`${name}: missing ${missing.length} keys: ${missing.slice(0, 15).join(', ')}`)
  }
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(out))
  console.log('wrote', name, Object.keys(fr).length)
}
