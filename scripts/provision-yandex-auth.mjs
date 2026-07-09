#!/usr/bin/env node
/**
 * Provisionne Yandex Postbox + CNS pour MOXT (100 % Yandex).
 * Crée SA, clés IAM, identité Postbox, enregistrements DNS, scripts/phase2.env
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { folderId, ycJson, ycRun } from './lib/yandex.mjs'
import {
  dkimTokensFromAddress,
  ensurePostboxAddress,
  ensurePostboxDkimDns,
  findDnsZone as findYandexDnsZone,
} from './lib/postbox.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')

const domain = (process.env.MOXT_DOMAIN || 'moxtapp.ru').replace(/\.$/, '')
const fromEmail = process.env.MOXT_POSTBOX_FROM || `noreply@${domain}`
const dnsZoneName = process.env.MOXT_DNS_ZONE_NAME || 'moxtapp-zone'
const saName = process.env.MOXT_AUTH_SA_NAME || 'moxt-auth'
const smsSender = process.env.YC_SNS_SENDER_ID || 'MOXT'
const smsTemplate =
  process.env.YC_SNS_MESSAGE_TEMPLATE || 'Код MOXT: {otp}. Никому не сообщайте.'

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

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

function writePhase2Env(vars) {
  const content = `# Généré par scripts/provision-yandex-auth.mjs — ne pas commiter
MOXT_POSTBOX_SMTP_USER=${vars.MOXT_POSTBOX_SMTP_USER}
MOXT_POSTBOX_SMTP_PASS=${vars.MOXT_POSTBOX_SMTP_PASS}
MOXT_POSTBOX_FROM=${vars.MOXT_POSTBOX_FROM}
YC_SNS_ACCESS_KEY_ID=${vars.YC_SNS_ACCESS_KEY_ID}
YC_SNS_SECRET_ACCESS_KEY=${vars.YC_SNS_SECRET_ACCESS_KEY}
YC_SNS_SENDER_ID=${vars.YC_SNS_SENDER_ID}
YC_SNS_MESSAGE_TEMPLATE=${vars.YC_SNS_MESSAGE_TEMPLATE}
SEND_SMS_HOOK_SECRET=${vars.SEND_SMS_HOOK_SECRET || ''}
`
  writeFileSync(envPath, content, 'utf8')
}

function ensureServiceAccount(folder) {
  const list = ycJson('iam', 'service-account', 'list', '--folder-id', folder)
  const accounts = Array.isArray(list) ? list : []
  const existing = accounts.find((a) => a.name === saName)
  if (existing) {
    log('Compte de service existant', `${saName} (${existing.id})`)
    return existing.id
  }
  log('Création compte de service', saName)
  const created = ycJson(
    'iam',
    'service-account',
    'create',
    '--name',
    saName,
    '--folder-id',
    folder,
    '--description',
    'MOXT Postbox + CNS',
  )
  return created.id
}

function bindRole(folder, saId, role) {
  const { code, stderr, stdout } = ycRun([
    'resource-manager',
    'folder',
    'add-access-binding',
    folder,
    '--role',
    role,
    '--service-account-id',
    saId,
  ])
  if (code !== 0 && !String(stderr || stdout).toLowerCase().includes('already')) {
    throw new Error(`Rôle ${role} : ${stderr || stdout}`)
  }
}

function ensureRoles(folder, saId) {
  log('Rôles IAM', 'postbox.editor + postbox.sender + dns.editor + notifications.publisher')
  bindRole(folder, saId, 'postbox.editor')
  bindRole(folder, saId, 'postbox.sender')
  bindRole(folder, saId, 'dns.editor')
  bindRole(folder, saId, 'notifications.publisher')
}

function createYcAuthorizedKey(saId) {
  const keyPath = path.join(root, 'scripts', 'moxt-auth-yc.json')
  if (existsSync(keyPath) && process.env.MOXT_PROVISION_FORCE !== '1') {
    log('Clé CLI locale', 'scripts/moxt-auth-yc.json déjà présente')
    return keyPath
  }
  log('Clé CLI locale', 'scripts/moxt-auth-yc.json (npm run setup:yc)')
  const { code, stderr, stdout } = ycRun([
    'iam',
    'key',
    'create',
    '--service-account-id',
    saId,
    '--output',
    keyPath,
    '--description',
    'MOXT local yc CLI',
  ])
  if (code !== 0) {
    log('Clé CLI locale', `ignorée : ${stderr || stdout}`)
    return null
  }
  return keyPath
}

function createPostboxApiKey(saId) {
  log('Clé API Postbox', 'scope yc.postbox.send')
  const { code, stdout, stderr } = ycRun([
    'iam',
    'api-key',
    'create',
    '--service-account-id',
    saId,
    '--scopes',
    'yc.postbox.send',
    '--description',
    'MOXT Postbox SMTP',
    '--format',
    'json',
  ])
  if (code !== 0) {
    throw new Error(`Clé API Postbox : ${stderr || stdout}`)
  }
  let key
  try {
    key = JSON.parse(stdout)
  } catch {
    throw new Error(`Clé API Postbox — réponse invalide : ${stdout || stderr}`)
  }
  const id = key?.api_key?.id || key?.id
  const secret = key?.secret
  if (!id || !secret) {
    throw new Error('Clé API Postbox — id ou secret manquant dans la réponse yc.')
  }
  return { id, secret }
}

function createStaticAccessKey(saId) {
  log('Clé statique CNS', 'compatible AWS SNS')
  const key = ycJson('iam', 'access-key', 'create', '--service-account-id', saId)
  if (!key?.access_key?.key_id || !key?.secret) {
    throw new Error('Impossible de créer la clé statique CNS.')
  }
  return { id: key.access_key.key_id, secret: key.secret }
}

function resolveDnsZone() {
  return findYandexDnsZone(dnsZoneName, domain)
}

async function ensurePostboxSetup() {
  try {
    const address = await ensurePostboxAddress(domain)
    return dkimTokensFromAddress(address)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    log('Postbox API', `ignoré (${msg.slice(0, 100)}) — npm run setup:postbox`)
    return []
  }
}

function ensurePostboxDns(zone, dkimTokens) {
  if (!zone?.id) {
    log('DNS Postbox', 'zone introuvable — npm run setup:postbox')
    return
  }
  try {
    const added = ensurePostboxDkimDns(zone, domain, dkimTokens)
    if (added) log('DNS DKIM Postbox', `${added} enregistrement(s)`)
  } catch (error) {
    log('DNS DKIM Postbox', `ignoré : ${error instanceof Error ? error.message : error}`)
  }
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  Provision Yandex Auth (Postbox + CNS)')
  console.log('══════════════════════════════════════')

  const folder = folderId()
  if (!folder) throw new Error('folder-id Yandex introuvable (yc init)')

  const existing = parseEnvFile(envPath)
  const hasKeys =
    existing.MOXT_POSTBOX_SMTP_USER &&
    existing.YC_SNS_ACCESS_KEY_ID &&
    !existing.MOXT_POSTBOX_SMTP_USER.includes('xxx')
  if (hasKeys && process.env.MOXT_PROVISION_FORCE !== '1') {
    log('phase2.env déjà rempli', 'MOXT_PROVISION_FORCE=1 pour régénérer les clés')
    return existing
  }

  const saId = ensureServiceAccount(folder)
  ensureRoles(folder, saId)
  createYcAuthorizedKey(saId)

  const postboxKey = createPostboxApiKey(saId)
  const cnsKey = createStaticAccessKey(saId)

  const vars = {
    MOXT_POSTBOX_SMTP_USER: postboxKey.id,
    MOXT_POSTBOX_SMTP_PASS: postboxKey.secret,
    MOXT_POSTBOX_FROM: fromEmail,
    YC_SNS_ACCESS_KEY_ID: cnsKey.id,
    YC_SNS_SECRET_ACCESS_KEY: cnsKey.secret,
    YC_SNS_SENDER_ID: smsSender,
    YC_SNS_MESSAGE_TEMPLATE: smsTemplate,
    SEND_SMS_HOOK_SECRET: existing.SEND_SMS_HOOK_SECRET || '',
  }
  writePhase2Env(vars)

  let dkimTokens = await ensurePostboxSetup()

  const zone = resolveDnsZone()
  if (zone) {
    try {
      ensurePostboxDns(zone, dkimTokens)
    } catch (error) {
      log('DNS Postbox', `partiel : ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log('\n══════════════════════════════════════')
  console.log('  Provision terminée → scripts/phase2.env')
  console.log('══════════════════════════════════════')
  console.log('\n  Manuel (CNS Preview, une fois) :')
  console.log('  1. Console → Cloud Notification Service → demander l’accès')
  console.log('  2. Créer canal SMS + modèle « Авторизационный »')
  console.log('  3. Sortir de la sandbox')
  console.log('\n  Puis : npm run setup:postbox && npm run setup:phase2')

  return vars
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
