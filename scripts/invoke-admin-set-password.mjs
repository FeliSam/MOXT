#!/usr/bin/env node
/**
 * Réinitialise un mot de passe via l’edge function admin-set-user-password.
 * Usage :
 *   node scripts/invoke-admin-set-password.mjs --phone +79999674750 --password '123456Aa'
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPhase2Env, root as monorepoRoot } from './lib/env.mjs'

function readProdAnonKey() {
  const prodPath = path.join(monorepoRoot, 'moxt-react', '.env.production')
  if (!existsSync(prodPath)) return ''
  for (const line of readFileSync(prodPath, 'utf8').split(/\r?\n/)) {
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      return line.slice('VITE_SUPABASE_ANON_KEY='.length).trim()
    }
  }
  return ''
}

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(name)
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback
}

async function main() {
  const vars = loadPhase2Env()
  const url = vars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey =
    vars.VITE_SUPABASE_ANON_KEY ||
    readProdAnonKey() ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const promotePassword = vars.MOXT_ADMIN_PROMOTE_PASSWORD || process.env.MOXT_ADMIN_PROMOTE_PASSWORD

  const phone = arg('--phone')
  const email = arg('--email')
  const userId = arg('--user-id')
  const password = arg('--password')

  if (!url || !anonKey || !promotePassword) {
    console.error('VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY et MOXT_ADMIN_PROMOTE_PASSWORD requis')
    process.exit(1)
  }
  if (!password) {
    console.error('Indiquez --password')
    process.exit(1)
  }

  const client = createClient(url, anonKey)
  const { data, error } = await client.functions.invoke('admin-set-user-password', {
    body: { phone, email, userId, password, promotePassword },
  })

  if (error) {
    let detail = data?.error
    if (!detail && error?.context && typeof error.context.json === 'function') {
      try {
        detail = (await error.context.json())?.error
      } catch {
        // ignore
      }
    }
    throw new Error(detail || error.message)
  }

  console.log(JSON.stringify(data, null, 2))

  const verify = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const loginPhone = phone || ''
  const loginEmail = email || ''
  if (loginPhone) {
    const { data: session, error: loginError } = await verify.auth.signInWithPassword({
      phone: loginPhone,
      password,
    })
    if (!loginError && session.session) {
      console.log(JSON.stringify({ verify: { ok: true, channel: 'phone' } }, null, 2))
      return
    }
  }
  if (loginEmail) {
    const { data: session, error: loginError } = await verify.auth.signInWithPassword({
      email: loginEmail.toLowerCase(),
      password,
    })
    if (!loginError && session.session) {
      console.log(JSON.stringify({ verify: { ok: true, channel: 'email' } }, null, 2))
      return
    }
  }

  const phoneLogin = await verify.functions.invoke('phone-login', {
    body: { phone: loginPhone, password },
  })
  if (phoneLogin.data?.access_token) {
    console.log(JSON.stringify({ verify: { ok: true, channel: 'phone-login' } }, null, 2))
    return
  }

  throw new Error('Mot de passe mis à jour mais vérification connexion échouée')
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
