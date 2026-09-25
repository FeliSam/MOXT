import { useId } from 'react'

/**
 * Default business cover — style B "Editorial dark".
 * CSS + inline SVG (retina-friendly, no CDN PNG). Used only when a business
 * has no custom banner; QR stays in PublicProfileHero shareSlot.
 */
export function BusinessEditorialDarkCover({
  className = '',
  labelMoxt = 'Moxt',
  labelBusiness = 'Business',
}) {
  const uid = useId().replace(/:/g, '')
  const teal = `moxtEdTeal-${uid}`
  const tealDeep = `moxtEdTealDeep-${uid}`
  const gold = `moxtEdGold-${uid}`
  const goldSoft = `moxtEdGoldSoft-${uid}`
  const vignette = `moxtEdVignette-${uid}`
  const grain = `moxtEdGrain-${uid}`
  const shadow = `moxtEdSoftShadow-${uid}`

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#0b0d0e] ${className}`}
      aria-hidden="true"
      data-cover-style="editorial-dark"
      data-cover-style-id="business-b-editorial"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <defs>
          <linearGradient id={teal} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#003d3d" />
            <stop offset="45%" stopColor="#0a6b66" />
            <stop offset="100%" stopColor="#12a89a" />
          </linearGradient>
          <linearGradient id={tealDeep} x1="10%" y1="100%" x2="90%" y2="0%">
            <stop offset="0%" stopColor="#012828" />
            <stop offset="55%" stopColor="#065550" />
            <stop offset="100%" stopColor="#0d8a7c" />
          </linearGradient>
          <linearGradient id={gold} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6b4e1a" />
            <stop offset="35%" stopColor="#c5a059" />
            <stop offset="65%" stopColor="#e8d5a3" />
            <stop offset="100%" stopColor="#9a7429" />
          </linearGradient>
          <linearGradient id={goldSoft} x1="20%" y1="80%" x2="100%" y2="10%">
            <stop offset="0%" stopColor="#8a6a28" />
            <stop offset="50%" stopColor="#d4b56a" />
            <stop offset="100%" stopColor="#b8923c" />
          </linearGradient>
          <radialGradient id={vignette} cx="35%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#14181a" stopOpacity="0" />
            <stop offset="70%" stopColor="#0b0d0e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#050606" stopOpacity="0.85" />
          </radialGradient>
          <filter id={grain} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0.55
                      0 0 0 0 0.48
                      0 0 0 0 0.35
                      0 0 0 0.22 0"
            />
          </filter>
          <filter id={shadow} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>

        <rect width="800" height="220" fill="#0b0d0e" />
        <rect width="800" height="220" fill={`url(#${vignette})`} />

        <g filter={`url(#${shadow})`}>
          <path
            d="M310 240 C420 190 480 210 560 150 C620 105 680 70 820 40 L820 250 L310 250 Z"
            fill={`url(#${tealDeep})`}
            opacity="0.95"
          />
          <path
            d="M340 250 C450 175 520 195 600 125 C670 70 730 45 820 15 L820 250 Z"
            fill={`url(#${gold})`}
            opacity="0.92"
          />
          <path
            d="M390 250 C490 165 560 180 640 110 C710 55 760 30 820 -5 L820 250 Z"
            fill={`url(#${teal})`}
            opacity="0.9"
          />
          <path
            d="M450 250 C540 155 610 165 690 95 C750 50 785 20 820 -20 L820 250 Z"
            fill={`url(#${goldSoft})`}
            opacity="0.88"
          />
          <path
            d="M520 250 C600 150 665 155 735 85 C780 45 802 15 820 -30 L820 250 Z"
            fill={`url(#${tealDeep})`}
            opacity="0.85"
          />
          <path
            d="M580 255 C650 160 700 150 760 90 C795 55 810 25 820 -15 L820 255 Z"
            fill={`url(#${gold})`}
            opacity="0.75"
          />
        </g>

        <path
          d="M360 200 C470 150 540 170 620 110"
          fill="none"
          stroke="#e8d5a3"
          strokeWidth="1.2"
          opacity="0.25"
        />
        <path
          d="M420 215 C520 155 590 165 680 100"
          fill="none"
          stroke="#7fd4c8"
          strokeWidth="1"
          opacity="0.2"
        />

        <rect
          width="800"
          height="220"
          filter={`url(#${grain})`}
          opacity="0.55"
          style={{ mixBlendMode: 'overlay' }}
        />
      </svg>

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[48%] bg-gradient-to-r from-[#0b0d0e] via-[#0b0d0e]/80 to-transparent"
        aria-hidden="true"
      />

      <div className="absolute inset-y-0 left-0 z-[2] flex w-[52%] max-w-[22rem] items-center pl-5 sm:pl-7 lg:pl-8">
        <div className="min-w-0">
          <p className="font-display text-[1.85rem] font-extrabold leading-none tracking-tight text-white sm:text-[2.15rem]">
            {labelMoxt}
          </p>
          <div
            className="mt-2.5 h-px w-[4.75rem] rounded-full sm:mt-3 sm:w-[5.5rem]"
            style={{
              background:
                'linear-gradient(90deg, #6b4e1a 0%, #c5a059 45%, #e8d5a3 70%, #9a7429 100%)',
            }}
          />
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.38em] text-white/90 sm:mt-2.5 sm:text-xs sm:tracking-[0.42em]">
            {labelBusiness}
          </p>
        </div>
      </div>
    </div>
  )
}
