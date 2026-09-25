import { COVER_BANNER_LABELS_FR } from './coverBannerLabels'
import { grainFilterDef, GrainOverlay, useCoverSvgIds } from './coverSvgShared'

/** woman-a-silk */
export function WomanSilkPlumCover({ className = '', labels = COVER_BANNER_LABELS_FR }) {
  const id = useCoverSvgIds('wA')
  const silk = id('silk')
  const silk2 = id('silk2')
  const grain = id('grain')
  const bg = id('bg')

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#3d1d2b] ${className}`}
      aria-hidden="true"
      data-cover-style="woman-a-silk"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <linearGradient id={bg} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#2a121c" />
            <stop offset="45%" stopColor="#6b3a4a" />
            <stop offset="100%" stopColor="#c49a8e" />
          </linearGradient>
          <linearGradient id={silk} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8a4a5c" />
            <stop offset="40%" stopColor="#e8c4b8" />
            <stop offset="70%" stopColor="#d4a090" />
            <stop offset="100%" stopColor="#9a6070" />
          </linearGradient>
          <linearGradient id={silk2} x1="20%" y1="100%" x2="90%" y2="0%">
            <stop offset="0%" stopColor="#5a2838" />
            <stop offset="50%" stopColor="#d8b0a4" />
            <stop offset="100%" stopColor="#b88880" />
          </linearGradient>
          {grainFilterDef(grain, 0.2)}
        </defs>
        <rect width="800" height="220" fill={`url(#${bg})`} />
        <path
          d="M320 240 C420 160 500 190 600 110 C680 50 740 30 820 0 L820 240 Z"
          fill={`url(#${silk2})`}
          opacity="0.95"
        />
        <path
          d="M380 240 C480 150 560 175 660 95 C740 40 780 20 820 -10 L820 240 Z"
          fill={`url(#${silk})`}
          opacity="0.9"
        />
        <path
          d="M450 240 C540 145 620 160 710 85 C770 40 800 15 820 -20 L820 240 Z"
          fill={`url(#${silk2})`}
          opacity="0.75"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${360 + i * 30} 210 C${460 + i * 25} ${140 - i * 8} ${560 + i * 20} ${160 - i * 6} ${680 + i * 15} ${90 - i * 10}`}
            fill="none"
            stroke="#f5e6df"
            strokeWidth="0.8"
            opacity={0.2 + i * 0.04}
          />
        ))}
        <GrainOverlay id={grain} opacity={0.4} />
      </svg>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[45%] bg-gradient-to-r from-[#2a121c] via-[#2a121c]/75 to-transparent" />
      <div className="absolute inset-y-0 left-0 z-[2] flex w-[52%] max-w-[22rem] items-center pl-5 sm:pl-7">
        <div>
          <p
            className="text-[1.85rem] font-semibold leading-none tracking-tight text-white sm:text-[2.15rem]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Moxt
          </p>
          <div
            className="mt-2.5 h-px w-[4.5rem] rounded-full"
            style={{ background: 'linear-gradient(90deg,#c58d86,#e8c4b8,#c58d86)' }}
          />
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.38em] text-white/90">
            {labels.profile}
          </p>
        </div>
      </div>
    </div>
  )
}

/** woman-b-glass */
export function WomanGlassLavenderCover({ className = '', labels = COVER_BANNER_LABELS_FR }) {
  const id = useCoverSvgIds('wB')
  const bg = id('bg')
  const grain = id('grain')

  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      aria-hidden="true"
      data-cover-style="woman-b-glass"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <linearGradient id={bg} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4c1d6e" />
            <stop offset="45%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
          {grainFilterDef(grain, 0.14)}
        </defs>
        <rect width="800" height="220" fill={`url(#${bg})`} />
        <path
          d="M-40 180 C120 40 280 200 440 80 C560 0 680 120 840 40"
          fill="none"
          stroke="#ede9fe"
          strokeWidth="40"
          opacity="0.12"
        />
        <path
          d="M-20 200 C140 60 300 210 460 100 C580 20 700 140 840 60"
          fill="none"
          stroke="#f5f3ff"
          strokeWidth="18"
          opacity="0.1"
        />
        {[
          [60, 180, 22],
          [95, 195, 14],
          [40, 200, 10],
          [720, 175, 20],
          [750, 195, 12],
          [690, 200, 9],
        ].map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="#f5f3ff" opacity="0.35" />
            <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.25} fill="#fff" opacity="0.55" />
          </g>
        ))}
        <GrainOverlay id={grain} opacity={0.28} />
      </svg>
      <div className="absolute inset-0 z-[2] flex items-center justify-center px-6">
        <div
          className="w-full max-w-[17rem] rounded-[1.35rem] border border-white/40 px-6 py-5 text-center shadow-lg sm:max-w-[19rem]"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.32), rgba(255,255,255,0.1))',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          <p
            className="text-[1.75rem] font-semibold leading-none text-white sm:text-[2rem]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Moxt
          </p>
          <div className="mx-auto mt-2.5 h-px w-16 bg-white/70" />
          <p className="mt-2 text-sm font-medium text-white/95">{labels.yourProfile}</p>
        </div>
      </div>
    </div>
  )
}

/** woman-c-blush */
export function WomanBlushFloralCover({ className = '' }) {
  const id = useCoverSvgIds('wC')
  const bg = id('bg')
  const grain = id('grain')

  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      aria-hidden="true"
      data-cover-style="woman-c-blush"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <linearGradient id={bg} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6a08e" />
            <stop offset="50%" stopColor="#f8b4a2" />
            <stop offset="100%" stopColor="#ffd0bc" />
          </linearGradient>
          {grainFilterDef(grain, 0.12)}
        </defs>
        <rect width="800" height="220" fill={`url(#${bg})`} />
        <g fill="none" stroke="#fffaf7" strokeWidth="1.4" opacity="0.55">
          <path d="M40 200 C70 120 90 90 130 40" />
          <path d="M70 210 C95 140 130 100 180 50" />
          <path d="M55 160 C90 150 110 130 125 100" />
          <path d="M100 180 C130 160 150 130 165 95" />
          <path d="M620 40 C660 70 700 90 760 120" />
          <path d="M640 30 C690 80 730 110 790 150" />
          <path d="M700 50 C730 90 760 130 790 170" />
          <ellipse cx="720" cy="160" rx="38" ry="22" transform="rotate(-25 720 160)" />
          <ellipse cx="755" cy="140" rx="32" ry="18" transform="rotate(15 755 140)" />
          <ellipse cx="690" cy="175" rx="28" ry="16" transform="rotate(-40 690 175)" />
        </g>
        <GrainOverlay id={grain} opacity={0.25} />
      </svg>
      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center px-4 text-center">
        <p
          className="text-[2rem] font-semibold leading-none tracking-tight text-[#fff8f4] sm:text-[2.35rem]"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Moxt
        </p>
        <div className="mt-3 flex items-center gap-2 text-[#fff8f4]/90">
          <span className="h-px w-10 bg-current" />
          <span className="text-[0.65rem]">✦</span>
          <span className="h-px w-10 bg-current" />
        </div>
        <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#fff8f4]/90">
          Présente sur Moxt
        </p>
      </div>
    </div>
  )
}

/** man-a-steel */
export function ManSteelTealCover({ className = '', labels = COVER_BANNER_LABELS_FR }) {
  const id = useCoverSvgIds('mA')
  const steel = id('steel')
  const teal = id('teal')
  const grain = id('grain')
  const shadow = id('shadow')

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#0b0e14] ${className}`}
      aria-hidden="true"
      data-cover-style="man-a-steel"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <linearGradient id={steel} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="35%" stopColor="#d1d5db" />
            <stop offset="65%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          <linearGradient id={teal} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f2f2f" />
            <stop offset="50%" stopColor="#1f5c5c" />
            <stop offset="100%" stopColor="#0d3d3d" />
          </linearGradient>
          <filter id={shadow} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.5" />
          </filter>
          {grainFilterDef(grain, 0.2)}
        </defs>
        <rect width="800" height="220" fill="#0b0e14" />
        <g filter={`url(#${shadow})`}>
          <path
            d="M300 240 C420 170 510 190 600 120 C680 65 740 40 820 10 L820 240 Z"
            fill={`url(#${teal})`}
            opacity="0.95"
          />
          <path
            d="M360 240 C470 155 550 175 650 105 C730 50 780 25 820 -5 L820 240 Z"
            fill={`url(#${steel})`}
            opacity="0.92"
          />
          <path
            d="M430 250 C530 160 610 170 700 100 C760 55 800 25 820 -10 L820 250 Z"
            fill="#141820"
            opacity="0.85"
          />
        </g>
        <GrainOverlay id={grain} opacity={0.4} />
      </svg>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[48%] bg-gradient-to-r from-[#0b0e14] via-[#0b0e14]/80 to-transparent" />
      <div className="absolute inset-y-0 left-0 z-[2] flex w-[52%] max-w-[22rem] items-center pl-5 sm:pl-7">
        <div>
          <p className="font-display text-[1.85rem] font-extrabold leading-none tracking-tight text-white sm:text-[2.15rem]">
            Moxt
          </p>
          <div className="mt-2.5 h-px w-[4.75rem] rounded-full bg-white/85" />
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.38em] text-white/75">
            {labels.profile}
          </p>
        </div>
      </div>
    </div>
  )
}

/** man-b-topo */
export function ManTopoEmeraldCover({ className = '', labels = COVER_BANNER_LABELS_FR }) {
  const id = useCoverSvgIds('mB')
  const glow = id('glow')
  const grain = id('grain')
  const topoPaths = [
    'M-20 50 C90 25 180 70 280 40 C390 5 490 60 600 35 C700 12 760 50 820 30',
    'M-20 85 C100 60 190 105 290 75 C400 40 500 100 610 70 C710 45 770 85 820 65',
    'M-20 120 C110 100 200 140 300 110 C410 80 510 135 620 105 C720 80 780 120 820 100',
    'M-20 155 C120 135 210 175 310 145 C420 115 520 170 630 140 C730 115 790 155 820 135',
    'M-20 190 C130 170 220 205 320 180 C430 150 530 200 640 175 C740 150 800 190 820 170',
  ]

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#042217] ${className}`}
      aria-hidden="true"
      data-cover-style="man-b-topo"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <radialGradient id={glow} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#0a3d2c" />
            <stop offset="100%" stopColor="#02150f" />
          </radialGradient>
          {grainFilterDef(grain, 0.15)}
        </defs>
        <rect width="800" height="220" fill={`url(#${glow})`} />
        {topoPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#d1e974"
            strokeWidth="1.1"
            opacity={0.28 + (i % 2) * 0.08}
          />
        ))}
        <g stroke="#d1e974" strokeWidth="0.85" fill="#d1e974" opacity="0.4">
          <line x1="620" y1="50" x2="680" y2="80" />
          <line x1="680" y1="80" x2="650" y2="130" />
          <line x1="680" y1="80" x2="740" y2="60" />
          <line x1="740" y1="60" x2="760" y2="110" />
          <line x1="650" y1="130" x2="710" y2="150" />
          <circle cx="620" cy="50" r="2.3" />
          <circle cx="680" cy="80" r="2.6" />
          <circle cx="650" cy="130" r="2.1" />
          <circle cx="740" cy="60" r="2.3" />
          <circle cx="760" cy="110" r="2" />
          <circle cx="710" cy="150" r="2.2" />
        </g>
        <GrainOverlay id={grain} opacity={0.28} />
      </svg>
      <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center px-4 text-center">
        <p
          className="text-[2rem] font-semibold leading-none tracking-tight sm:text-[2.35rem]"
          style={{ color: '#f5f0dc', fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Moxt
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-px w-10 bg-[#f5f0dc]/70" />
          <span className="text-[0.55rem] text-[#f5f0dc]/90">◇</span>
          <span className="h-px w-10 bg-[#f5f0dc]/70" />
        </div>
        <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#f5f0dc]/85">
          {labels.onMoxt}
        </p>
      </div>
    </div>
  )
}

/** man-c-mesh */
export function ManMeshMidnightCover({ className = '', labels = COVER_BANNER_LABELS_FR }) {
  const id = useCoverSvgIds('mC')
  const bg = id('bg')
  const streak = id('streak')
  const grain = id('grain')

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#000510] ${className}`}
      aria-hidden="true"
      data-cover-style="man-c-mesh"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <radialGradient id={bg} cx="70%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#0a1a3a" />
            <stop offset="100%" stopColor="#000510" />
          </radialGradient>
          <linearGradient id={streak} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0077ff" stopOpacity="0" />
            <stop offset="40%" stopColor="#3db4ff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#9ad8ff" stopOpacity="0.2" />
          </linearGradient>
          {grainFilterDef(grain, 0.16)}
        </defs>
        <rect width="800" height="220" fill={`url(#${bg})`} />
        <circle cx="160" cy="50" r="55" fill="#1e4a8c" opacity="0.35" />
        <circle cx="520" cy="30" r="35" fill="#2563a8" opacity="0.25" />
        <circle cx="300" cy="180" r="40" fill="#123060" opacity="0.3" />
        <path
          d="M280 230 C420 150 520 170 640 90 C720 40 780 20 840 -10"
          fill="none"
          stroke={`url(#${streak})`}
          strokeWidth="10"
          opacity="0.9"
        />
        <path
          d="M300 240 C440 155 540 175 660 95 C740 45 800 25 850 -5"
          fill="none"
          stroke="#5ec8ff"
          strokeWidth="3"
          opacity="0.7"
        />
        <path
          d="M260 220 C400 140 510 165 630 85 C710 35 770 15 830 -15"
          fill="none"
          stroke="#9ad8ff"
          strokeWidth="1.2"
          strokeDasharray="1.5 6"
          opacity="0.55"
        />
        <path
          d="M320 250 C450 165 560 180 680 105 C760 55 810 35 860 5"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="1"
          strokeDasharray="1 8"
          opacity="0.4"
        />
        <GrainOverlay id={grain} opacity={0.3} />
      </svg>
      <div className="absolute inset-y-0 left-0 z-[2] flex w-[55%] max-w-[22rem] items-center pl-5 sm:pl-7">
        <div>
          <p className="font-display text-[1.85rem] font-extrabold leading-none tracking-tight text-white sm:text-[2.15rem]">
            Moxt
          </p>
          <p className="mt-2 text-sm font-medium text-white/90">{labels.yourNetwork}</p>
          <div
            className="mt-2 h-0.5 w-16 rounded-full"
            style={{ background: 'linear-gradient(90deg,#0077ff,#3db4ff)' }}
          />
        </div>
      </div>
    </div>
  )
}

/** woman-d-prune : vagues prune → rose (défaut profil perso Femme). */
export function WomanPruneRoseCover({ className = '', labels = COVER_BANNER_LABELS_FR }) {
  const id = useCoverSvgIds('wD')
  const bg = id('bg')
  const waveA = id('waveA')
  const waveB = id('waveB')
  const grain = id('grain')

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#2b0f24] ${className}`}
      aria-hidden="true"
      data-cover-style="woman-d-prune"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <linearGradient id={bg} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#2b0f24" />
            <stop offset="50%" stopColor="#6b2d5c" />
            <stop offset="100%" stopColor="#d98bb5" />
          </linearGradient>
          <linearGradient id={waveA} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8a3f75" />
            <stop offset="45%" stopColor="#f3c1d8" />
            <stop offset="75%" stopColor="#e79bbf" />
            <stop offset="100%" stopColor="#a8568f" />
          </linearGradient>
          <linearGradient id={waveB} x1="20%" y1="100%" x2="90%" y2="0%">
            <stop offset="0%" stopColor="#58244b" />
            <stop offset="55%" stopColor="#dba6c8" />
            <stop offset="100%" stopColor="#c77db3" />
          </linearGradient>
          {grainFilterDef(grain, 0.18)}
        </defs>
        <rect width="800" height="220" fill={`url(#${bg})`} />
        <path
          d="M300 240 C400 165 490 195 590 115 C670 55 735 35 820 5 L820 240 Z"
          fill={`url(#${waveB})`}
          opacity="0.95"
        />
        <path
          d="M370 240 C470 150 555 180 655 100 C735 42 780 22 820 -8 L820 240 Z"
          fill={`url(#${waveA})`}
          opacity="0.88"
        />
        <path
          d="M455 240 C545 150 625 165 715 90 C772 44 800 18 820 -18 L820 240 Z"
          fill={`url(#${waveB})`}
          opacity="0.7"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${350 + i * 30} 215 C${455 + i * 25} ${145 - i * 8} ${555 + i * 20} ${165 - i * 6} ${675 + i * 15} ${92 - i * 10}`}
            fill="none"
            stroke="#fde7f1"
            strokeWidth="0.8"
            opacity={0.18 + i * 0.04}
          />
        ))}
        <GrainOverlay id={grain} opacity={0.35} />
      </svg>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[45%] bg-gradient-to-r from-[#2b0f24] via-[#2b0f24]/75 to-transparent" />
      <div className="absolute inset-y-0 left-0 z-[2] flex w-[52%] max-w-[22rem] items-center pl-5 sm:pl-7">
        <div>
          <p
            className="text-[1.85rem] font-semibold leading-none tracking-tight text-white sm:text-[2.15rem]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Moxt
          </p>
          <div
            className="mt-2.5 h-px w-[4.5rem] rounded-full"
            style={{ background: 'linear-gradient(90deg,#c77db3,#f3c1d8,#c77db3)' }}
          />
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.38em] text-white/90">
            {labels.profile}
          </p>
        </div>
      </div>
    </div>
  )
}

/** man-d-prune : vagues prune nuit + filets rose (défaut profil perso Homme). */
export function ManPruneNightCover({ className = '', labels = COVER_BANNER_LABELS_FR }) {
  const id = useCoverSvgIds('mD')
  const bg = id('bg')
  const wave = id('wave')
  const glow = id('glow')
  const grain = id('grain')

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#140712] ${className}`}
      aria-hidden="true"
      data-cover-style="man-d-prune"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <linearGradient id={bg} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#140712" />
            <stop offset="55%" stopColor="#3a1433" />
            <stop offset="100%" stopColor="#6b2d5c" />
          </linearGradient>
          <linearGradient id={wave} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2a0f25" />
            <stop offset="50%" stopColor="#6b2d5c" />
            <stop offset="100%" stopColor="#a8568f" />
          </linearGradient>
          <linearGradient id={glow} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e79bbf" stopOpacity="0" />
            <stop offset="45%" stopColor="#e79bbf" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f3c1d8" stopOpacity="0.25" />
          </linearGradient>
          {grainFilterDef(grain, 0.18)}
        </defs>
        <rect width="800" height="220" fill={`url(#${bg})`} />
        <path
          d="M300 240 C420 170 510 190 600 120 C680 65 740 40 820 10 L820 240 Z"
          fill={`url(#${wave})`}
          opacity="0.9"
        />
        <path
          d="M400 250 C505 165 590 175 690 102 C755 56 795 28 820 -8 L820 250 Z"
          fill="#1d0a1a"
          opacity="0.8"
        />
        <path
          d="M280 230 C420 150 520 170 640 90 C720 40 780 20 840 -10"
          fill="none"
          stroke={`url(#${glow})`}
          strokeWidth="6"
          opacity="0.85"
        />
        <path
          d="M300 242 C440 158 540 178 660 98 C740 48 800 28 850 -2"
          fill="none"
          stroke="#f3c1d8"
          strokeWidth="1.2"
          strokeDasharray="1.5 6"
          opacity="0.55"
        />
        <GrainOverlay id={grain} opacity={0.35} />
      </svg>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[48%] bg-gradient-to-r from-[#140712] via-[#140712]/80 to-transparent" />
      <div className="absolute inset-y-0 left-0 z-[2] flex w-[52%] max-w-[22rem] items-center pl-5 sm:pl-7">
        <div>
          <p className="font-display text-[1.85rem] font-extrabold leading-none tracking-tight text-white sm:text-[2.15rem]">
            Moxt
          </p>
          <div
            className="mt-2.5 h-px w-[4.75rem] rounded-full"
            style={{ background: 'linear-gradient(90deg,#c77db3,#f3c1d8)' }}
          />
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.38em] text-white/80">
            {labels.profile}
          </p>
        </div>
      </div>
    </div>
  )
}
