#!/usr/bin/env node
/**
 * Diagnostic inscription SMS — n'affiche pas les secrets.
 * Usage : node scripts/test-sms-signup.mjs
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidnFma2NjYmt3anhrdnBud3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjI2NDMsImV4cCI6MjA5ODIzODY0M30.ZpAr5eEnxoxy3TQ4hIA3SoX1NTuPg-0pt4UQ2mS5lDI'
const supabaseUrl = 'https://rbvqfkccbkwjxkvpnwqn.supabase.co'

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

async function testSmsRu(apiId) {
  const phone = '79800692924'
  const msg = 'Код MOXT: 123456. Никому не сообщайте.'
  const res = await fetch('https://sms.ru/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ api_id: apiId, to: phone, msg, json: '1' }),
  })
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  return { http: res.status, data }
}

async function testSignUp(phone) {
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      password: 'TestMoxt1!',
      data: {
        first_name: 'Test',
        last_name: 'SMS',
        country: 'RU',
        origin_country: 'BJ',
        role: 'user',
        status: 'active',
      },
      channel: 'sms',
    }),
  })
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  return { http: res.status, data }
}

async function main() {
  console.log('\n══ Diagnostic SMS inscription ══\n')
  const vars = parseEnvFile(envPath)
  const apiId = vars.SMS_RU_API_ID?.trim()
  console.log('phase2.env SMS_RU_API_ID :', apiId ? `présent (${apiId.length} car.)` : 'MANQUANT')
  console.log('SMS_PROVIDER :', vars.SMS_PROVIDER || '—')
  console.log('SEND_SMS_HOOK_SECRET :', vars.SEND_SMS_HOOK_SECRET ? 'présent' : 'MANQUANT')

  if (apiId) {
    console.log('\n▸ Test SMS.ru direct')
    const sms = await testSmsRu(apiId)
    console.log('  HTTP', sms.http)
    if (sms.data?.status === 'OK') {
      const entry = sms.data.sms?.['79800692924']
      console.log('  Résultat :', entry?.status || 'OK', entry?.status_code || '', entry?.status_text || '')
      console.log('  Balance :', sms.data.balance)
    } else {
      console.log('  Erreur :', JSON.stringify(sms.data, null, 2))
    }
  }

  console.log('\n▸ Test Supabase signUp (téléphone)')
  const phone = '+79800692924'
  const signup = await testSignUp(phone)
  console.log('  HTTP', signup.http)
  console.log('  Réponse :', JSON.stringify(signup.data, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
