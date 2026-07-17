/**
 * Apply remaining-overrides.json onto g4/g5 overlays, then caller re-runs finalize.
 * remaining-overrides format: { key: [en, ru, pt] }
 */
import fs from 'fs'
import { writeOverlay } from './writeOverlay.mjs'

const remPath = 'remaining-overrides.json'
if (!fs.existsSync(remPath)) {
  console.error('missing remaining-overrides.json')
  process.exit(1)
}
const rem = JSON.parse(fs.readFileSync(remPath, 'utf8'))
console.log('remaining overrides', Object.keys(rem).length)

for (const group of ['g4', 'g5']) {
  const fr = JSON.parse(fs.readFileSync(`${group}-fr.json`, 'utf8'))
  const ov = JSON.parse(fs.readFileSync(`${group}.json`, 'utf8'))
  let updated = 0
  const rows = []
  for (const key of Object.keys(fr)) {
    if (rem[key]) {
      rows.push([key, rem[key][0], rem[key][1], rem[key][2]])
      updated++
    } else {
      rows.push([key, ov.en[key], ov.ru[key], ov.pt[key]])
    }
  }
  writeOverlay(group, rows)
  console.log(group, 'updated', updated)
}
