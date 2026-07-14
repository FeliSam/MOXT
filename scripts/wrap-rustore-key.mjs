#!/usr/bin/env node
/**
 * Enveloppe un blob Base64 PKCS#8 RuStore (modal « Clé API ») en fichier PEM.
 *
 * Usage :
 *   npm run rustore:wrap-key -- chemin/vers/base64.txt
 *   npm run rustore:wrap-key -- chemin/vers/base64.txt scripts/rustore-private-key.pem
 *
 * Si la sortie existe déjà en PEM valide, refus sauf --force.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_RUSTORE_KEY_PATH,
  normalizeRustorePrivateKeyPem,
  wrapPkcs8Base64AsPem,
} from './lib/rustore.mjs'
import { root } from './lib/env.mjs'

function resolveArg(p) {
  return path.isAbsolute(p) ? p : path.resolve(root, p)
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--force')
  const force = process.argv.includes('--force')
  const inPath = args[0] ? resolveArg(args[0]) : null
  const outRel = args[1] || DEFAULT_RUSTORE_KEY_PATH
  const outPath = resolveArg(outRel)

  if (!inPath) {
    console.error(`Usage: npm run rustore:wrap-key -- <fichier-base64> [${DEFAULT_RUSTORE_KEY_PATH}]`)
    console.error('  Le fichier d’entrée = texte de la modal RuStore (Base64 seul ou PEM).')
    process.exit(1)
  }
  if (!existsSync(inPath)) {
    console.error(`Fichier introuvable : ${inPath}`)
    process.exit(1)
  }

  const raw = readFileSync(inPath, 'utf8')
  let pem
  try {
    pem = raw.includes('BEGIN')
      ? normalizeRustorePrivateKeyPem(raw)
      : wrapPkcs8Base64AsPem(raw)
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  }

  if (existsSync(outPath) && !force) {
    console.error(`Déjà présent : ${outPath} (utiliser --force pour écraser)`)
    process.exit(1)
  }

  writeFileSync(outPath, pem.endsWith('\n') ? pem : `${pem}\n`, 'utf8')
  console.log(`PEM écrit → ${outPath}`)
  console.log('Ensuite : RUSTORE_KEY_ID=... dans scripts/phase2.env, puis npm run check:rustore')
}

main()
