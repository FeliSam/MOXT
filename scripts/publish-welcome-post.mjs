#!/usr/bin/env node
/**
 * One-shot: publie le post de lancement MOXT au nom de Feliciano Fanou.
 * Usage: node scripts/publish-welcome-post.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMAGE_PUBLIC_PATH = '/assets/welcome-moxt-launch.png'
const SITE = 'https://moxtapp.ru'

const MESSAGE = `ðŸš€ Bienvenue sur MOXT !

Aujourd'hui marque le dÃ©but d'une nouvelle aventure.

MOXT est bien plus qu'une application : c'est une plateforme qui rassemble une communautÃ© autour de services utiles, fiables et accessibles.

Avec MOXT, vous pouvez dÃ¨s maintenant :

ðŸ’¸ Effectuer des transferts d'argent en toute simplicitÃ©.
ðŸ“¦ Envoyer et recevoir des colis entre plusieurs pays.
ðŸ›ï¸ Acheter, vendre et publier vos annonces sur le Marketplace.
ðŸ’¼ Trouver des offres d'emploi et de nouvelles opportunitÃ©s.
ðŸŽ‰ DÃ©couvrir des Ã©vÃ©nements et des activitÃ©s prÃ¨s de chez vous.
ðŸ¢ Trouver des entreprises et des prestataires de confiance.
ðŸ’¬ Ã‰changer des messages avec les autres utilisateurs grÃ¢ce Ã  une messagerie intÃ©grÃ©e, sÃ©curisÃ©e et instantanÃ©e.

...et ce n'est que le dÃ©but.

Notre ambition est simple : rÃ©unir tous les services essentiels de notre communautÃ© dans une seule application moderne, intuitive et sÃ©curisÃ©e.

ðŸ¤ Rejoignez-nous dÃ¨s aujourd'hui, crÃ©ez votre compte et participez Ã  la construction de cette nouvelle plateforme.

Bienvenue dans la communautÃ© MOXT ! ðŸ’šðŸŒ

MOXT â€” Une plateforme. Une communautÃ©. Des possibilitÃ©s infinies. ðŸš€`

function parseEnv(filePath) {
  const vars = {}
  if (!existsSync(filePath)) return vars
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
    vars[trimmed.slice(0, eq).trim()] = value
  }
  return vars
}

function postId() {
  return `POST-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`
}

async function getServiceRoleKey(accessToken, projectRef) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`api-keys HTTP ${res.status}: ${await res.text()}`)
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

async function main() {
  const phase2 = parseEnv(path.join(root, 'scripts', 'phase2.env'))
  const prod = parseEnv(path.join(root, 'moxt-react', '.env.production'))
  const url = phase2.VITE_SUPABASE_URL || prod.VITE_SUPABASE_URL
  const accessToken = phase2.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
  const projectRef = 'rbvqfkccbkwjxkvpnwqn'
  if (!url || !accessToken) throw new Error('VITE_SUPABASE_URL / SUPABASE_ACCESS_TOKEN manquants')

  const serviceKey = await getServiceRoleKey(accessToken, projectRef)
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url')
    .or(
      'and(first_name.ilike.%Feliciano%,last_name.ilike.%Fanou%),email.ilike.%felicianolheureux%,phone.like.%2924%',
    )
    .limit(5)

  if (profileError) throw new Error(`profiles: ${profileError.message}`)
  if (!profiles?.length) throw new Error('Aucun profil Feliciano Fanou trouvÃ©')

  const profile =
    profiles.find(
      (p) =>
        String(p.first_name || '').toLowerCase().includes('feliciano') &&
        String(p.last_name || '').toLowerCase().includes('fanou'),
    ) || profiles[0]

  const authorName = `${profile.first_name || 'Feliciano'} ${profile.last_name || 'Fanou'}`.trim()
  const now = new Date().toISOString()
  const id = postId()
  const imageUrl = `${SITE}${IMAGE_PUBLIC_PATH}`

  // Upload image to storage as backup (public listings path owned by user)
  const localImage = path.join(root, 'moxt-react', 'public', 'assets', 'welcome-moxt-launch.png')
  let storedUrl = imageUrl
  if (existsSync(localImage)) {
    const bytes = readFileSync(localImage)
    const storagePath = `${profile.id}/posts/welcome-moxt-launch.png`
    const { error: upErr } = await admin.storage.from('listings').upload(storagePath, bytes, {
      contentType: 'image/png',
      upsert: true,
      cacheControl: '3600',
    })
    if (!upErr) {
      const { data } = admin.storage.from('listings').getPublicUrl(storagePath)
      storedUrl = data.publicUrl
    } else {
      console.warn('Upload storage listings Ã©chouÃ©, fallback URL site:', upErr.message)
    }
  }

  const row = {
    id,
    author_id: profile.id,
    author_name: authorName,
    author_avatar_url: profile.avatar_url || null,
    source_type: 'free',
    source_id: null,
    message: MESSAGE,
    image_url: storedUrl,
    direct_link: '/news',
    likes: [],
    comments: [],
    last_shared_at: now,
    status: 'published',
    created_at: now,
    updated_at: now,
  }

  const { error: insertError } = await admin.from('posts').insert(row)
  if (insertError) throw new Error(`posts insert: ${insertError.message}`)

  console.log(
    JSON.stringify(
      {
        ok: true,
        postId: id,
        authorId: profile.id,
        authorName,
        
        imageUrl: storedUrl,
        newsUrl: `${SITE}/news`,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }))
  process.exit(1)
})
