import { grainFilterDef, GrainOverlay, useCoverSvgIds } from './coverSvgShared'
import { BusinessEditorialDarkCover } from '../BusinessEditorialDarkCover'

/** business-a-mesh — Mesh teal, centered Moxt / Votre réseau business */
export function BusinessMeshTealCover({ className = '' }) {
  const id = useCoverSvgIds('bizA')
  const mesh = id('mesh')
  const glow = id('glow')
  const grain = id('grain')
  const orb = id('orb')

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#043f45] ${className}`}
      aria-hidden="true"
      data-cover-style="business-a-mesh"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <radialGradient id={orb} cx="20%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#7fd4c8" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#0a6b66" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#043f45" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={glow} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#12a89a" stopOpacity="0" />
            <stop offset="40%" stopColor="#5eead4" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#99f6e4" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id={mesh} cx="70%" cy="70%" r="50%">
            <stop offset="0%" stopColor="#e0fdfa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#043f45" stopOpacity="0" />
          </radialGradient>
          {grainFilterDef(grain, 0.18)}
        </defs>
        <rect width="800" height="220" fill="#043f45" />
        <rect width="800" height="220" fill={`url(#${orb})`} />
        <ellipse cx="680" cy="180" rx="220" ry="120" fill={`url(#${mesh})`} />
        <path
          d="M40 180 C180 40 320 200 480 90 C600 20 700 120 820 60"
          fill="none"
          stroke={`url(#${glow})`}
          strokeWidth="28"
          opacity="0.35"
        />
        <path
          d="M0 200 C160 60 300 210 460 100 C580 30 700 140 820 80"
          fill="none"
          stroke="#9ff5e8"
          strokeWidth="1.2"
          strokeDasharray="1.5 7"
          opacity="0.55"
        />
        <path
          d="M20 160 C180 30 340 190 500 80 C620 10 720 110 820 50"
          fill="none"
          stroke="#ccfbf1"
          strokeWidth="1"
          strokeDasharray="1 9"
          opacity="0.4"
        />
        <circle cx="120" cy="70" r="48" fill="#5eead4" opacity="0.22" />
        <circle cx="700" cy="160" r="28" fill="#99f6e4" opacity="0.18" />
        <GrainOverlay id={grain} opacity={0.35} />
      </svg>
      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center px-4 text-center">
        <p className="font-display text-[1.85rem] font-semibold leading-none tracking-tight text-white sm:text-[2.1rem]">
          Moxt
        </p>
        <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/90 sm:text-[0.7rem]">
          Votre réseau business
        </p>
      </div>
    </div>
  )
}

export function BusinessEditorialCover(props) {
  return <BusinessEditorialDarkCover {...props} />
}

/** business-c-glass — Glass fintech */
export function BusinessGlassFintechCover({ className = '' }) {
  const id = useCoverSvgIds('bizC')
  const grain = id('grain')

  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      aria-hidden="true"
      data-cover-style="business-c-glass"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, #b7e4d4 0%, #9dceb8 42%, #0e3b3c 42.2%, #0a2f30 100%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>{grainFilterDef(grain, 0.12)}</defs>
        <circle cx="80" cy="200" r="90" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
        <circle cx="80" cy="200" r="60" fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" />
        <circle cx="80" cy="200" r="30" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
        <rect x="40" y="150" width="70" height="44" rx="8" fill="#ffffff" opacity="0.22" />
        <rect x="70" y="40" width="55" height="36" rx="7" fill="#ffffff" opacity="0.16" />
        <rect x="200" y="170" width="28" height="28" rx="6" fill="#ffffff" opacity="0.2" />
        <rect x="620" y="50" width="60" height="38" rx="7" fill="#0a2020" opacity="0.35" />
        <rect x="660" y="100" width="70" height="42" rx="7" fill="#0a2020" opacity="0.4" />
        <rect x="700" y="155" width="55" height="34" rx="7" fill="#0a2020" opacity="0.35" />
        <GrainOverlay id={grain} opacity={0.25} />
      </svg>
      <div className="absolute inset-0 z-[2] flex items-center justify-center px-6">
        <div
          className="w-full max-w-[18rem] rounded-[1.35rem] border border-white/35 px-6 py-5 text-center shadow-lg sm:max-w-[20rem] sm:px-8 sm:py-6"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          <p className="font-display text-[1.75rem] font-bold leading-none tracking-tight text-white sm:text-[2rem]">
            Moxt
          </p>
          <p className="mt-2.5 text-[0.68rem] font-medium tracking-wide text-white/90 sm:text-xs">
            Marketplace · Transfert · Fil
          </p>
        </div>
      </div>
    </div>
  )
}

/** business-d-topo — Topo emerald */
export function BusinessTopoEmeraldCover({ className = '' }) {
  const id = useCoverSvgIds('bizD')
  const grain = id('grain')
  const glow = id('glow')
  const topoPaths = [
    'M-20 40 C80 20 160 60 260 35 C360 10 450 55 560 30 C660 8 740 45 820 25',
    'M-20 70 C90 50 170 95 270 65 C370 40 460 90 570 60 C670 35 750 80 820 55',
    'M-20 100 C100 85 180 125 280 95 C380 70 470 120 580 90 C680 65 760 110 820 85',
    'M-20 130 C110 115 190 155 290 125 C390 100 480 150 590 120 C690 95 770 140 820 115',
    'M-20 160 C120 145 200 185 300 155 C400 130 490 180 600 150 C700 125 780 170 820 145',
    'M-20 190 C130 175 210 210 310 185 C410 160 500 205 610 180 C710 155 790 200 820 175',
  ]

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#062c1e] ${className}`}
      aria-hidden="true"
      data-cover-style="business-d-topo"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <radialGradient id={glow} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#0d4a32" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#031a12" stopOpacity="1" />
          </radialGradient>
          {grainFilterDef(grain, 0.16)}
        </defs>
        <rect width="800" height="220" fill={`url(#${glow})`} />
        {topoPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#d1e974"
            strokeWidth="1"
            opacity={0.22 + (i % 3) * 0.06}
          />
        ))}
        <g stroke="#d1e974" strokeWidth="0.8" opacity="0.35" fill="#d1e974">
          <line x1="30" y1="40" x2="70" y2="70" />
          <line x1="70" y1="70" x2="50" y2="110" />
          <line x1="70" y1="70" x2="110" y2="55" />
          <line x1="110" y1="55" x2="130" y2="95" />
          <line x1="50" y1="110" x2="90" y2="130" />
          <circle cx="30" cy="40" r="2.2" />
          <circle cx="70" cy="70" r="2.5" />
          <circle cx="50" cy="110" r="2" />
          <circle cx="110" cy="55" r="2.2" />
          <circle cx="130" cy="95" r="2" />
          <circle cx="90" cy="130" r="2.2" />
        </g>
        <GrainOverlay id={grain} opacity={0.3} />
      </svg>
      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center px-4 text-center">
        <p
          className="text-[2rem] font-semibold leading-none tracking-tight sm:text-[2.35rem]"
          style={{ color: '#f3ecd4', fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Moxt
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-px w-10 bg-[#f3ecd4]/70" />
          <span className="text-[0.55rem] text-[#f3ecd4]/90">◇</span>
          <span className="h-px w-10 bg-[#f3ecd4]/70" />
        </div>
        <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#f3ecd4]/85">
          Présent sur Moxt
        </p>
      </div>
    </div>
  )
}
