/**
 * code.to.design API (clé `htmlTofigma` dans scripts/phase2.env).
 * Produit un HTML clipboard à coller dans Figma (Ctrl+V sur le canvas).
 *
 *   node scripts/html-to-figma.mjs --balance
 *   node scripts/html-to-figma.mjs --url https://moxtapp.ru/login --name Login
 *   node scripts/html-to-figma.mjs --file capture.html --name Feed
 */
import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, 'scripts', 'phase2.env')
const outDir = path.join(root, 'scripts', '.html-to-figma-out')
const API = 'https://api.to.design'

function loadPhase2() {
  if (!fs.existsSync(envPath)) {
    console.error('scripts/phase2.env introuvable')
    process.exit(1)
  }
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]
      }),
  )
}

function apiKey(env) {
  return env.htmlTofigma || env.HTML_TO_FIGMA || env.C2D_API_KEY || ''
}

function parseArgs(argv) {
  const out = { width: 390, height: 844, theme: 'light', name: 'MOXT' }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    const next = argv[i + 1]
    if (a === '--balance') out.balance = true
    else if (a === '--url' && next) {
      out.url = next
      i += 1
    } else if (a === '--file' && next) {
      out.file = next
      i += 1
    } else if (a === '--name' && next) {
      out.name = next
      i += 1
    } else if (a === '--width' && next) {
      out.width = Number(next)
      i += 1
    } else if (a === '--height' && next) {
      out.height = Number(next)
      i += 1
    } else if (a === '--theme' && next) {
      out.theme = next
      i += 1
    }
  }
  return out
}

async function request(key, method, route, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`API ${res.status}: ${text.slice(0, 800)}`)
    process.exit(1)
  }
  return text
}

const env = loadPhase2()
const key = apiKey(env)
if (!key) {
  console.error('Clé htmlTofigma manquante dans scripts/phase2.env')
  process.exit(1)
}

const args = parseArgs(process.argv.slice(2))

if (args.balance) {
  const raw = await request(key, 'GET', '/balance')
  console.log(raw)
  process.exit(0)
}

let html = ''
if (args.file) {
  html = fs.readFileSync(path.resolve(root, args.file), 'utf8')
} else if (args.url) {
  const page = await fetch(args.url)
  html = await page.text()
} else {
  console.error('Usage: --balance | --url <https> | --file <html>')
  process.exit(1)
}

if (!html.trim()) {
  console.error('HTML vide')
  process.exit(1)
}

const clip = await request(key, 'POST', '/html', {
  html,
  clip: true,
  topLayerName: args.name,
  width: args.width,
  height: args.height,
  theme: args.theme,
})

fs.mkdirSync(outDir, { recursive: true })
const safe = args.name.replace(/[^\w.-]+/g, '_')
const outFile = path.join(outDir, `${safe}.clip.html`)
fs.writeFileSync(outFile, clip)
console.log(`Clipboard Figma écrit : ${path.relative(root, outFile)} (${clip.length} octets)`)
console.log('Ouvre Figma → canvas → Ctrl+V (coller le contenu HTML du fichier, pas seulement le chemin).')
