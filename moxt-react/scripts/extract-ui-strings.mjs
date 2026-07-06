import fs from 'node:fs'
import path from 'node:path'

const roots = ['src/pages', 'src/components', 'src/features', 'src/config']
const strings = new Set()
const patterns = [
  />\s*([^<{][^<{]*?)\s*</g,
  /label="([^"]+)"/g,
  /title="([^"]+)"/g,
  /description="([^"]+)"/g,
  /placeholder="([^"]+)"/g,
  /eyebrow="([^"]+)"/g,
  /aria-label="([^"]+)"/g,
]

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(jsx|js)$/.test(entry.name) && !entry.name.includes('.test.')) {
      const content = fs.readFileSync(full, 'utf8')
      patterns.forEach((pattern) => {
        let match = pattern.exec(content)
        while (match) {
          const value = match[1].trim()
          if (
            value.length > 1 &&
            value.length < 140 &&
            !value.startsWith('{') &&
            !/^\d/.test(value) &&
            !value.includes('${')
          ) {
            strings.add(value)
          }
          match = pattern.exec(content)
        }
      })
    }
  }
}

roots.forEach(walk)
const sorted = [...strings].sort()
console.log(JSON.stringify(sorted, null, 2))
