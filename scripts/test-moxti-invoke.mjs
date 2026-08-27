import { createClient } from '@supabase/supabase-js'
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
const url = local.VITE_SUPABASE_URL
const anon = local.VITE_SUPABASE_ANON_KEY || local.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL / anon key in moxt-react/.env.local')
  process.exit(1)
}

const sb = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const draftText =
  'BROUILLON STATIQUE FIXE: Pour un transfert, ouvrez Nouveau transfert puis choisissez un échangeur.'

const { data, error } = await sb.functions.invoke('ai-assistant', {
  body: {
    question: 'Comment envoyer de l’argent de la Russie vers le Bénin étape par étape ?',
    language: 'fr',
    candidates: [
      { id: 'page-transfers', label: 'Nouveau transfert', path: '/transfers/new' },
      { id: 'page-exchangers', label: 'Échangeurs', path: '/exchangers' },
    ],
    draft: {
      text: draftText,
      actions: [{ label: 'Nouveau transfert', path: '/transfers/new' }],
      suggestions: ['Quels délais ?'],
    },
    context: {
      toolsUsed: ['search_content'],
      searchHits: [],
      transfers: [],
      focusedTransfer: null,
      exchangers: [],
    },
  },
})

const report = {
  via: 'supabase-js functions.invoke',
  error: error
    ? { name: error.name, message: error.message, status: error.context?.status }
    : null,
  provider: data?.provider || null,
  toolsUsed: data?.toolsUsed || null,
  followUps: data?.followUps || null,
  actionIds: data?.actionIds || null,
  text: data?.text || data?.error || null,
  looksStatic: String(data?.text || '').includes('BROUILLON STATIQUE'),
  sameAsDraft: data?.text === draftText,
}

writeFileSync(path.join(root, 'scripts', '.moxti-invoke-test.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
