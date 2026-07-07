const palette = {
  paper: '#f8fafc',
  paperDark: '#e2e8f0',
  ink: '#0f172a',
  muted: '#64748b',
  brand: '#1d4ed8',
  good: '#059669',
  bad: '#dc2626',
  skin: '#f5c99b',
  skinShadow: '#d9a66b',
}

function Frame({ children, tone = 'neutral' }) {
  const border =
    tone === 'good' ? palette.good : tone === 'bad' ? palette.bad : palette.paperDark
  return (
    <svg viewBox="0 0 320 220" className="size-full" role="img" aria-hidden="true">
      <rect width="320" height="220" rx="16" fill={palette.paper} />
      <rect x="1" y="1" width="318" height="218" rx="15" fill="none" stroke={border} strokeWidth="2" />
      {children}
    </svg>
  )
}

function Person({ x = 160, y = 92, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="0" cy="0" r="28" fill={palette.skin} />
      <ellipse cx="0" cy="42" rx="34" ry="28" fill={palette.brand} opacity="0.85" />
      <circle cx="-10" cy="-4" r="3" fill={palette.ink} />
      <circle cx="10" cy="-4" r="3" fill={palette.ink} />
      <path d="M-8 10 Q0 18 8 10" stroke={palette.ink} strokeWidth="2" fill="none" />
    </g>
  )
}

function IdCard({ x, y, w = 88, h = 56, faded = false }) {
  return (
    <g opacity={faded ? 0.45 : 1}>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="#fff" stroke={palette.ink} strokeWidth="2" />
      <rect x={x + 8} y={y + 8} width="22" height="28" rx="4" fill={palette.paperDark} />
      <rect x={x + 36} y={y + 12} width="40" height="6" rx="3" fill={palette.paperDark} />
      <rect x={x + 36} y={y + 24} width="34" height="5" rx="2.5" fill={palette.paperDark} />
      <rect x={x + 36} y={y + 34} width="28" height="5" rx="2.5" fill={palette.paperDark} />
    </g>
  )
}

const ILLUSTRATIONS = {
  'id-good-full': () => (
    <Frame tone="good">
      <IdCard x="116" y="82" />
      <path d="M24 24 H72 M24 34 H60" stroke={palette.good} strokeWidth="3" strokeLinecap="round" />
      <text x="24" y="196" fill={palette.good} fontSize="14" fontWeight="700">
        ✓ Complet
      </text>
    </Frame>
  ),
  'id-good-passport': () => (
    <Frame tone="good">
      <rect x="108" y="58" width="104" height="132" rx="10" fill="#1e3a8a" />
      <rect x="118" y="72" width="84" height="98" rx="6" fill="#fff" />
      <circle cx="160" cy="108" r="18" fill={palette.paperDark} />
      <rect x="128" y="136" width="64" height="6" rx="3" fill={palette.paperDark} />
      <rect x="128" y="148" width="48" height="5" rx="2.5" fill={palette.paperDark} />
    </Frame>
  ),
  'id-bad-crop': ({ uid = 'id-bad-crop' }) => (
    <Frame tone="bad">
      <clipPath id={`${uid}-crop`}>
        <rect x="40" y="40" width="240" height="140" />
      </clipPath>
      <g clipPath={`url(#${uid}-crop)`}>
        <IdCard x="150" y="82" />
      </g>
      <line x1="24" y1="24" x2="72" y2="72" stroke={palette.bad} strokeWidth="4" />
      <line x1="72" y1="24" x2="24" y2="72" stroke={palette.bad} strokeWidth="4" />
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Coupé
      </text>
    </Frame>
  ),
  'id-bad-blur': ({ uid = 'id-bad-blur' }) => (
    <Frame tone="bad">
      <g filter={`url(#${uid}-blur)`}>
        <IdCard x="116" y="82" />
      </g>
      <defs>
        <filter id={`${uid}-blur`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect x="0" y="0" width="320" height="220" fill="#000" opacity="0.18" />
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Flou
      </text>
    </Frame>
  ),
  'id-bad-screen': () => (
    <Frame tone="bad">
      <rect x="70" y="42" width="180" height="120" rx="12" fill="#111827" />
      <rect x="82" y="54" width="156" height="96" rx="6" fill="#60a5fa" opacity="0.35" />
      <IdCard x="116" y="74" w="72" h="48" faded />
      <rect x="70" y="42" width="180" height="120" rx="12" fill="none" stroke={palette.bad} strokeWidth="2" />
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Écran
      </text>
    </Frame>
  ),
  'selfie-good': () => (
    <Frame tone="good">
      <Person x="118" y="98" />
      <IdCard x="188" y="118" w="72" h="48" />
      <text x="24" y="196" fill={palette.good} fontSize="14" fontWeight="700">
        ✓ Visage + pièce
      </text>
    </Frame>
  ),
  'selfie-good-light': () => (
    <Frame tone="good">
      <circle cx="250" cy="42" r="22" fill="#fde68a" />
      <path d="M228 42 H272 M250 20 V64" stroke="#f59e0b" strokeWidth="3" />
      <Person x="160" y="98" />
      <IdCard x="206" y="126" w="70" h="46" />
    </Frame>
  ),
  'selfie-bad-no-doc': () => (
    <Frame tone="bad">
      <Person x="160" y="98" scale={1.1} />
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Sans pièce
      </text>
    </Frame>
  ),
  'selfie-bad-hidden': () => (
    <Frame tone="bad">
      <Person x="160" y="98" />
      <rect x="132" y="72" width="56" height="12" rx="6" fill="#111827" />
      <rect x="126" y="64" width="68" height="24" rx="12" fill="#111827" opacity="0.75" />
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Visage masqué
      </text>
    </Frame>
  ),
  'selfie-bad-dark': () => (
    <Frame tone="bad">
      <rect width="320" height="220" fill="#0f172a" opacity="0.55" />
      <Person x="160" y="98" />
      <IdCard x="206" y="126" w="70" h="46" faded />
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Trop sombre
      </text>
    </Frame>
  ),
  'address-good-migration': () => (
    <Frame tone="good">
      <rect x="88" y="48" width="144" height="124" rx="10" fill="#fff" stroke={palette.ink} strokeWidth="2" />
      <rect x="104" y="64" width="80" height="6" rx="3" fill={palette.paperDark} />
      <rect x="104" y="78" width="112" height="5" rx="2.5" fill={palette.paperDark} />
      <rect x="104" y="90" width="96" height="5" rx="2.5" fill={palette.paperDark} />
      <circle cx="196" cy="132" r="24" fill="none" stroke={palette.good} strokeWidth="4" />
      <text x="182" y="138" fill={palette.good} fontSize="12" fontWeight="700">
        OK
      </text>
    </Frame>
  ),
  'address-good-bill': () => (
    <Frame tone="good">
      <rect x="92" y="44" width="136" height="132" rx="10" fill="#fff" stroke={palette.ink} strokeWidth="2" />
      <rect x="108" y="60" width="72" height="8" rx="4" fill={palette.brand} opacity="0.8" />
      <rect x="108" y="78" width="104" height="5" rx="2.5" fill={palette.paperDark} />
      <rect x="108" y="90" width="88" height="5" rx="2.5" fill={palette.paperDark} />
      <rect x="108" y="110" width="56" height="18" rx="4" fill="#dcfce7" stroke={palette.good} />
      <text x="116" y="124" fill={palette.good} fontSize="11" fontWeight="700">
        07/2026
      </text>
    </Frame>
  ),
  'address-bad-old': () => (
    <Frame tone="bad">
      <rect x="92" y="44" width="136" height="132" rx="10" fill="#fff" stroke={palette.ink} strokeWidth="2" />
      <rect x="108" y="110" width="56" height="18" rx="4" fill="#fee2e2" stroke={palette.bad} />
      <text x="116" y="124" fill={palette.bad} fontSize="11" fontWeight="700">
        01/2024
      </text>
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Trop ancien
      </text>
    </Frame>
  ),
  'address-bad-name': () => (
    <Frame tone="bad">
      <rect x="92" y="44" width="136" height="132" rx="10" fill="#fff" stroke={palette.ink} strokeWidth="2" />
      <rect x="108" y="70" width="104" height="6" rx="3" fill={palette.paperDark} />
      <rect x="108" y="86" width="88" height="6" rx="3" fill={palette.paperDark} />
      <rect x="108" y="110" width="72" height="18" rx="4" fill="#fee2e2" stroke={palette.bad} strokeDasharray="4 3" />
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Infos manquantes
      </text>
    </Frame>
  ),
  'address-bad-unrelated': () => (
    <Frame tone="bad">
      <rect x="108" y="72" width="104" height="68" rx="10" fill="#1e293b" />
      <rect x="118" y="96" width="84" height="10" rx="5" fill="#f8fafc" />
      <rect x="118" y="114" width="48" height="8" rx="4" fill="#cbd5e1" />
      <text x="24" y="196" fill={palette.bad} fontSize="14" fontWeight="700">
        ✕ Non admis
      </text>
    </Frame>
  ),
}

export function VerificationIllustration({ name }) {
  const Component = ILLUSTRATIONS[name]
  if (!Component) return null
  return <Component uid={name} />
}
