#!/usr/bin/env node
/**
 * Régénère le manifeste embarqué des portraits d’avatar depuis une copie locale ou le CDN.
 *   node scripts/sync-portrait-manifest.mjs [chemin/manifest.json | URL]
 * Défaut : https://cdn.moxtapp.ru/avatars/portraits/v1/manifest.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_SOURCE = 'https://cdn.moxtapp.ru/avatars/portraits/v1/manifest.json'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, 'src/features/account/avatarDicebear/portraitManifest.v1.json')
const source = process.argv[2] || DEFAULT_SOURCE

const raw = /^https?:\/\//.test(source)
  ? await (await fetch(source)).text()
  : fs.readFileSync(path.resolve(source), 'utf8')
const manifest = JSON.parse(raw.replace(/^\uFEFF/, ''))

if (!manifest.baseUrl?.startsWith('https://cdn.moxtapp.ru/avatars/portraits/')) {
  throw new Error(`baseUrl inattendu : ${manifest.baseUrl}`)
}
const items = manifest.items.map(({ id, gender, tone, hair, url, thumbUrl }) => ({
  id,
  gender,
  tone,
  hair,
  url,
  thumbUrl,
}))
const out = {
  version: manifest.version,
  baseUrl: manifest.baseUrl,
  tones: manifest.tones,
  hairstyles: manifest.hairstyles,
  items,
}
fs.writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
console.log(`portraitManifest.v1.json : ${items.length} portraits (${manifest.version})`)
