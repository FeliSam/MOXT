#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyTranslationBundle,
  buildTranslationBundle,
  diffTranslationBundle,
  validateTranslationBundle,
} from '../packages/shared/src/i18n/translationBundle.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DEFAULT_FILE = path.join(ROOT, 'translations', 'moxt-translations.json')

function usage() {
  console.log(`Usage:
  node scripts/i18n-translations.mjs export [--out translations/moxt-translations.json]
  node scripts/i18n-translations.mjs import [--in translations/moxt-translations.json] [--apply]

export  — génère un JSON (phrases UI + clés structurées) pour traduction externe.
import  — valide le JSON et affiche les différences.
import --apply — applique les changements aux catalogues UI et locales en/ru/pt.`)
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = { command, in: DEFAULT_FILE, out: DEFAULT_FILE, apply: false }
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i]
    if (token === '--apply') options.apply = true
    else if (token === '--in') options.in = path.resolve(ROOT, rest[++i])
    else if (token === '--out') options.out = path.resolve(ROOT, rest[++i])
  }
  return options
}

function exportBundle(outFile) {
  const bundle = buildTranslationBundle()
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8')
  console.log(
    `Export OK → ${path.relative(ROOT, outFile)} (${bundle.uiPhrases.length} phrases UI, ${bundle.keys.length} clés)`,
  )
}

function importBundle(inFile, apply) {
  if (!fs.existsSync(inFile)) {
    throw new Error(`Fichier introuvable : ${inFile}`)
  }
  const incoming = validateTranslationBundle(JSON.parse(fs.readFileSync(inFile, 'utf8')))
  const current = buildTranslationBundle()
  const { uiChanges, keyChanges } = diffTranslationBundle(current, incoming)

  console.log(`Import analysé : ${path.relative(ROOT, inFile)}`)
  console.log(`  ${uiChanges.length} phrase(s) UI modifiée(s)`)
  console.log(`  ${keyChanges.length} clé(s) structurée(s) modifiée(s)`)

  if (!uiChanges.length && !keyChanges.length) {
    console.log('Aucun changement détecté.')
    return
  }

  if (!apply) {
    const preview = [...uiChanges.slice(0, 5), ...keyChanges.slice(0, 5)]
    for (const change of preview) {
      if (change.fr) {
        console.log(`  [ui/${change.lang}] ${change.fr}`)
        console.log(`    ${change.from} → ${change.to}`)
      } else {
        console.log(`  [key/${change.lang}] ${change.key}`)
        console.log(`    ${change.from} → ${change.to}`)
      }
    }
    if (uiChanges.length + keyChanges.length > preview.length) {
      console.log('  … (ajoutez --apply pour écrire les fichiers)')
    }
    return
  }

  const result = applyTranslationBundle(incoming, {
    rootDir: ROOT,
    readFile: (filePath) => fs.readFileSync(filePath, 'utf8'),
    writeFile: (filePath, content) => fs.writeFileSync(filePath, content, 'utf8'),
  })
  console.log(`Appliqué : ${result.filesUpdated.length} fichier(s) mis à jour`)
  for (const rel of result.filesUpdated) {
    console.log(`  - ${rel}`)
  }
}

const options = parseArgs(process.argv.slice(2))
if (!options.command || options.command === '--help' || options.command === '-h') {
  usage()
  process.exit(options.command ? 0 : 1)
}

try {
  if (options.command === 'export') exportBundle(options.out)
  else if (options.command === 'import') importBundle(options.in, options.apply)
  else {
    usage()
    process.exit(1)
  }
} catch (error) {
  console.error(`Erreur : ${error.message}`)
  process.exit(1)
}
