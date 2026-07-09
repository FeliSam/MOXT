#!/usr/bin/env node
/**
 * MOXT — automatisation complète Yandex + Supabase
 *
 *   npm run setup:yandex-all
 *
 * Étapes :
 *   1. Provision Yandex (SA, Postbox, clés, DNS)
 *   2. Phase 2 Supabase (send-sms, SMTP, hook)
 *   3. CDN + DNS + HTTPS (moxtapp.ru)
 *
 * Variables :
 *   MOXT_SKIP_CDN=1       sauter CDN/DNS
 *   MOXT_SKIP_PHASE2=1    sauter Postbox/SMS
 *   MOXT_SKIP_SUPABASE=1  idem sur config push
 *   MOXT_PROVISION_FORCE=1 régénérer clés Yandex
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function runScript(scriptName) {
  const scriptPath = path.join(root, 'scripts', scriptName)
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  })
  if ((result.status ?? 1) !== 0) process.exit(result.status || 1)
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — setup Yandex complet')
  console.log('══════════════════════════════════════')

  if (process.env.MOXT_SKIP_PHASE2 !== '1') {
    log('Étape 1/3', 'Provision Yandex Auth + Supabase')
    runScript('provision-yandex-auth.mjs')
    runScript('setup-phase2-postbox-sms.mjs')
  }

  if (process.env.MOXT_SKIP_CDN !== '1') {
    log('Étape 2/3', 'CDN + DNS + certificat')
    runScript('setup-yandex-cdn.mjs')
  }

  log('Étape 3/3', 'Déploiement site (optionnel)')
  if (process.env.MOXT_SKIP_DEPLOY !== '1') {
    const deploy = spawnSync(process.execPath, [path.join(root, 'scripts', 'deploy-yandex.mjs')], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    })
    if ((deploy.status ?? 1) !== 0) {
      console.warn('\n  ⚠ Déploiement site ignoré (build/upload échoué)')
    }
  } else {
    console.log('  (MOXT_SKIP_DEPLOY=1 — lancez npm run web:deploy:yandex)')
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Setup Yandex terminé')
  console.log('══════════════════════════════════════')
  console.log('\n  Site test : https://moxtapp-web.website.yandexcloud.net')
  console.log('  Prod      : https://moxtapp.ru (après propagation DNS)')
  console.log('\n  Si NS encore chez REG.RU → ns1/ns2.yandexcloud.net')
  console.log('  CNS SMS   : npm run setup:cns (sandbox) puis modèle Authorization en console')
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
