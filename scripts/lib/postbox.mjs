import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  SESv2Client,
} from '@aws-sdk/client-sesv2'
import { folderId, ycJson, ycRun } from './yandex.mjs'

const endpoint = 'https://postbox.cloud.yandex.net'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const phase2EnvPath = path.join(root, 'scripts', 'phase2.env')
const saName = process.env.MOXT_AUTH_SA_NAME || 'moxt-auth'

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

function iamToken() {
  const { code, stdout, stderr } = ycRun(['iam', 'create-token'])
  if (code !== 0 || !stdout) {
    throw new Error(`Token IAM : ${stderr || stdout}`)
  }
  return stdout.trim()
}

function staticCredentials() {
  const vars = parseEnvFile(phase2EnvPath)
  const accessKeyId = vars.YC_SNS_ACCESS_KEY_ID
  const secretAccessKey = vars.YC_SNS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) return null
  return { accessKeyId, secretAccessKey }
}

export function summarizePostboxStatus(address) {
  if (!address) {
    return { dkimStatus: 'UNKNOWN', signingEnabled: false, verifiedForSending: false }
  }
  return {
    dkimStatus: address.DkimAttributes?.Status || 'UNKNOWN',
    signingEnabled: address.DkimAttributes?.SigningEnabled === true,
    verifiedForSending: address.VerifiedForSendingStatus === true,
    verificationStatus: address.VerificationStatus || 'UNKNOWN',
  }
}

export async function enablePostboxDkimSigning(domain, enabled = true) {
  return postboxRequest('PUT', `/v2/email/identities/${encodeURIComponent(domain)}/dkim`, {
    SigningEnabled: enabled,
  })
}

export async function refreshPostboxDkimVerification(domain) {
  await enablePostboxDkimSigning(domain, true)
}

function sesClient(credentials) {
  return new SESv2Client({
    region: 'ru-central1',
    endpoint,
    credentials,
  })
}

async function postboxRequest(method, pathName, body) {
  const res = await fetch(`${endpoint}${pathName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-YaCloud-SubjectToken': iamToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object'
        ? data?.message || data?.Message || JSON.stringify(data)
        : data
    const error = new Error(`Postbox ${method} ${pathName} → ${res.status} ${msg}`)
    error.status = res.status
    throw error
  }
  return data
}

export function ensurePostboxEditorRole(folder) {
  const list = ycJson('iam', 'service-account', 'list', '--folder-id', folder)
  const accounts = Array.isArray(list) ? list : []
  const sa = accounts.find((a) => a.name === saName)
  if (!sa?.id) {
    throw new Error(`Compte de service ${saName} introuvable — npm run setup:yandex-provision`)
  }
  const { code, stderr, stdout } = ycRun([
    'resource-manager',
    'folder',
    'add-access-binding',
    folder,
    '--role',
    'postbox.editor',
    '--service-account-id',
    sa.id,
  ])
  if (code !== 0 && !String(stderr || stdout).toLowerCase().includes('already')) {
    throw new Error(`Rôle postbox.editor : ${stderr || stdout}`)
  }
  return sa.id
}

async function ensureWithStaticKeys(domain) {
  const credentials = staticCredentials()
  if (!credentials) {
    throw new Error('scripts/phase2.env introuvable — npm run setup:yandex-provision')
  }
  const client = sesClient(credentials)
  try {
    await client.send(
      new CreateEmailIdentityCommand({
        EmailIdentity: domain,
        DkimSigningAttributes: { NextSigningKeyLength: 'RSA_2048_BIT' },
      }),
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (!msg.includes('AlreadyExists') && !msg.includes('already exists')) {
      throw error
    }
  }
  return client.send(new GetEmailIdentityCommand({ EmailIdentity: domain }))
}

export async function ensurePostboxAddress(domain) {
  const credentials = staticCredentials()
  if (credentials) {
    try {
      return await ensureWithStaticKeys(domain)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (!msg.includes('403') && !msg.includes('Forbidden')) throw error
    }
  }

  const payload = {
    EmailIdentity: domain,
    DkimSigningAttributes: { NextSigningKeyLength: 'RSA_2048_BIT' },
  }
  try {
    return await postboxRequest('POST', '/v2/email/identities', payload)
  } catch (error) {
    if (error.status !== 409) throw error
    return getPostboxAddress(domain)
  }
}

export async function getPostboxAddress(domain) {
  const credentials = staticCredentials()
  if (credentials) {
    const client = sesClient(credentials)
    return client.send(new GetEmailIdentityCommand({ EmailIdentity: domain }))
  }
  return postboxRequest('GET', `/v2/email/identities/${encodeURIComponent(domain)}`)
}

export function dkimTokensFromAddress(address) {
  return address?.DkimAttributes?.Tokens || []
}

export function findDnsZone(dnsZoneName, domain) {
  const list = ycJson('dns', 'zone', 'list')
  const zones = Array.isArray(list) ? list : list?.dns_zones || []
  return (
    zones.find((z) => z.name === dnsZoneName) ||
    zones.find((z) => z.zone === `${domain}.` || z.zone === domain) ||
    null
  )
}

export function dkimCnameTarget(token) {
  return `${token}.dkim.pstbx.ru.`
}

export function dkimRecordName(token, domain) {
  return `${token}._domainkey.${domain}.`
}

export function dkimDnsInstructions(domain, tokens) {
  return tokens.map((token) => ({
    type: 'CNAME',
    name: `${token}._domainkey.${domain}`,
    value: dkimCnameTarget(token).replace(/\.$/, ''),
  }))
}

export function replaceDnsRecord(zoneId, spec) {
  const { code, stderr, stdout } = ycRun([
    'dns',
    'zone',
    'replace-records',
    zoneId,
    '--record',
    spec,
  ])
  if (code !== 0) {
    throw new Error(String(stderr || stdout).trim())
  }
}

export function getDnsRecord(zoneId, name, type) {
  const records = ycJson('dns', 'zone', 'list-records', zoneId)
  const items = records?.record_sets || records || []
  const arr = Array.isArray(items) ? items : []
  const normalized = name.endsWith('.') ? name : `${name}.`
  return arr.find((r) => r.name === normalized && r.type === type) || null
}

export function ensurePostboxDkimDns(zone, domain, tokens) {
  if (!zone?.id) {
    throw new Error('Zone DNS Yandex introuvable')
  }
  const zoneId = zone.id
  let updated = 0
  for (const token of tokens) {
    const name = dkimRecordName(token, domain)
    const target = dkimCnameTarget(token)
    const existing = getDnsRecord(zoneId, name.replace(/\.$/, ''), 'CNAME')
    const current = Array.isArray(existing?.data) ? existing.data[0] : existing?.data
    if (current === target) continue
    replaceDnsRecord(zoneId, `${name} 600 CNAME ${target}`)
    updated += 1
  }
  return updated
}

export async function waitPostboxVerification(domain, { attempts = 12, delayMs = 10000 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const address = await getPostboxAddress(domain)
    const dkimStatus = address?.DkimAttributes?.Status
    const verified = address?.VerifiedForSendingStatus === true
    if (dkimStatus === 'SUCCESS' && verified) {
      return { address, dkimStatus, verified: true }
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
    if (i === attempts - 1) {
      return { address, dkimStatus, verified }
    }
  }
  return { address: null, dkimStatus: 'UNKNOWN', verified: false }
}

export { folderId }
