#!/usr/bin/env node
/**
 * Configure Cloud CDN + DNS + HTTPS pour moxtapp.ru sur Yandex Cloud.
 *
 * Prérequis : yc init, bucket moxtapp-web déployé (npm run web:deploy:yandex:init)
 *
 * Variables optionnelles :
 *   MOXT_DOMAIN          apex (défaut : moxtapp.ru)
 *   MOXT_YC_BUCKET       bucket S3 (défaut : moxtapp-web)
 *   MOXT_CDN_RESOURCE_ID id ressource CDN existante (auto-détecté si absent)
 *   MOXT_DNS_ZONE_NAME   nom zone DNS Yandex (défaut : moxtapp-zone)
 *   MOXT_SKIP_DNS        1 = ne pas créer la zone DNS (REG.RU manuel)
 *   MOXT_SKIP_SUPABASE   1 = ne pas pousser supabase config
 *   YC_BIN               chemin vers yc
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  SPA_REWRITE_BODY,
  finalizeSpaCdn,
  purgeCdnCache,
} from './lib/yandex-cdn.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const phase2EnvPath = path.join(root, 'scripts', 'phase2.env')

function parseEnvFile(filePath) {
  const vars = {}
  if (!existsSync(filePath)) return vars
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return vars
}

function loadPostboxEnv() {
  const fromFile = parseEnvFile(phase2EnvPath)
  return {
    MOXT_POSTBOX_SMTP_USER:
      process.env.MOXT_POSTBOX_SMTP_USER || fromFile.MOXT_POSTBOX_SMTP_USER || '',
    MOXT_POSTBOX_SMTP_PASS:
      process.env.MOXT_POSTBOX_SMTP_PASS || fromFile.MOXT_POSTBOX_SMTP_PASS || '',
    MOXT_POSTBOX_FROM: process.env.MOXT_POSTBOX_FROM || fromFile.MOXT_POSTBOX_FROM || '',
  }
}

const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const wwwDomain = `www.${domain}`
const bucket = process.env.MOXT_YC_BUCKET || 'moxtapp-web'
const websiteHost = `${bucket}.website.yandexcloud.net`
const dnsZoneName = process.env.MOXT_DNS_ZONE_NAME || 'moxtapp-zone'
const skipDns = process.env.MOXT_SKIP_DNS === '1'
const skipSupabase = process.env.MOXT_SKIP_SUPABASE === '1'
const certName = 'moxtapp-ru-letsencrypt'

function ycPath() {
  if (process.env.YC_BIN) return process.env.YC_BIN
  if (process.platform === 'win32') {
    const candidate = path.join(process.env.USERPROFILE || '', 'yandex-cloud', 'bin', 'yc.exe')
    if (existsSync(candidate)) return candidate
  }
  return 'yc'
}

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function run(bin, args, { inherit = false } = {}) {
  const result = spawnSync(bin, args, {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    stdio: inherit ? 'inherit' : 'pipe',
  })
  return {
    code: result.status ?? 1,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  }
}

function ycJson(...args) {
  const bin = ycPath()
  const { code, stdout, stderr } = run(bin, [...args, '--format', 'json'])
  if (code !== 0) {
    const msg = stderr || stdout
    throw new Error(`yc ${args.join(' ')} → ${msg}`)
  }
  if (!stdout) return null
  try {
    return JSON.parse(stdout)
  } catch {
    return stdout
  }
}

function ycInherit(...args) {
  const bin = ycPath()
  const { code } = run(bin, args, { inherit: true })
  if (code !== 0) process.exit(code)
}

function findCdnResource() {
  if (process.env.MOXT_CDN_RESOURCE_ID) {
    return ycJson('cdn', 'resource', 'get', process.env.MOXT_CDN_RESOURCE_ID)
  }
  const list = ycJson('cdn', 'resource', 'list')
  const arr = Array.isArray(list) ? list : list?.resources || []
  return (
    arr.find((r) => r.cname === domain) ||
    arr.find((r) => r.cname === wwwDomain) ||
    arr[0] ||
    null
  )
}

function ensureCdnFixed(resource) {
  const id = resource.id
  const providerCname = resource.provider_cname
  if (!providerCname) {
    throw new Error('CDN sans provider_cname — recréez la ressource dans la console')
  }

  const hostHeader = resource.options?.host_options?.host?.value
  const originProtocol = (resource.origin_protocol || '').toLowerCase()
  const secondary = resource.secondary_hostnames || []

  const needsHost = hostHeader !== websiteHost
  const needsHttp = originProtocol !== 'http'
  const needsWww = !secondary.includes(wwwDomain)

  if (!needsHost && !needsHttp && !needsWww) {
    log('CDN', `déjà configuré (${id})`)
    return { id, providerCname }
  }

  log('Mise à jour CDN', id)
  const args = ['cdn', 'resource', 'update', id]
  if (needsHost) args.push('--host-header', websiteHost)
  if (needsHttp) args.push('--origin-protocol', 'http')
  if (needsWww) args.push('--secondary-hostnames', wwwDomain)
  ycInherit(...args)

  const updated = ycJson('cdn', 'resource', 'get', id)
  return { id, providerCname: updated.provider_cname || providerCname }
}

function ensureSpaCdn(resource) {
  log('Origine CDN SPA', `${bucket}.storage.yandexcloud.net + rewrite break`)
  finalizeSpaCdn(resource.id, bucket)
}

function ensureNoDangerousRewrite(resource) {
  const id = resource.id
  const rewrite = resource.options?.rewrite
  const flag = (rewrite?.flag || '').toUpperCase()

  if (rewrite?.enabled && flag === 'PERMANENT') {
    log('Suppression rewrite CDN', 'PERMANENT provoque ERR_TOO_MANY_REDIRECTS')
    ycInherit('cdn', 'resource', 'update', id, '--clear-rewrite')
    finalizeSpaCdn(id, bucket)
    return
  }

  if (rewrite?.enabled && flag === 'LAST') {
    log('Suppression rewrite CDN', 'last provoque des erreurs 500')
    ycInherit('cdn', 'resource', 'update', id, '--clear-rewrite')
    finalizeSpaCdn(id, bucket)
    return
  }

  if (
    rewrite?.enabled &&
    rewrite.body === SPA_REWRITE_BODY &&
    flag === 'BREAK'
  ) {
    log('Rewrite CDN', `${rewrite.body} [${rewrite.flag}]`)
    return
  }

  log('Rewrite CDN', 'sera appliqué par finalizeSpaCdn')
}

function getZoneNameservers(zoneId) {
  const records = ycJson('dns', 'zone', 'list-records', zoneId, '--record-type', 'NS')
  const items = records?.record_sets || records || []
  const arr = Array.isArray(items) ? items : []
  const ns = arr.flatMap((r) => r.data || [])
  return [...new Set(ns.map((n) => n.replace(/\.$/, '')))]
}

function publicUsesYandexNs() {
  const result = spawnSync('nslookup', ['-type=NS', domain], {
    encoding: 'utf8',
    shell: true,
  })
  const out = `${result.stdout || ''}${result.stderr || ''}`.toLowerCase()
  return out.includes('yandexcloud.net')
}

function findDnsZone() {
  const list = ycJson('dns', 'zone', 'list')
  const zones = list?.dns_zones || list || []
  const arr = Array.isArray(zones) ? zones : []
  return arr.find((z) => z.zone === `${domain}.` || z.zone === domain) || null
}

function ensureDnsZone() {
  if (skipDns) return null

  let zone = findDnsZone()
  if (!zone) {
    log('Création zone DNS publique', `${domain}.`)
    zone = ycJson(
      'dns',
      'zone',
      'create',
      '--name',
      dnsZoneName,
      '--zone',
      `${domain}.`,
      '--public-visibility',
      '--description',
      'MOXT production DNS',
    )
  } else {
    log('Zone DNS existante', `${zone.name} (${zone.id})`)
  }
  return zone
}

function dnsRecordExists(zoneId, name, type) {
  const records = ycJson('dns', 'zone', 'list-records', zoneId)
  const items = records?.record_sets || records || []
  const arr = Array.isArray(items) ? items : []
  const normalized = name.endsWith('.') ? name : `${name}.`
  return arr.some((r) => r.name === normalized && r.type === type)
}

function addDnsRecord(zoneId, recordSpec) {
  ycInherit('dns', 'zone', 'add-records', zoneId, '--record', recordSpec)
}

function ensureDnsRecords(zone, providerCname) {
  if (!zone) return

  const zoneId = zone.id
  const cnameTarget = providerCname.endsWith('.') ? providerCname : `${providerCname}.`

  // Apex : CNAME vers CDN (supporté par Yandex Cloud DNS pour CDN)
  const apexSpec = `${domain}. 300 CNAME ${cnameTarget}`
  if (!dnsRecordExists(zoneId, domain, 'CNAME')) {
    log('DNS apex CNAME', apexSpec)
    addDnsRecord(zoneId, apexSpec)
  }

  const wwwSpec = `${wwwDomain}. 300 CNAME ${cnameTarget}`
  if (!dnsRecordExists(zoneId, wwwDomain, 'CNAME')) {
    log('DNS www CNAME', wwwSpec)
    addDnsRecord(zoneId, wwwSpec)
  }
}

function findCertificate() {
  const list = ycJson('certificate-manager', 'certificate', 'list')
  const certs = list?.certificates || list || []
  const arr = Array.isArray(certs) ? certs : []
  return arr.find((c) => c.name === certName) || arr.find((c) => c.domains?.includes(domain)) || null
}

function ensureCertificate(zone) {
  let cert = findCertificate()
  if (!cert) {
    log('Demande certificat Let\'s Encrypt', `${domain}, ${wwwDomain}`)
    cert = ycJson(
      'certificate-manager',
      'certificate',
      'request',
      '--name',
      certName,
      '--domains',
      domain,
      '--domains',
      wwwDomain,
      '--challenge',
      'dns',
    )
  } else {
    log('Certificat existant', `${cert.name} (${cert.id}) — ${cert.status}`)
  }

  const full = ycJson('certificate-manager', 'certificate', 'get', cert.id, '--full')
  const challenges = full?.challenges || []
  if (zone && challenges.length > 0) {
    const byName = new Map()
    for (const ch of challenges) {
      if (ch.type !== 'DNS' || ch.status === 'VALIDATED') continue
      const dns = ch.dns_challenge || ch.dnsChallenge || {}
      const dnsName = (dns.name || ch.dns_name || ch.dnsName || '').replace(/\.$/, '')
      const dnsType = dns.type || 'CNAME'
      if (!dnsName) continue
      const existing = byName.get(dnsName)
      // CNAME challenge only — TXT conflicts with CNAME at same name in Yandex DNS
      if (!existing || (existing.type !== 'CNAME' && dnsType === 'CNAME')) {
        byName.set(dnsName, { type: dnsType, value: dns.value || ch.dns_value || ch.dnsValue || ch.value })
      }
    }
    for (const [dnsName, { type, value }] of byName) {
      if (!value || !dnsRecordExists(zone.id, dnsName, type)) {
        const recordValue = value.endsWith('.') ? value : type === 'TXT' ? value : `${value}.`
        const spec = `${dnsName}. 60 ${type} ${recordValue}`
        if (!dnsRecordExists(zone.id, dnsName, type)) {
          log('DNS challenge ACME', spec)
          addDnsRecord(zone.id, spec)
        }
      }
    }
  }

  return cert
}

async function waitForCertificate(certId, maxMinutes = 20) {
  if (!publicUsesYandexNs()) {
    console.log('\n  ⚠ NS publics encore chez REG.RU — certificat en attente de délégation DNS')
    return ycJson('certificate-manager', 'certificate', 'get', certId)
  }
  const deadline = Date.now() + maxMinutes * 60 * 1000
  while (Date.now() < deadline) {
    const cert = ycJson('certificate-manager', 'certificate', 'get', certId)
    const status = cert.status
    process.stdout.write(`\r  Certificat : ${status}   `)
    if (status === 'ISSUED') {
      console.log('')
      return cert
    }
    if (status === 'REVOKED' || status === 'RENEWAL_FAILED') {
      console.log('')
      throw new Error(`Certificat en échec : ${status}`)
    }
    await new Promise((r) => setTimeout(r, 15000))
  }
  console.log('')
  return ycJson('certificate-manager', 'certificate', 'get', certId)
}

function attachCertificateToCdn(resourceId, certId) {
  const resource = ycJson('cdn', 'resource', 'get', resourceId)
  const sslType = resource.ssl_certificate?.type
  const currentCertId = resource.ssl_certificate?.certificate_manager_certificate_id

  if (sslType === 'CERTIFICATE_MANAGER' && currentCertId === certId) {
    log('CDN', 'certificat déjà attaché')
    return
  }

  log('Attache certificat au CDN', certId)
  ycInherit(
    'cdn',
    'resource',
    'update',
    resourceId,
    '--cert-manager-ssl-cert-id',
    certId,
    '--redirect-http-to-https',
  )
}

function pushSupabase() {
  if (skipSupabase) return

  const postbox = loadPostboxEnv()
  const missing = ['MOXT_POSTBOX_SMTP_USER', 'MOXT_POSTBOX_SMTP_PASS', 'MOXT_POSTBOX_FROM'].filter(
    (key) => !postbox[key],
  )
  if (missing.length > 0) {
    console.warn(
      `\n  ⚠ Supabase config push ignoré — variables SMTP manquantes (${missing.join(', ')}).`,
    )
    console.warn('    Renseignez scripts/phase2.env puis : npm run setup:smtp')
    return
  }

  log('Supabase config push', 'site_url + redirect URLs + SMTP')
  const link = spawnSync('npx', ['supabase', 'link', '--project-ref', 'rbvqfkccbkwjxkvpnwqn', '--yes'], {
    cwd: root,
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8',
  })
  if ((link.status ?? 1) !== 0) {
    console.warn('  ⚠ supabase link ignoré (déjà lié ou CLI absente)')
  }
  const push = spawnSync('npx', ['supabase', 'config', 'push', '--yes'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...postbox },
  })
  if ((push.status ?? 1) !== 0) {
    console.warn('\n  ⚠ config push Supabase en échec — le CDN reste opérationnel.')
    console.warn('    Réessayez : npm run setup:smtp')
  }
}

function printSummary({ resourceId, providerCname, zone, cert }) {
  const yandexNs = zone ? getZoneNameservers(zone.id) : ['ns1.yandexcloud.net', 'ns2.yandexcloud.net']
  const nsLive = publicUsesYandexNs()
  console.log('\n══════════════════════════════════════')
  console.log('  Configuration Yandex CDN terminée')
  console.log('══════════════════════════════════════')
  console.log(`  Domaine    : https://${domain}`)
  console.log(`  CDN ID     : ${resourceId}`)
  console.log(`  CNAME CDN  : ${providerCname}`)
  console.log(`  Bucket     : ${bucket}.storage.yandexcloud.net`)
  console.log(`  Host CDN   : ${websiteHost}`)
  console.log(`  Entrée SPA : https://${domain}/index.html`)
  if (zone) {
    console.log(`\n  Zone DNS   : ${zone.zone} (${zone.id})`)
    console.log('  Nameservers Yandex (à configurer chez REG.RU) :')
    for (const n of yandexNs) console.log(`    • ${n}`)
    if (!nsLive) {
      console.log('\n  ℹ DNS actuel : CNAME REG.RU → CDN (site peut fonctionner sans changer les NS).')
      console.log('  Pour gérer DNS + renouvellement certificat via Yandex, déléguez chez REG.RU :')
      for (const n of yandexNs) console.log(`      ${n}`)
      console.log('\n    Puis relancez : npm run setup:yandex-cdn')
      console.log('    (HTTPS + attachement certificat au CDN)')
      console.log('    Propagation DNS : 15 min – 24 h.')
    } else {
      console.log('\n  ✓ NS Yandex détectés — propagation en cours')
    }
  } else if (skipDns) {
    console.log('\n  Enregistrements à créer chez REG.RU :')
    console.log(`    ${wwwDomain}  CNAME  ${providerCname}`)
    console.log(`    (apex) rediriger ${domain} → https://${wwwDomain}`)
    if (cert?.challenges) {
      console.log('\n  Challenges ACME (_acme-challenge) : voir console Certificate Manager')
    }
  }
  if (cert) {
    console.log(`\n  Certificat : ${cert.name} — ${cert.status}`)
  }
  console.log('\n  Test bucket : https://' + websiteHost)
  console.log('  Déploiement : npm run web:deploy:yandex')
}

async function main() {
  const bin = ycPath()
  if (bin !== 'yc' && !existsSync(bin)) {
    console.error('\n✗ Yandex CLI introuvable. Lancez : yc init')
    process.exit(1)
  }

  log('Recherche ressource CDN', domain)
  const resource = findCdnResource()
  if (!resource?.id) {
    console.error('\n✗ Aucune ressource CDN. Créez-en une dans la console ou via :')
    console.error(`  yc cdn resource create ${domain} --origin-bucket-source --origin-bucket-name ${bucket} ...`)
    process.exit(1)
  }

  const { id: resourceId, providerCname } = ensureCdnFixed(resource)
  ensureSpaCdn(resource)
  ensureNoDangerousRewrite(ycJson('cdn', 'resource', 'get', resourceId))
  const purge = purgeCdnCache(resourceId)
  if (!purge.ok && purge.reason !== 'rate_limit') {
    console.warn(`\n  ⚠ Purge CDN : ${purge.reason}`)
  }

  const zone = ensureDnsZone()
  if (zone) {
    ensureDnsRecords(zone, providerCname)
  }

  let cert = ensureCertificate(zone)
  if (cert?.id && cert.status !== 'ISSUED') {
    log('Attente validation certificat', 'jusqu\'à 20 min')
    cert = await waitForCertificate(cert.id)
  }

  if (cert?.status === 'ISSUED' && cert.id) {
    attachCertificateToCdn(resourceId, cert.id)
  } else if (cert) {
    log('Certificat en cours', `${cert.status} — HTTPS actif après émission + propagation DNS`)
  }

  pushSupabase()
  printSummary({ resourceId, providerCname, zone, cert })
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
