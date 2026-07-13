#!/usr/bin/env node
/**
 * Génère une paire VAPID pour Web Push (PWA Safari iOS, Chrome, etc.).
 * Usage : node scripts/generate-vapid-keys.mjs
 */
import webpush from 'web-push'
import { randomBytes } from 'node:crypto'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { upsertPhase2Env } from './lib/env.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const phase2Path = path.join(root, 'scripts', 'phase2.env')

async function main() {
  const { publicKey, privateKey } = webpush.generateVAPIDKeys()
  const dispatchSecret = randomBytes(24).toString('base64url')

  console.log('\n✓ Paire VAPID générée\n')
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`)
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
  console.log(`PUSH_DISPATCH_SECRET=${dispatchSecret}`)

  if (existsSync(phase2Path)) {
    upsertPhase2Env({
      VITE_VAPID_PUBLIC_KEY: publicKey,
      VAPID_PUBLIC_KEY: publicKey,
      VAPID_PRIVATE_KEY: privateKey,
      PUSH_DISPATCH_SECRET: dispatchSecret,
    })
    console.log(`\n✓ Enregistré dans ${phase2Path}`)
  } else {
    console.log('\nℹ Créez scripts/phase2.env puis relancez, ou copiez les variables ci-dessus.')
  }

  const examplePath = path.join(root, 'moxt-react', '.env.example')
  if (existsSync(examplePath)) {
    let content = readFileSync(examplePath, 'utf8')
    if (!content.includes('VITE_VAPID_PUBLIC_KEY')) {
      content += `\n# Web Push (PWA iOS 16.4+, Chrome…) — générer : node scripts/generate-vapid-keys.mjs\nVITE_VAPID_PUBLIC_KEY=\n`
      writeFileSync(examplePath, content, 'utf8')
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
