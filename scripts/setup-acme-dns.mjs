#!/usr/bin/env node
/**
 * Vérifie et synchronise les enregistrements ACME pour le renouvellement du certificat Yandex Cloud.
 *
 * Usage:
 *   node scripts/setup-acme-dns.mjs
 */
import { Resolver } from 'node:dns/promises'
import { loadPhase2Env } from './lib/env.mjs'
import { addCname, getResourceRecords, loadRegruCredentials } from './lib/regru.mjs'

const resolver = new Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])

const domain = 'moxtapp.ru'
const certId = 'fpqi59dkhhp3egkl75si'
const cnameTarget = `${certId}.cm.yandexcloud.net`

async function checkDns() {
  console.log(`\n1. Vérification de la cible Yandex Certificate Manager (${cnameTarget}) :`)
  try {
    const txts = await resolver.resolveTxt(cnameTarget)
    console.log('   ✓ Cible Yandex active avec TXT :', txts.flat())
  } catch (err) {
    console.error('   ✗ Erreur résolution cible Yandex :', err.message)
  }

  console.log(`\n2. Vérification actuelle des DNS publics (REG.RU) :`)
  for (const sub of ['_acme-challenge', '_acme-challenge.www']) {
    const fqdn = `${sub}.${domain}`
    try {
      const cnames = await resolver.resolveCname(fqdn)
      console.log(`   ✓ ${fqdn} CNAME → ${cnames.join(', ')}`)
    } catch {
      try {
        const txts = await resolver.resolveTxt(fqdn)
        console.log(`   ✓ ${fqdn} TXT → ${txts.flat().join(', ')}`)
      } catch {
        console.log(`   ⚠ ${fqdn} : NON configuré ou non propagé`)
      }
    }
  }
}

async function tryRegruApi() {
  const env = loadPhase2Env()
  const creds = loadRegruCredentials(env)
  if (!creds.username || !creds.password) {
    console.log('\nIdentifiants REG.RU absents.')
    return
  }

  console.log('\n3. Tentative de configuration automatique via API REG.RU...')
  try {
    const records = await getResourceRecords(domain, creds)
    console.log(`   Connexion REG.RU réussie (${records.length} enregistrements trouvés).`)
    
    for (const sub of ['_acme-challenge', '_acme-challenge.www']) {
      console.log(`   Ajout CNAME pour ${sub}...`)
      await addCname(domain, sub, cnameTarget, creds)
      console.log(`   ✓ ${sub} CNAME configuré`)
    }
    console.log('\n✓ Les 2 enregistrements CNAME ont été créés avec succès sur REG.RU !')
  } catch (err) {
    console.log(`   ⚠ API REG.RU non disponible : ${err.message}`)
    if (String(err.message).includes('ACCESS_DENIED_FROM_IP')) {
      console.log('   (Pour l\'activer, ajoutez l\'IP de votre machine dans https://www.reg.ru/user/account/#/settings/api/)')
    }
  }
}

async function main() {
  console.log('═════════════════════════════════════════════════════════')
  console.log(`  MOXT — Diagnostic & Résolution SSL (${domain})`)
  console.log('═════════════════════════════════════════════════════════')
  await checkDns()
  await tryRegruApi()
}

main().catch(console.error)
