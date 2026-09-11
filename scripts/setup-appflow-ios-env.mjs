#!/usr/bin/env node
/**
 * Crée / met à jour l’environnement Appflow « production » :
 * GoogleService-Info.plist (base64) + VITE_* depuis .env.production.
 *
 * Token : Ionic_Moxt_APIKey dans scripts/phase2.env
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseEnvFile, phase2EnvPath, root } from './lib/env.mjs'

const APP_ID = 'b13c811c'
const ENV_NAME = 'production'
const API = 'https://api.ionicjs.com/graphql'

function decodeEnvNumericId(relayId) {
  try {
    const decoded = Buffer.from(String(relayId), 'base64').toString('utf8')
    const m = decoded.match(/:(\d+)$/)
    return m ? Number(m[1]) : null
  } catch {
    return null
  }
}

async function gql(token, query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.[0]) throw new Error(json.errors[0].message)
  return json.data
}

const token = parseEnvFile(phase2EnvPath).Ionic_Moxt_APIKey
if (!token) {
  console.error('✗ Ionic_Moxt_APIKey manquant dans scripts/phase2.env')
  process.exit(1)
}

const plistPath = path.join(root, 'moxt-react', 'ios', 'App', 'App', 'GoogleService-Info.plist')
if (!existsSync(plistPath)) {
  console.error('✗ GoogleService-Info.plist local manquant')
  process.exit(1)
}

const prodEnv = parseEnvFile(path.join(root, 'moxt-react', '.env.production'))
const secrets = [
  { name: 'GOOGLE_SERVICE_INFO_PLIST_B64', value: readFileSync(plistPath).toString('base64') },
  { name: 'VITE_SUPABASE_URL', value: prodEnv.VITE_SUPABASE_URL },
  { name: 'VITE_SUPABASE_ANON_KEY', value: prodEnv.VITE_SUPABASE_ANON_KEY },
  { name: 'VITE_VAPID_PUBLIC_KEY', value: prodEnv.VITE_VAPID_PUBLIC_KEY },
  { name: 'VITE_MEDIA_YANDEX_ENABLED', value: prodEnv.VITE_MEDIA_YANDEX_ENABLED },
  { name: 'VITE_MEDIA_CDN_BASE', value: prodEnv.VITE_MEDIA_CDN_BASE },
  { name: 'VITE_MEDIA_PUBLIC_BUCKET', value: prodEnv.VITE_MEDIA_PUBLIC_BUCKET },
  { name: 'VITE_MEDIA_PRIVATE_BUCKET', value: prodEnv.VITE_MEDIA_PRIVATE_BUCKET },
].filter((s) => s.value)

const listed = await gql(
  token,
  `{ app(id: "${APP_ID}") { environments { edges { node { id name } } } } }`,
)
let node = listed.app.environments.edges.map((e) => e.node).find((n) => n.name === ENV_NAME)
if (!node) {
  const created = await gql(
    token,
    `mutation { createEnvironment(input: { appId: "${APP_ID}", name: "${ENV_NAME}" }) { environment { id name } } }`,
  )
  node = created.createEnvironment.environment
}

const numericId = decodeEnvNumericId(node.id)
if (!numericId) {
  console.error('✗ id environnement illisible')
  process.exit(1)
}

const updated = await gql(
  token,
  `mutation UpdateEnv($input: UpdateEnvironmentInput!) {
    updateEnvironment(input: $input) { environment { name secrets { name } } }
  }`,
  { input: { id: numericId, appId: APP_ID, name: ENV_NAME, secrets } },
)

const names = updated.updateEnvironment.environment.secrets.map((s) => s.name)
console.log(`✓ Appflow environment « ${ENV_NAME} » (${APP_ID})`)
console.log(`  secrets : ${names.join(', ')}`)
console.log('\nRelance un build iOS App Store et sélectionne l’environment production.')
console.log('(Le plan free n’autorise pas de déclencher le build via l’API CLI.)')
