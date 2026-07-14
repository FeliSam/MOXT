#!/usr/bin/env node
/**
 * Vérifie la config RuStore (clé privée gitignorée + keyId) et teste l’auth API.
 * Ne publie rien — utile avant un upload AAB manuel ou via l’API.
 *
 * Setup (console FR : modal « Clé API », souvent SANS fichier .pem) :
 *   1) Console RuStore → API → créer une clé → noter le keyId (court, liste des clés)
 *      + copier le Base64 (NE PAS fermer la modal sans copier — affichage unique)
 *   2) Clé privée → scripts/rustore-private-key.pem (créé ici, PAS un téléchargement) :
 *        - PEM complet (BEGIN/END), ou Base64 seul (normalisé automatiquement)
 *      Repli : RUSTORE_PRIVATE_KEY=... dans phase2.env (même contenu) si le fichier manque
 *   3) Dans scripts/phase2.env : RUSTORE_KEY_ID=<id court> + RUSTORE_PRIVATE_KEY_PATH=...
 *      Ne jamais coller la clé privée dans RUSTORE_KEY_ID
 *   4) npm run check:rustore
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_RUSTORE_KEY_PATH,
  DEFAULT_RUSTORE_PACKAGE,
  fetchRustoreAuthToken,
  getRustoreConfig,
  looksLikeMisfiledRustorePrivateKey,
} from './lib/rustore.mjs'
import { loadPhase2Env, phase2EnvPath, root } from './lib/env.mjs'

function ok(msg) {
  console.log(`  ✓ ${msg}`)
}
function warn(msg) {
  console.log(`  ⚠ ${msg}`)
}
function fail(msg) {
  console.log(`  ✗ ${msg}`)
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — vérification RuStore')
  console.log('══════════════════════════════════════')

  const env = loadPhase2Env()
  const cfg = getRustoreConfig(env)
  let issues = 0

  console.log('\nFichiers & env')
  if (existsSync(phase2EnvPath)) ok(`scripts/phase2.env présent`)
  else {
    fail('scripts/phase2.env manquant — copier depuis scripts/phase2.env.example')
    issues += 1
  }

  if (looksLikeMisfiledRustorePrivateKey(cfg.keyId)) {
    fail(
      'RUSTORE_KEY_ID contient une clé privée (Base64 PKCS#8) — ce n’est pas le keyId. ' +
        'Mettre le keyId court de la console ; la clé privée va dans ' +
        DEFAULT_RUSTORE_KEY_PATH,
    )
    issues += 1
  } else if (cfg.keyId) {
    ok(`RUSTORE_KEY_ID renseigné (${cfg.keyId.length} car.)`)
  } else {
    fail('RUSTORE_KEY_ID manquant dans scripts/phase2.env (id court console, pas la clé)')
    issues += 1
  }

  const absKey = path.isAbsolute(cfg.privateKeyPath)
    ? cfg.privateKeyPath
    : path.resolve(root, cfg.privateKeyPath)
  if (cfg.privateKeyPem) {
    const viaEnv = cfg.keySource === 'RUSTORE_PRIVATE_KEY'
    const fmt = cfg.privateKeyPem.includes('BEGIN PRIVATE KEY')
      ? 'PEM PKCS#8'
      : 'PEM'
    ok(`Clé privée OK (${fmt}, source : ${viaEnv ? 'RUSTORE_PRIVATE_KEY (env)' : 'fichier'})`)
    if (viaEnv) {
      warn(
        'Clé lue depuis RUSTORE_PRIVATE_KEY — préférer le fichier ' +
          DEFAULT_RUSTORE_KEY_PATH,
      )
    } else if (!existsSync(absKey)) {
      warn('Fichier clé absent mais RUSTORE_PRIVATE_KEY fourni (repli env)')
    }
  } else {
    fail(
      `Clé absente — créer ${DEFAULT_RUSTORE_KEY_PATH} (PEM/Base64) ou RUSTORE_PRIVATE_KEY dans phase2.env`,
    )
    issues += 1
  }

  ok(`Package app : ${cfg.packageName || DEFAULT_RUSTORE_PACKAGE}`)

  console.log('\nAuth API')
  if (issues === 0) {
    try {
      const { ttl } = await fetchRustoreAuthToken(env)
      ok(`Token JWE obtenu (ttl ≈ ${ttl}s) — clé OK`)
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err))
      issues += 1
    }
  } else {
    warn('Auth API ignorée tant que keyId / clé manquent')
  }

  console.log('\nProchaines étapes (manuel)')
  console.log('  1. Build AAB : npm run web:cap:prod:sync puis Android Studio → Bundle')
  console.log('  2. Console RuStore : créer l’app com.moxt.app + uploader la signature AAB')
  console.log('  3. Publier via la console (1ʳᵉ fois) ou API upload AAB avec Public-Token')
  console.log('  Docs : https://www.rustore.ru/help/work-with-rustore-api/api-upload-publication-app')
  console.log('')

  if (issues > 0) {
    console.log(`Résultat : ${issues} problème(s)\n`)
    process.exit(1)
  }
  console.log('Résultat : RuStore prêt pour l’API\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
