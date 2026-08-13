#!/usr/bin/env node
/**
 * Réinitialise le mot de passe Auth d'un utilisateur (service role) et vérifie la connexion.
 *
 * Usage :
 *   node scripts/reset-user-password.mjs --phone +79999674750 --password '123456Aa'
 *   node scripts/reset-user-password.mjs --user-id <uuid> --password '123456Aa'
 *
 * Requiert SUPABASE_ACCESS_TOKEN (scripts/phase2.env ou env CI).
 */
import { createClient } from '@supabase/supabase-js'
import { loadPhase2Env } from './lib/env.mjs'

const PROJECT_REF = 'rbvqfkccbkwjxkvpnwqn'

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(name)
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback
}

async function getServiceRoleKey(accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`api-keys HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
  const keys = await res.json()
  const list = Array.isArray(keys) ? keys : keys?.api_keys || []
  const service = list.find(
    (k) =>
      k.name === 'service_role' ||
      k.type === 'service_role' ||
      (Array.isArray(k.tags) && k.tags.includes('service_role')),
  )
  const key = service?.api_key || service?.key || service?.secret
  if (!key) throw new Error('service_role key introuvable')
  return key
}

function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '')
}

async function resolveUserId(admin, { userId, phone, email }) {
  if (userId) return userId

  if (phone) {
    const tail = digitsOnly(phone).slice(-10)
    const { data, error } = await admin
      .from('profiles')
      .select('id, phone, email')
      .or(`phone.eq.${phone},phone.ilike.%${tail}%`)
      .limit(5)
    if (error) throw error
    const match =
      data?.find((row) => digitsOnly(row.phone).endsWith(tail)) ||
      data?.find((row) => row.phone === phone) ||
      data?.[0]
    if (match?.id) return match.id
  }

  if (email) {
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    if (error) throw error
    if (data?.id) return data.id
  }

  throw new Error('Utilisateur introuvable (phone / email / user-id).')
}

async function verifyLogin(url, anonKey, { phone, email, password }) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (phone) {
    const { data, error } = await client.auth.signInWithPassword({ phone, password })
    if (!error && data.session) return { channel: 'phone', ok: true }
  }

  if (email) {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })
    if (!error && data.session) return { channel: 'email', ok: true }
  }

  const { data, error } = await client.functions.invoke('phone-login', {
    body: { phone, password },
  })
  if (!error && data?.access_token) return { channel: 'phone-login', ok: true }

  throw new Error(
    `Connexion de vérification échouée: ${error?.message || data?.error || 'session absente'}`,
  )
}

async function main() {
  const phone = arg('--phone')
  const email = arg('--email')
  const userId = arg('--user-id')
  const password = arg('--password')

  if (!password) {
    console.error('Usage: node scripts/reset-user-password.mjs --phone +7... --password ...')
    process.exit(1)
  }
  if (!userId && !phone && !email) {
    console.error('Indiquez --phone, --email ou --user-id')
    process.exit(1)
  }

  const vars = loadPhase2Env()
  const url = vars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey =
    vars.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const accessToken = vars.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN

  if (!url || !anonKey || !accessToken) {
    console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_ACCESS_TOKEN requis')
    process.exit(1)
  }

  const serviceKey = await getServiceRoleKey(accessToken)
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const resolvedId = await resolveUserId(admin, { userId, phone, email })
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, email, phone, phone_verified, first_name, last_name, status')
    .eq('id', resolvedId)
    .maybeSingle()
  if (profileError) throw profileError
  if (!profile) throw new Error(`Profil ${resolvedId} introuvable`)

  const { data: authUser, error: authReadError } = await admin.auth.admin.getUserById(resolvedId)
  if (authReadError) throw authReadError

  const { error: updateError } = await admin.auth.admin.updateUserById(resolvedId, {
    password,
  })
  if (updateError) throw updateError

  const loginPhone = phone || profile.phone || authUser.user?.phone || ''
  const loginEmail = email || profile.email || authUser.user?.email || ''
  const verification = await verifyLogin(url, anonKey, {
    phone: loginPhone,
    email: loginEmail,
    password,
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: resolvedId,
        profile: {
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          phone: profile.phone,
          email: profile.email,
          phoneVerified: profile.phone_verified,
          status: profile.status,
        },
        auth: {
          phoneConfirmed: Boolean(authUser.user?.phone_confirmed_at),
          emailConfirmed: Boolean(authUser.user?.email_confirmed_at),
        },
        verification,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
