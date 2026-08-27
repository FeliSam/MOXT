import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseEnv(filePath) {
  const out = {}
  if (!existsSync(filePath)) return out
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[trimmed.slice(0, eq).trim()] = value
  }
  return out
}

const local = parseEnv(path.join(root, 'moxt-react', '.env.local'))
const p2 = parseEnv(path.join(root, 'scripts', 'phase2.env'))
const url = local.VITE_SUPABASE_URL || 'https://rbvqfkccbkwjxkvpnwqn.supabase.co'
const anon = local.VITE_SUPABASE_ANON_KEY || local.VITE_SUPABASE_PUBLISHABLE_KEY
const email = process.env.MOXT_TEST_EMAIL || p2.MOXT_E2E_EMAIL || p2.MOXT_TEST_EMAIL
const password = process.env.MOXT_TEST_PASSWORD || p2.MOXT_E2E_PASSWORD || p2.MOXT_TEST_PASSWORD

const questions = [
  'Comment effectuer un transfert argent Russie Afrique ?',
  'Où en est mon dernier transfert ?',
  'Quels échangeurs recommandez-vous ?',
]

async function login() {
  if (!anon) throw new Error('anon key missing in moxt-react/.env.local')
  if (!email || !password) {
    return { token: null, note: 'no test user credentials in phase2.env' }
  }
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { token: null, note: `login failed ${res.status}: ${data.error_description || data.msg || JSON.stringify(data)}` }
  }
  return { token: data.access_token, note: 'logged in' }
}

async function ask(token, question) {
  const started = Date.now()
  const res = await fetch(`${url}/functions/v1/ai-assistant`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token || anon}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      language: 'fr',
      history: [],
      candidates: [
        { id: 'page-transfers', label: 'Nouveau transfert', path: '/transfers/new' },
        { id: 'page-transfers-history', label: 'Mes transferts', path: '/transfers' },
        { id: 'page-exchangers', label: 'Échangeurs', path: '/exchangers' },
      ],
      draft: {
        text: 'BROUILLON STATIQUE: Pour un transfert, ouvrez Nouveau transfert puis choisissez un échangeur.',
        actions: [
          { label: 'Nouveau transfert', path: '/transfers/new' },
          { label: 'Mes transferts', path: '/transfers' },
        ],
        suggestions: ['Quels sont les délais ?', 'Comment déclarer un paiement ?'],
      },
      context: {
        toolsUsed: ['search_content'],
        searchHits: [{ id: 'page-transfers', type: 'page', title: 'Transferts', path: '/transfers' }],
        transfers: [],
        focusedTransfer: null,
        exchangers: [],
      },
    }),
  })
  const raw = await res.text()
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    data = { raw }
  }
  return {
    question,
    status: res.status,
    ms: Date.now() - started,
    provider: data.provider || null,
    toolsUsed: data.toolsUsed || null,
    actionIds: data.actionIds || null,
    followUps: data.followUps || null,
    citations: data.citations || null,
    text: data.text || data.error || raw.slice(0, 500),
    looksStatic: typeof data.text === 'string' && data.text.includes('BROUILLON STATIQUE'),
  }
}

const { token, note } = await login()
const results = []
for (const q of questions) {
  results.push(await ask(token, q))
}

const report = { login: note, hasToken: Boolean(token), results }
writeFileSync(path.join(root, 'scripts', '.moxti-assistant-test.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
