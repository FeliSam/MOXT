#!/usr/bin/env node
/**
 * Diagnostic SMS OTP — de la source SMSC jusqu'à Supabase Auth.
 *   npm run test:sms
 *   npm run test:sms -- --phone +79001234567
 *   npm run test:sms -- --live-send   (envoi réel SMSC, coût ~2-5 ₽)
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { loadPhase2Env } from './lib/env.mjs'

const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidnFma2NjYmt3anhrdnBud3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjI2NDMsImV4cCI6MjA5ODIzODY0M30.ZpAr5eEnxoxy3TQ4hIA3SoX1NTuPg-0pt4UQ2mS5lDI'
const DEFAULT_PROBE_PHONE = '79000000000'

const args = process.argv.slice(2)
const liveSend = args.includes('--live-send')
const phoneArg = args.find((a) => a.startsWith('+')) || args[args.indexOf('--phone') + 1]
const probePhone = normalizeSmscPhone(phoneArg || DEFAULT_PROBE_PHONE)

function log(section, ok, detail = '') {
  const mark = ok === null ? '·' : ok ? '✓' : '✗'
  console.log(`  ${mark}  ${section}${detail ? ` — ${detail}` : ''}`)
}

function normalizeSmscPhone(input) {
  const digits = String(input).replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) return digits.slice(1)
  if (digits.length === 10) return `7${digits}`
  if (digits.length === 11 && digits.startsWith('7')) return digits
  return digits
}

function normalizeE164(input) {
  const p = normalizeSmscPhone(input)
  return p.startsWith('7') ? `+${p}` : `+7${p}`
}

async function smscRequest(env, params) {
  const login = env.SMSC_LOGIN
  const password = env.SMSC_PASSWORD
  const apikey = env.SMSC_API_KEY
  const body = new URLSearchParams({ login, fmt: '3', charset: 'utf-8', ...params })
  if (apikey) body.set('apikey', apikey)
  else if (password) body.set('psw', password)
  const res = await fetch('https://smsc.ru/sys/send.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  })
  const text = await res.text()
  try {
    return { status: res.status, data: JSON.parse(text), raw: text }
  } catch {
    return { status: res.status, data: null, raw: text }
  }
}

/** Signature webhook compatible Supabase Auth → send-sms */
function signHookPayload(secret, payloadObj) {
  const whSecret = secret.replace(/^v1,whsec_/, '')
  const msgId = `msg_${randomBytes(16).toString('hex')}`
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const payload = JSON.stringify(payloadObj)
  const signed = `${msgId}.${timestamp}.${payload}`
  const key = Buffer.from(whSecret, 'base64')
  const sig = createHmac('sha256', key).update(signed).digest('base64')
  return {
    payload,
    headers: {
      'content-type': 'application/json',
      'webhook-id': msgId,
      'webhook-timestamp': timestamp,
      'webhook-signature': `v1,${sig}`,
    },
  }
}

async function testLevel1Smsc(env) {
  console.log('\n══ NIVEAU 1 — SMSC.ru (API directe) ══')
  const balanceBody = new URLSearchParams({ login: env.SMSC_LOGIN, fmt: '3' })
  if (env.SMSC_API_KEY) balanceBody.set('apikey', env.SMSC_API_KEY)
  else balanceBody.set('psw', env.SMSC_PASSWORD)
  const balRes = await fetch('https://smsc.ru/sys/balance.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: balanceBody,
  })
  const bal = await balRes.json().catch(() => ({}))
  log('Solde', !bal.error, bal.error ? String(bal.error) : `${bal.balance} ₽`)

  const costNoSender = await smscRequest(env, {
    phones: probePhone,
    mes: 'Код MOXT: 123456. Никому не сообщайте.',
    cost: '1',
  })
  const okCost = !costNoSender.data?.error
  log('Simulation coût (sans sender)', okCost, costNoSender.data?.error || `~${costNoSender.data?.cost} ₽`)

  const costWithSender = await smscRequest(env, {
    phones: probePhone,
    mes: 'Код MOXT: 123456. Никому не сообщайте.',
    cost: '1',
    sender: env.SMSC_SENDER || 'MOXT',
  })
  const senderErr = costWithSender.data?.error
  log(
    `Simulation avec sender «${env.SMSC_SENDER || 'MOXT'}»`,
    !senderErr,
    senderErr || `~${costWithSender.data?.cost} ₽`,
  )

  if (liveSend) {
    const live = await smscRequest(env, {
      phones: probePhone,
      mes: 'Код MOXT: 000000. Тест pipeline.',
      cost: '3',
      sender: env.SMSC_SENDER || '',
    })
    log('Envoi réel SMSC', !live.data?.error, live.data?.error || `id=${live.data?.id}`)
  } else {
    log('Envoi réel SMSC', null, 'ignoré (ajoutez --live-send)')
  }

  return { okCost, senderErr }
}

async function testLevel2EdgeFunction(env) {
  console.log('\n══ NIVEAU 2 — Edge Function send-sms ══')
  const url = `${SUPABASE_URL}/functions/v1/send-sms`
  const secret = env.SEND_SMS_HOOK_SECRET
  if (!secret) {
    log('SEND_SMS_HOOK_SECRET', false, 'manquant localement')
    return { hookOk: false }
  }

  const badRes = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'webhook-signature': 'v1,bad' },
    body: JSON.stringify({}),
  })
  log('Rejet signature invalide', badRes.status === 401, `HTTP ${badRes.status}`)

  const signed = signHookPayload(secret, {
    user: { phone: normalizeE164(probePhone) },
    sms: { otp: '123456' },
  })
  const goodRes = await fetch(url, {
    method: 'POST',
    headers: signed.headers,
    body: signed.payload,
  })
  const goodBody = await goodRes.json().catch(() => ({}))
  const hookOk = goodRes.status === 200
  const errMsg = goodBody?.error?.message || goodBody?.error || JSON.stringify(goodBody)
  log('Hook signé → send-sms', hookOk, hookOk ? 'OK' : `HTTP ${goodRes.status}: ${errMsg}`)

  if (goodRes.status === 401) {
    log('Cause probable', false, 'secret hook désynchronisé — npm run setup:smsc')
  }

  return { hookOk, hookError: errMsg, hookStatus: goodRes.status }
}

async function testLevel3SupabaseAuth(phoneE164) {
  console.log('\n══ NIVEAU 3 — Supabase Auth ══')

  async function otp(label, body) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        authorization: `Bearer ${ANON_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    const detail = data?.msg || data?.message || data?.error_description || JSON.stringify(data)
    const ok = res.status >= 200 && res.status < 300
    log(label, ok, ok ? 'OK' : `HTTP ${res.status}: ${detail}`)
    return { ok, status: res.status, detail }
  }

  const login = await otp('Connexion OTP (create_user: false)', {
    phone: phoneE164,
    create_user: false,
  })
  const signup = await otp('Inscription OTP (create_user: true)', {
    phone: phoneE164,
    create_user: true,
  })

  return {
    authOk: signup.ok,
    authLoginOk: login.ok,
    authError: signup.detail || login.detail,
    authStatus: signup.status,
  }
}

async function testLevel4RemoteSecrets(env) {
  console.log('\n══ NIVEAU 4 — Secrets Supabase (CLI) ══')
  const token = env.SUPABASE_ACCESS_TOKEN
  if (!token) {
    log('SUPABASE_ACCESS_TOKEN', false, 'manquant — impossible de lire les secrets distants')
    return
  }
  const supabaseJs = new URL('../node_modules/supabase/dist/supabase.js', import.meta.url)
  const { spawnSync } = await import('node:child_process')
  const result = spawnSync(
    process.execPath,
    [supabaseJs.pathname, 'secrets', 'list', '--project-ref', PROJECT_REF],
    {
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
      encoding: 'utf8',
    },
  )
  const out = `${result.stdout || ''}${result.stderr || ''}`
  const needed = ['SMS_PROVIDER', 'SMSC_LOGIN', 'SEND_SMS_HOOK_SECRET']
  for (const key of needed) {
    log(`Secret distant ${key}`, out.includes(key), out.includes(key) ? 'présent' : 'ABSENT')
  }
}

async function main() {
  const env = loadPhase2Env()
  const phoneE164 = normalizeE164(probePhone)

  console.log('\n══════════════════════════════════════════════')
  console.log('  MOXT — test pipeline SMS OTP (complet)')
  console.log('══════════════════════════════════════════════')
  console.log(`  Numéro test : ${phoneE164}`)
  console.log(`  Provider    : ${env.SMS_PROVIDER || 'auto'}`)

  const l1 = await testLevel1Smsc(env)
  const l2 = await testLevel2EdgeFunction(env)
  const l3 = await testLevel3SupabaseAuth(phoneE164)
  await testLevel4RemoteSecrets(env)

  console.log('\n══ SYNTHÈSE ══')
  if (l1.senderErr) {
    console.log('  → Expéditeur MOXT refusé par SMSC : désactivez SMSC_SENDER ou validez-le sur smsc.ru')
  }
  if (l1.okCost === false) {
    console.log('  → SMSC refuse le numéro : mode test actif ou numéro non autorisé sur smsc.ru')
  }
  if (l2.hookStatus === 401) {
    console.log('  → Secret hook invalide : npm run setup:smsc && npm run setup:supabase')
  }
  if (l2.hookStatus === 500) {
    console.log(`  → send-sms échoue : ${l2.hookError}`)
  }
  if (!l3.authOk && !l3.authLoginOk) {
    console.log(`  → Auth Supabase : ${l3.authError}`)
    console.log('  → Vérifiez enable_signup dans Supabase Auth : npm run setup:supabase')
  }
  if (l1.okCost && l2.hookOk && l3.authOk) {
    console.log('  ✓ Pipeline complet OK — le SMS devrait arriver sur le numéro testé.')
  }

  const failed = !l1.okCost || !l2.hookOk || (!l3.authOk && !l3.authLoginOk)
  console.log('')
  process.exit(failed ? 1 : 0)
}

main().catch((error) => {
  console.error(`\nErreur fatale : ${error.message}`)
  process.exit(1)
})
