import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets')

function shell({ bg, accent, inner }) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img">',
    '<defs>',
    `<linearGradient id="bg" x1="16" y1="12" x2="144" y2="148" gradientUnits="userSpaceOnUse">`,
    `<stop stop-color="${bg}"/><stop offset="1" stop-color="${accent}"/>`,
    '</linearGradient>',
    '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">',
    '<feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.18"/>',
    '</filter>',
    '</defs>',
    '<rect width="160" height="160" rx="36" fill="url(#bg)"/>',
    '<circle cx="124" cy="36" r="18" fill="#ffffff" opacity="0.16"/>',
    '<circle cx="36" cy="124" r="22" fill="#ffffff" opacity="0.1"/>',
    `<g filter="url(#shadow)" transform="translate(80 82)">${inner}</g>`,
    '</svg>',
  ].join('')
}

const icons = {
  transfer: '<path fill="#fff" d="M-34-8h22v16h-22zm44-8h22v16h-22zm-12 0 10 10-10 10-6-6 4-4h-16v-8h16l-4-4z"/>',
  marketplace:
    '<path fill="#fff" d="M-28-18h56l-6 12H-22zm-4 16v22H-18V-2zm8 0v22h8V-2zm8 0v22h8V-2zm8 0v22h8V-2z"/>',
  parcel:
    '<path fill="#fff" d="M-30-14 0-28 30-14v34l-30 14-30-14zm0 8 18-8v18l-18 8zm22-8v18l8 4V-6z"/>',
  job: '<path fill="#fff" d="M-28-10h16v-8h24v8h16v36H-28zm8 8h40v20H-20zm12 20v10h16V18z"/>',
  event:
    '<path fill="#fff" d="M-26-16h52v42H-26zm8 8v8h8v-8zm16 0v8h8v-8zm16 0v8h8v-8zM-18 10h36v8H-18z"/>',
  exchanger:
    '<circle cx="0" cy="0" r="24" fill="none" stroke="#fff" stroke-width="6"/><path fill="#fff" d="M-10-4h20v8h-20zm-6 8 6-6 6 6-4 4h-8z"/>',
  community:
    '<circle cx="-16" cy="-4" r="10" fill="#fff"/><circle cx="16" cy="-4" r="10" fill="#fff"/><path fill="#fff" d="M-34 18c0-10 8-16 18-16s18 6 18 16zm20 0c0-10 8-16 18-16s18 6 18 16z"/>',
  business:
    '<path fill="#fff" d="M-28-18h56v44H-28zm8 8h12v10H-20zm16 0h12v10H-4zm-24 18h40v8H-20z"/>',
  p2p: '<path fill="#fff" d="M-24-10h20v8H-24zm28 0h20v8H4zm-14 8-10 10h20z"/>',
  smartphone:
    '<rect x="-16" y="-28" width="32" height="56" rx="6" fill="#fff"/><rect x="-10" y="-20" width="20" height="36" rx="2" fill="#2563eb" opacity="0.35"/>',
  web: '<rect x="-28" y="-18" width="56" height="36" rx="4" fill="#fff"/><rect x="-22" y="-12" width="44" height="24" rx="2" fill="#7c3aed" opacity="0.35"/>',
  course:
    '<path fill="#fff" d="M-30-8 0-22 30-8v28l-30 12-30-12zm0 4v20l18-8V0z"/>',
  documents:
    '<path fill="#fff" d="M-18-24h20l10 10v38H-18zm12 2v8h8zm-8 16h28v8H-14zm0 12h20v8H-14z"/>',
  apartment:
    '<path fill="#fff" d="M0-28 28-8v36H-28V-8zm-8 12h16v16H-8z"/>',
  motorcycle:
    '<circle cx="-14" cy="10" r="10" fill="none" stroke="#fff" stroke-width="5"/><circle cx="14" cy="10" r="10" fill="none" stroke="#fff" stroke-width="5"/><path fill="#fff" d="M-24-6h16l8 8h20l-4 12H-8z"/>',
  food:
    '<path fill="#fff" d="M-24-8c0-12 10-18 24-18s24 6 24 18v8H-24zm8 8h32v12H-16z"/>',
  logoMark:
    '<path fill="#fff" d="M-34-12h18v36h-18zm22 0h18l14 28 14-28h18L-2 24h-18z"/>',
}

const palettes = {
  brand: ['#07594d', '#36c6aa'],
  blue: ['#1d4ed8', '#60a5fa'],
  violet: ['#6d28d9', '#c4b5fd'],
  amber: ['#b45309', '#fbbf24'],
  slate: ['#334155', '#94a3b8'],
  green: ['#15803d', '#86efac'],
}

function pair(name) {
  const [bg, accent] = palettes[name]
  return { bg, accent }
}

const files = {
  'logos/X.svg': shell({ ...pair('brand'), inner: icons.logoMark }),
  'logos/MOXTlogo.svg': shell({ ...pair('brand'), inner: icons.logoMark }),
  'services/quick-marketplace.svg': shell({ ...pair('blue'), inner: icons.marketplace }),
  'services/quick-parcel.svg': shell({ ...pair('amber'), inner: icons.parcel }),
  'services/quick-job.svg': shell({ ...pair('violet'), inner: icons.job }),
  'services/quick-event.svg': shell({ ...pair('brand'), inner: icons.event }),
  'services/service-transfer.svg': shell({ ...pair('brand'), inner: icons.transfer }),
  'services/service-marketplace.svg': shell({ ...pair('blue'), inner: icons.marketplace }),
  'services/service-parcel.svg': shell({ ...pair('amber'), inner: icons.parcel }),
  'services/service-exchangers.svg': shell({ ...pair('brand'), inner: icons.exchanger }),
  'services/service-community.svg': shell({ ...pair('violet'), inner: icons.community }),
  'services/service-businesses.svg': shell({ ...pair('blue'), inner: icons.business }),
  'services/service-p2p.svg': shell({ ...pair('green'), inner: icons.p2p }),
  'marketplace/smartphone.svg': shell({ ...pair('blue'), inner: icons.smartphone }),
  'marketplace/web-design.svg': shell({ ...pair('violet'), inner: icons.web }),
  'marketplace/russian-course.svg': shell({ ...pair('brand'), inner: icons.course }),
  'marketplace/travel-documents.svg': shell({ ...pair('amber'), inner: icons.documents }),
  'marketplace/studio-apartment.svg': shell({ ...pair('blue'), inner: icons.apartment }),
  'marketplace/urban-motorcycle.svg': shell({ ...pair('slate'), inner: icons.motorcycle }),
  'marketplace/benin-food.svg': shell({ ...pair('green'), inner: icons.food }),
}

for (const [rel, content] of Object.entries(files)) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

console.log(`Created ${Object.keys(files).length} illustrated assets in ${root}`)
