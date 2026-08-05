#!/usr/bin/env node
/**
 * Crée ou recrée une VM Yandex + LibreTranslate (Docker) pour la traduction P2P MOXT.
 *
 * Prérequis : yc init (folder default, zone ru-central1-a)
 * Usage     : npm run setup:libretranslate:yandex
 *             npm run setup:libretranslate:yandex -- --recreate
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

function supabaseArgs(args) {
  return [...args, '--project-ref', projectRef]
}
const defaultSgId = 'enpm7d536sju57dkupnf'
const recreate = process.argv.includes('--recreate')

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

function buildCloudInit(apiKey) {
  return `#cloud-config
package_update: true
packages:
  - docker.io
write_files:
  - path: /root/lt-api-key
    content: ${apiKey}
    permissions: '0600'
  - path: /usr/local/bin/start-libretranslate.sh
    permissions: '0755'
    content: |
      #!/bin/bash
      set -euo pipefail
      KEY=$(cat /root/lt-api-key)
      systemctl start docker
      docker pull libretranslate/libretranslate
      docker rm -f libretranslate 2>/dev/null || true
      docker run -d --name libretranslate --restart unless-stopped \\
        -p 0.0.0.0:5000:5000 \\
        -e LT_LOAD_ONLY=fr,en,ru,pt,es \\
        -e LT_API_KEYS="$KEY" \\
        libretranslate/libretranslate
runcmd:
  - systemctl enable docker
  - systemctl start docker
  - /usr/local/bin/start-libretranslate.sh
`
}

async function waitForTranslate(baseUrl, apiKey, attempts = 80) {
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
        signal: AbortSignal.timeout(20_000),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok && data?.translatedText) return true
    } catch {
      // démarrage / chargement modèles
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

  const envVars = parseEnvFile(envPath)
  const apiKey =
    envVars.LIBRETRANSLATE_API_KEY && !recreate
      ? envVars.LIBRETRANSLATE_API_KEY
      : randomBytes(16).toString('hex')

  const cloudInitPath = path.join(root, 'scripts', '.cloud-init-libretranslate.generated.yaml')
  writeFileSync(cloudInitPath, buildCloudInit(apiKey), 'utf8')

  const existing = yc('compute', 'instance', 'list', '--folder-id', folderId, '--format', 'json')
  let instances = []
  try {
    instances = JSON.parse(existing || '[]')
  } catch {
    instances = []
  }
  const found = instances.find((item) => item.name === instanceName)

  if (found && recreate) {
    log('Suppression VM', instanceName)
    yc('compute', 'instance', 'delete', instanceName, '--folder-id', folderId, '--async')
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 5000))
      const list = JSON.parse(
        yc('compute', 'instance', 'list', '--folder-id', folderId, '--format', 'json') || '[]',
      )
      if (!list.some((item) => item.name === instanceName)) break
    }
  }

  const stillThere = JSON.parse(
    yc('compute', 'instance', 'list', '--folder-id', folderId, '--format', 'json') || '[]',
  ).some((item) => item.name === instanceName)

  if (!stillThere) {
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

    log('Création VM', `${instanceName} (${zone}, 8 Go RAM)`)
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
      'size=30,type=network-hdd,image-family=ubuntu-2204-lts,image-folder-id=standard-images',
      '--cores',
      '2',
      '--memory',
      '8',
      '--metadata-from-file',
      `user-data=${cloudInitPath}`,
    )
  } else {
    log('VM existante', `${instanceName} (utilisez --recreate si Docker est cassé)`)
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

  log('Attente démarrage', 'jusqu’à ~20 min (image + modèles fr/en/ru/pt/es)')
  process.stdout.write('  ')
  const ready = await waitForTranslate(ltUrl, apiKey)
  console.log('')
  if (!ready) {
    console.warn('\n⚠ LibreTranslate pas encore prêt.')
    console.warn(`  URL : ${ltUrl}`)
    console.warn('  Relancez dans 5–10 min : npm run setup:libretranslate')
    process.exit(1)
  }

  log('Secrets Supabase + edge translate-message')
  if (runSupabase(supabaseArgs(['link', '--yes'])) !== 0) {
    throw new Error('Liaison Supabase échouée.')
  }
  if (runSupabase(supabaseArgs(['secrets', 'set', `LIBRETRANSLATE_URL=${ltUrl}`])) !== 0) {
    throw new Error('Secret LIBRETRANSLATE_URL échoué.')
  }
  if (runSupabase(supabaseArgs(['secrets', 'set', `LIBRETRANSLATE_API_KEY=${apiKey}`])) !== 0) {
    throw new Error('Secret LIBRETRANSLATE_API_KEY échoué.')
  }
  if (runSupabase(supabaseArgs(['functions', 'deploy', 'translate-message'])) !== 0) {
    throw new Error('Deploy translate-message échoué.')
  }

  console.log('\n✓ LibreTranslate opérationnel sur Yandex.')
  console.log(`  URL : ${ltUrl}`)
  console.log('  Test : admin → Messages → appui long → globe → langue')
}

main().catch((err) => {
  console.error(`\n✗ ${err.message || err}`)
  process.exit(1)
})
