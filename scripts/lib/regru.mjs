import { resolve4 } from 'node:dns/promises'

/**
 * Client minimal REG.API 2 (https://www.reg.ru/support/help/api2)
 * Auth : username + password (IP autorisée dans le compte REG.RU)
 */
const API_BASE = 'https://api.reg.ru/api/regru2'

export function loadRegruCredentials(env = process.env) {
  const username = env.MOXT_REGRU_USERNAME || env.REGRU_USERNAME || ''
  const password = env.MOXT_REGRU_PASSWORD || env.REGRU_PASSWORD || ''
  return { username, password }
}

function normalizeCname(target) {
  return String(target || '')
    .trim()
    .replace(/\.$/, '')
}

async function regruCall(method, payload, credentials) {
  const { username, password } = credentials
  if (!username || !password) {
    throw new Error('Identifiants REG.RU manquants (MOXT_REGRU_USERNAME / MOXT_REGRU_PASSWORD)')
  }

  const input = {
    username,
    password,
    output_content_type: 'plain',
    ...payload,
  }

  const body = new URLSearchParams({
    input_format: 'json',
    input_data: JSON.stringify(input),
  })

  const response = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`REG.RU ${method} : réponse invalide (${response.status})`)
  }

  if (data.result !== 'success') {
    const code = data.error_code || data.answer?.error_code || 'UNKNOWN'
    const message = data.error_text || data.answer?.error_text || text
    const err = new Error(`REG.RU ${method} → ${code}: ${message}`)
    err.code = code
    throw err
  }

  return data.answer || data
}

function domainAnswer(answer, domain) {
  const domains = answer?.domains || []
  const entry = domains.find((item) => item.dname === domain) || domains[0]
  if (!entry) return null
  if (entry.result && entry.result !== 'success') {
    throw new Error(`REG.RU ${domain} → ${entry.error_code || entry.result}`)
  }
  return entry
}

export async function getResourceRecords(domain, credentials) {
  const answer = await regruCall(
    'zone/get_resource_records',
    { domains: [{ dname: domain }] },
    credentials,
  )
  const entry = domainAnswer(answer, domain)
  return entry?.rrs || []
}

export async function removeRecord(domain, { subdomain, recordType, content }, credentials) {
  const payload = {
    domains: [{ dname: domain }],
    subdomain,
    record_type: recordType,
  }
  if (content) payload.content = content
  const answer = await regruCall('zone/remove_record', payload, credentials)
  return domainAnswer(answer, domain)
}

export async function addCname(domain, subdomain, canonicalName, credentials) {
  const answer = await regruCall(
    'zone/add_cname',
    {
      domains: [{ dname: domain }],
      subdomain,
      canonical_name: normalizeCname(canonicalName),
    },
    credentials,
  )
  return domainAnswer(answer, domain)
}

export async function addAlias(domain, subdomain, ipaddr, credentials) {
  const answer = await regruCall(
    'zone/add_alias',
    {
      domains: [{ dname: domain }],
      subdomain,
      ipaddr,
    },
    credentials,
  )
  return domainAnswer(answer, domain)
}

export async function resolveCdnIpv4(providerCname) {
  const host = normalizeCname(providerCname)
  try {
    const ips = await resolve4(host)
    return [...new Set(ips)]
  } catch {
    return ['188.72.111.35', '188.72.111.36']
  }
}

export async function ensureApexARecords(domain, providerCname, credentials) {
  const ips = await resolveCdnIpv4(providerCname)
  const records = await getResourceRecords(domain, credentials)
  const apexRecords = records.filter((r) => {
    const sub = r.subname
    return sub === '@' || sub === domain || sub === ''
  })

  for (const record of apexRecords) {
    if (record.rectype === 'A' && !ips.includes(record.content)) {
      await safeRemove(domain, record, credentials)
    }
    if (record.rectype === 'CNAME') {
      await safeRemove(domain, record, credentials)
    }
  }

  const currentA = new Set(
    records
      .filter((r) => (r.subname === '@' || r.subname === domain || r.subname === '') && r.rectype === 'A')
      .map((r) => r.content),
  )

  for (const ip of ips) {
    if (!currentA.has(ip)) {
      await addAlias(domain, '@', ip, credentials)
    }
  }

  return ips
}

export async function setWebRedirect(domain, targetUrl, credentials) {
  const answer = await regruCall(
    'service/update',
    {
      dname: domain,
      servtype: 'srv_webfwd',
      subtask: 'addfwd',
      fwdfrom: '/',
      fwdto: targetUrl,
      webfwd_type: 'redirect',
    },
    credentials,
  )
  return answer
}

async function safeRemove(domain, record, credentials) {
  try {
    await removeRecord(
      domain,
      {
        subdomain: record.subname,
        recordType: record.rectype,
        content: record.content,
      },
      credentials,
    )
  } catch (err) {
    if (String(err.code || err.message).includes('NOT_FOUND')) return
    console.warn(`  ⚠ suppression ${record.rectype} ${record.subname}: ${err.message}`)
  }
}

export async function ensureCdnDns({
  domain,
  wwwDomain,
  providerCname,
  credentials,
  useApexCname = true,
}) {
  const cnameTarget = normalizeCname(providerCname)
  const records = await getResourceRecords(domain, credentials)

  for (const record of records) {
    const sub = record.subname
    const type = record.rectype
    const isWww = sub === 'www' || sub === wwwDomain.replace(`${domain}.`, '')
    const isApex = sub === '@' || sub === domain || sub === ''
    if (!isWww && !isApex) continue
    if (type === 'A' || type === 'AAAA') {
      await safeRemove(domain, record, credentials)
    }
    if (type === 'CNAME' && normalizeCname(record.content) !== cnameTarget) {
      await safeRemove(domain, record, credentials)
    }
  }

  await addCname(domain, 'www', cnameTarget, credentials)

  if (useApexCname) {
    try {
      await addCname(domain, '@', cnameTarget, credentials)
    } catch (err) {
      const message = String(err.message || '')
      if (
        message.includes('CNAME_ANDOTHERDATA') ||
        message.includes('CONFLICT_CNAME') ||
        message.includes('CNAME_INVALID')
      ) {
        try {
          await setWebRedirect(domain, `https://${wwwDomain}/index.html`, credentials)
        } catch (redirectErr) {
          const redirectMsg = String(redirectErr.message || '')
          if (redirectMsg.includes('SERVICE_NOT_FOUND')) {
            console.warn('\n  ⚠ REG.RU : redirection web indisponible — enregistrements A sur @')
            await ensureApexARecords(domain, cnameTarget, credentials)
          } else {
            throw redirectErr
          }
        }
      } else {
        throw err
      }
    }
  } else {
    try {
      await setWebRedirect(domain, `https://${wwwDomain}/index.html`, credentials)
    } catch (redirectErr) {
      if (String(redirectErr.message || '').includes('SERVICE_NOT_FOUND')) {
        await ensureApexARecords(domain, cnameTarget, credentials)
      } else {
        throw redirectErr
      }
    }
  }

  return cnameTarget
}
