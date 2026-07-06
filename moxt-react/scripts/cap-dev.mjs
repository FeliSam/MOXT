import os from 'node:os'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function isLinkLocal(ip) {
  return ip.startsWith('169.254.')
}

function isDockerOrVpnRange(ip) {
  const parts = ip.split('.').map(Number)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  return false
}

function interfaceScore(name, ip) {
  const lower = name.toLowerCase()
  if (isLinkLocal(ip) || isDockerOrVpnRange(ip)) return -100
  if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('wlan')) return 50
  if (lower.includes('ethernet') || lower.includes('eth')) return 45
  if (ip.startsWith('192.168.')) return 40
  if (ip.startsWith('10.') && ip !== '10.0.2.2') return 20
  if (lower.includes('docker') || lower.includes('veth') || lower.includes('wsl')) return -50
  if (lower.includes('tun') || lower.includes('tap') || lower.includes('vpn')) return -50
  return 0
}

function getLanIp() {
  if (process.env.CAPACITOR_USE_EMULATOR === '1') return '10.0.2.2'

  const candidates = []
  const nets = os.networkInterfaces()

  for (const [name, addresses] of Object.entries(nets)) {
    for (const net of addresses || []) {
      if (net.family !== 'IPv4' || net.internal) continue
      candidates.push({ name, ip: net.address, score: interfaceScore(name, net.address) })
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  const best = candidates.find((item) => item.score > 0)
  if (best) return best.ip

  const fallback = candidates.find((item) => !isLinkLocal(item.ip) && !isDockerOrVpnRange(item.ip))
  return fallback?.ip || '127.0.0.1'
}

const port = process.env.VITE_PORT || '5173'
const ip = process.env.CAPACITOR_LAN_IP || getLanIp()
const serverUrl = `http://${ip}:${port}`

console.log(`\nMOXT Capacitor — live reload\n`)
console.log(`  IP LAN     : ${ip}`)
console.log(`  Server URL : ${serverUrl}`)
if (ip.startsWith('172.')) {
  console.log(`\n  ⚠ IP suspecte (VPN/Docker). Forcez le Wi-Fi :`)
  console.log(`     $env:CAPACITOR_LAN_IP="192.168.x.x"; npm run cap:dev:sync`)
}
console.log(`\nÉtapes :\n`)
console.log(`  1. Terminal A : npm run dev -- --host`)
console.log(`  2. Terminal B : npm run cap:dev:sync`)
console.log(`  3. Android Studio : npm run cap:open:android → Run\n`)
console.log(`  Émulateur Android : $env:CAPACITOR_USE_EMULATOR="1"; npm run cap:dev:sync\n`)

if (process.argv.includes('--sync')) {
  const result = spawnSync('npm', ['run', 'cap:sync'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      CAPACITOR_SERVER_URL: serverUrl,
    },
  })
  process.exit(result.status ?? 1)
}

console.log(`Sync manuel :\n  $env:CAPACITOR_SERVER_URL="${serverUrl}"; npm run cap:sync\n`)
