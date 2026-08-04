#!/usr/bin/env node
/**
 * Crée une VM Yandex + LibreTranslate (Docker) pour la traduction P2P MOXT.
 *
 * Prérequis : yc init (folder default, zone ru-central1-a)
 * Usage     : npm run setup:libretranslate:yandex
 */
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const folderId = 'b1gmns3k9udjtgk89c9i'
const zone = 'ru-central1-a'
const subnetName = 'default-ru-central1-a'
const instanceName = 'moxt-libretranslate'
const projectRef = 'rbvqfkccbkwjxkvpnwqn'
const defaultSgId = 'enpm7d536sju57dkupnf'

function log(title, detail = '') {
  console.log(`\n▸ ${title}${detail ? `\n  ${detail}` : ''}`)
}

function yc(...args) {
  const ycBin =
    process.env.YC_BIN ||
    (process.platform === 'win32'
      ? path.join(process.env.USERPROFILE || '', 'yandex-cloud', 'bin', 'yc.exe')
      : 'yc')
  const result = spawnSync(ycBin, args, { encoding: 'utf8', shell: false })
  const out = `${result.stdout || ''}${result.stderr || ''}`
  if (result.status !== 0) {
    throw new Error(out.trim() || `yc ${args.join(' ')} failed`)
  }
  return (result.stdout || '').trim()
}

function upsertEnvVar(key, value) {
  const lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split(/\r?\n/) : []
  let replaced = false
  const next = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      replaced = true
      return `${key}=${value}`
    }
    return line
  })
  if (!replaced) next.push(`${key}=${value}`)
  writeFileSync(envPath, `${next.join('\n').trimEnd()}\n`, 'utf8')
}

function runSupabase(args) {
  const supabaseJs = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js')
  const result = existsSync(supabaseJs)
    ? spawnSync(process.execPath, [supabaseJs, ...args], { cwd: root, encoding: 'utf8' })
    : spawnSync('npx', ['supabase', ...args], {
        cwd: root,
        encoding: 'utf8',
        shell: process.platform === 'win32',
      })
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  return result.status ?? 1
}

async function waitForTranslate(baseUrl, apiKey, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          q: 'Hello',
          source: 'en',
          target: 'fr',
          format: 'text',
        }),
        signal: AbortSignal.timeout(15_000),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok && data?.translatedText) return true
    } catch {
      // VM / Docker encore en démarrage
    }
    await new Promise((r) => setTimeout(r, 15_000))
    process.stdout.write('.')
  }
  return false
}

async function main() {
  console.log('\n══════════════════════════════════════')
  console.log('  MOXT — VM Yandex + LibreTranslate')
  console.log('══════════════════════════════════════')

  const apiKey = randomBytes(16).toString('hex')
  const cloudInitPath = path.join(root, 'scripts', '.cloud-init-libretranslate.generated.yaml')
  const cloudInit = `#cloud-config
package_update: true
packages:
  - docker.io
runcmd:
  - systemctl enable docker
  - systemctl start docker
  - docker pull libretranslate/libretranslate
  - docker rm -f libretranslate 2>/dev/null || true
  - docker run -d --name libretranslate --restart unless-stopped -p 5000:5000 libretranslate/libretranslate --load-only fr,en,ru,pt,es --api-keys "${apiKey}"
`
  writeFileSync(cloudInitPath, cloudInit, 'utf8')

  const existing = yc('compute', 'instance', 'list', '--folder-id', folderId, '--format', 'json')
  let instances = []
  try {
    instances = JSON.parse(existing || '[]')
  } catch {
    instances = []
  }
  const found = instances.find((item) => item.name === instanceName)

  if (!found) {
    log('Règle firewall', 'port 5000/tcp (traduction)')
    try {
      yc(
        'vpc',
        'security-group',
        'update-rules',
        defaultSgId,
        '--add-rule',
        'direction=ingress,port=5000,protocol=tcp,v4-cidrs=[0.0.0.0/0],description=LibreTranslate',
      )
    } catch (err) {
      console.warn(`  ⚠ Règle SG : ${err.message}`)
    }

    log('Création VM', `${instanceName} (${zone})`)
    yc(
      'compute',
      'instance',
      'create',
      '--name',
      instanceName,
      '--zone',
      zone,
      '--folder-id',
      folderId,
      '--network-interface',
      `subnet-name=${subnetName},nat-ip-version=ipv4,security-group-ids=${defaultSgId}`,
      '--create-boot-disk',
      'size=20,type=network-hdd,image-family=ubuntu-2204-lts,image-folder-id=standard-images',
      '--cores',
      '2',
      '--memory',
      '8',
      '--metadata-from-file',
      `user-data=${cloudInitPath}`,
    )
  } else {
    log('VM existante', instanceName)
  }

  const infoRaw = yc(
    'compute',
    'instance',
    'get',
    instanceName,
    '--folder-id',
    folderId,
    '--format',
    'json',
  )
  const info = JSON.parse(infoRaw)
  const publicIp =
    info.network_interfaces?.[0]?.primary_v4_address?.one_to_one_nat?.address ||
    info.network_interfaces?.[0]?.primary_v4_address?.address
  if (!publicIp) {
    throw new Error('IP publique introuvable sur la VM.')
  }

  const ltUrl = `http://${publicIp}:5000`
  log('URL LibreTranslate', ltUrl)
  upsertEnvVar('LIBRETRANSLATE_URL', ltUrl)
  upsertEnvVar('LIBRETRANSLATE_API_KEY', apiKey)

  log('Attente démarrage Docker', '1–5 min (téléchargement modèles)')
  process.stdout.write('  ')
  const ready = await waitForTranslate(ltUrl, apiKey)
  console.log('')
  if (!ready) {
    console.warn('\n⚠ LibreTranslate pas encore prêt — réessayez dans quelques minutes :')
    console.warn(`  npm run setup:libretranslate`)
    console.warn(`  URL : ${ltUrl}`)
    process.exit(1)
  }

  log('Secrets Supabase')
  if (runSupabase(['link', '--project-ref', projectRef, '--yes']) !== 0) {
    throw new Error('Liaison Supabase échouée.')
  }
  if (runSupabase(['secrets', 'set', `LIBRETRANSLATE_URL=${ltUrl}`, '--linked']) !== 0) {
    throw new Error('Secret LIBRETRANSLATE_URL échoué.')
  }
  if (runSupabase(['secrets', 'set', `LIBRETRANSLATE_API_KEY=${apiKey}`, '--linked']) !== 0) {
    throw new Error('Secret LIBRETRANSLATE_API_KEY échoué.')
  }
  if (runSupabase(['functions', 'deploy', 'translate-message', '--linked']) !== 0) {
    throw new Error('Deploy translate-message échoué.')
  }

  console.log('\n✓ LibreTranslate opérationnel sur Yandex.')
  console.log(`  URL  : ${ltUrl}`)
  console.log(`  Clé  : enregistrée dans scripts/phase2.env`)
  console.log('  Test : admin → Messages → globe → choisir une langue')
}

main().catch((err) => {
  console.error(`\n✗ ${err.message || err}`)
  process.exit(1)
})
