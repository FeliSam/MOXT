import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiGlobe,
  FiLink,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShare2,
  FiShield,
  FiStar,
  FiUser,
} from 'react-icons/fi'
import { Button } from '../ui/Button'

/* ─── QR code URL (external API) ────────────────────────────────────────── */
function makeQrUrl(value, size = 140) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=4&data=${encodeURIComponent(value || 'https://moxt.local')}`
}

/* ─── Single info row ────────────────────────────────────────────────────── */
function InfoItem({ icon: Icon, label, value, accent = false, customIcon = null }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-[26px] shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700">
        {customIcon ?? <Icon className="text-xs" />}
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className={`mt-0.5 text-[13px] font-black leading-tight ${accent ? 'text-teal-700' : 'text-slate-800'}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

/* ─── Card header (shared) ──────────────────────────────────────────────── */
function CardHeader({ badgeLabel, badgeIcon: BadgeIcon }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-5"
      style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 50%, #1e293b 100%)',
      }}
    >
      <div>
        <p className="text-[22px] font-black tracking-[0.15em] text-white">MOXT</p>
        <p className="mt-0.5 text-[10px] font-medium text-white/60">Plateforme Benin · Russie</p>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
        <BadgeIcon className="text-[11px] text-teal-300" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white">
          {badgeLabel}
        </span>
      </div>
    </div>
  )
}

/* ─── Card footer (shared) ──────────────────────────────────────────────── */
function CardFooter({ FooterIcon, url, id }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700">
        <FooterIcon className="text-[10px]" />
        <span className="truncate max-w-[260px]">{url}</span>
      </div>
      <span className="shrink-0 text-[10px] text-slate-400">ID: {id}</span>
    </div>
  )
}

/* ─── QR panel (shared right column) ────────────────────────────────────── */
function QrPanel({ value, caption }) {
  return (
    <div className="flex w-[148px] shrink-0 flex-col items-center gap-2.5">
      <div className="overflow-hidden rounded-[14px] border-2 border-teal-200 p-2 shadow-sm">
        <img
          src={makeQrUrl(value)}
          alt="QR Code"
          width="120"
          height="120"
          className="block"
        />
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <FiUser className="text-[10px] text-slate-400" />
        <p className="text-[10px] leading-tight text-slate-400">{caption}</p>
      </div>
    </div>
  )
}

/* ─── Download as SVG ───────────────────────────────────────────────────── */
function escapeXml(v) {
  return String(v || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildDownloadSvg({ badgeLabel, city, email, id, initials, name, phone, qrValue, sector, schedule, feePercent, rating, status, subtitle, type, url }) {
  const sans = 'Inter, Segoe UI, Arial, sans-serif'
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=4&data=${encodeURIComponent(qrValue || 'https://moxt.local')}`

  const infoRows = type === 'user'
    ? [
        ['Ville', city || 'Russie'],
        ['Telephone', phone || ''],
        ['Email', email || ''],
        ['Statut', status || 'Membre MOXT'],
      ]
    : [
        ['Secteur', sector || ''],
        ['Ville', city || ''],
        ['Tel.', phone || ''],
        ['Horaires', schedule || ''],
        ['Frais', feePercent != null ? `${feePercent}%` : ''],
        ['Note', rating > 0 ? `${rating} / 5` : ''],
      ]

  const infoSvg = infoRows
    .filter(([, v]) => v)
    .slice(0, 6)
    .map(([label, value], i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = col === 0 ? 44 : 310
      const y = 250 + row * 56
      return [
        `<circle cx="${x + 12}" cy="${y - 6}" r="10" fill="#f0fdfa" stroke="#99f6e4" stroke-width="1"/>`,
        `<text x="${x + 30}" y="${y - 9}" font-family="${sans}" font-size="9" font-weight="700" fill="#94a3b8" letter-spacing="1">${escapeXml(label.toUpperCase())}</text>`,
        `<text x="${x + 30}" y="${y + 6}" font-family="${sans}" font-size="13" font-weight="800" fill="#0f172a">${escapeXml(value)}</text>`,
      ].join('')
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="460" viewBox="0 0 760 460">
  <defs>
    <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="50%" stop-color="#0e7490"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <clipPath id="avatar"><circle cx="112" cy="175" r="34"/></clipPath>
  </defs>

  <!-- Card background -->
  <rect x="2" y="2" width="756" height="456" rx="26" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- Header -->
  <path d="M2 28 Q2 2 28 2 H732 Q758 2 758 28 V108 H2 Z" fill="url(#hdr)"/>
  <text x="44" y="58" font-family="${sans}" font-size="22" font-weight="900" letter-spacing="3" fill="#ffffff">MOXT</text>
  <text x="44" y="80" font-family="${sans}" font-size="10.5" font-weight="500" fill="rgba(255,255,255,0.6)">Plateforme Benin - Russie</text>
  <!-- Badge pill -->
  <rect x="550" y="38" width="190" height="32" rx="16" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
  <text x="720" y="59" text-anchor="end" font-family="${sans}" font-size="10" font-weight="800" letter-spacing="1.5" fill="#ffffff">${escapeXml(badgeLabel.toUpperCase())}</text>

  <!-- Avatar circle -->
  <circle cx="112" cy="175" r="36" fill="#ccfbf1" stroke="#5eead4" stroke-width="3"/>
  <text x="112" y="183" text-anchor="middle" font-family="${sans}" font-size="22" font-weight="900" fill="#0f766e">${escapeXml(initials)}</text>

  <!-- Name + subtitle -->
  <text x="170" y="165" font-family="${sans}" font-size="24" font-weight="900" fill="#0f172a">${escapeXml(name)}</text>
  <text x="170" y="188" font-family="${sans}" font-size="12" font-weight="500" fill="${type === 'business' ? '#0f766e' : '#64748b'}">${escapeXml(subtitle)}</text>

  <!-- Divider -->
  <line x1="44" y1="218" x2="528" y2="218" stroke="#f1f5f9" stroke-width="1.5"/>

  <!-- Info rows -->
  ${infoSvg}

  <!-- Description / tagline -->
  <rect x="44" y="372" width="490" height="34" rx="10" fill="#f0fdfa"/>
  <text x="60" y="394" font-family="${sans}" font-size="11.5" font-weight="600" fill="#475569">Membre verifie de la communaute MOXT.</text>

  <!-- QR -->
  <rect x="556" y="122" width="152" height="152" rx="16" fill="#f8fafc" stroke="#99f6e4" stroke-width="2"/>
  <image href="${qr}" x="572" y="138" width="120" height="120"/>
  <text x="632" y="294" text-anchor="middle" font-family="${sans}" font-size="10" fill="#94a3b8">Scanner pour verifier</text>

  <!-- Footer -->
  <line x1="44" y1="420" x2="716" y2="420" stroke="#f1f5f9" stroke-width="1"/>
  <text x="44" y="445" font-family="${sans}" font-size="11" font-weight="700" fill="#0f766e">${escapeXml(url)}</text>
  <text x="716" y="445" text-anchor="end" font-family="${sans}" font-size="11" font-weight="500" fill="#94a3b8">ID: ${escapeXml(id)}</text>
</svg>`
}

function downloadSvg(filename, svg) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

/* ─── User badge card ────────────────────────────────────────────────────── */
function UserBadgeCard({ avatarUrl, city, email, filename, name, phone, siteUrl, userId, verified }) {
  const initials = (name || '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
  const profileUrl = `${siteUrl || 'https://moxt.local'}/profile/${userId || 'user'}`
  const displayId = `MOXT-${(userId || 'USER').toUpperCase().replace(/^demo-/, '')}`

  const svg = buildDownloadSvg({
    type: 'user',
    badgeLabel: 'Membre Verifie',
    name,
    initials,
    subtitle: 'Profil utilisateur actif sur MOXT',
    city,
    phone,
    email,
    status: verified ? 'Verifie' : 'Membre MOXT',
    qrValue: profileUrl,
    url: `moxt.app/membre/${userId || 'user'}`,
    id: displayId,
  })

  async function share() {
    const data = { title: `${name} sur MOXT`, url: profileUrl }
    if (navigator.share) await navigator.share(data)
    else await navigator.clipboard?.writeText(profileUrl)
  }

  return (
    <div>
      {/* Visual card */}
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl">
        <CardHeader badgeLabel="Membre Verifie" badgeIcon={FiCheckCircle} />

        <div className="grid grid-cols-[1fr_auto] gap-5 p-6">
          {/* Left */}
          <div className="min-w-0">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="size-[60px] rounded-full object-cover shadow-lg ring-4 ring-teal-100"
                />
              ) : (
                <div
                  className="grid size-[60px] shrink-0 place-items-center rounded-full text-xl font-black text-white shadow-lg ring-4 ring-teal-100"
                  style={{ background: 'linear-gradient(135deg, #0f766e, #1e293b)' }}
                >
                  {initials}
                </div>
              )}
              <div>
                <p className="text-xl font-black text-slate-900">{name}</p>
                <p className="text-[11px] text-slate-400">Profil utilisateur actif sur MOXT</p>
              </div>
            </div>

            <div className="my-4 h-px bg-slate-100" />

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoItem icon={FiMapPin} label="Ville" value={city} />
              <InfoItem icon={FiPhone} label="Telephone" value={phone} />
              <InfoItem icon={FiMail} label="Email" value={email} />
              <InfoItem
                icon={FiShield}
                label="Statut"
                value={verified ? 'Verifie ✓' : 'En attente'}
                accent={verified}
              />
              <InfoItem icon={FiUser} label="Type" value="Membre MOXT" />
            </div>

            {/* Description */}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3">
              <FiShield className="shrink-0 text-sm text-teal-600" />
              <p className="text-[11px] text-slate-500">Membre verifie de la communaute MOXT.</p>
            </div>
          </div>

          {/* Right — QR */}
          <QrPanel value={profileUrl} caption="Scanner pour verifier le profil" />
        </div>

        <CardFooter
          FooterIcon={FiGlobe}
          url={`moxt.app/membre/${userId || 'user'}`}
          id={displayId}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" icon={FiDownload} onClick={() => downloadSvg(filename || 'moxt-membre.svg', svg)}>
          Telecharger
        </Button>
        <Button icon={FiShare2} onClick={share}>
          Partager
        </Button>
      </div>
    </div>
  )
}

/* ─── Business badge card ────────────────────────────────────────────────── */
function BusinessBadgeCard({ businessId, city, feePercent, filename, logoUrl, name, phone, rating, schedule, sector, siteUrl, status }) {
  const initials = (name || '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
  const businessUrl = `${siteUrl || 'https://moxt.local'}/businesses/${businessId || ''}`
  const isVerified = ['verified', 'approved', 'active'].includes(status)
  const displayId = (businessId || 'BIZ').toUpperCase()

  const svg = buildDownloadSvg({
    type: 'business',
    badgeLabel: 'Entreprise Verifiee',
    name,
    initials,
    subtitle: 'Entreprise verifiee presente sur MOXT',
    city,
    phone,
    sector,
    schedule,
    feePercent,
    rating,
    status: isVerified ? 'Verifie' : 'En attente',
    qrValue: businessUrl,
    url: `moxt.app/businesses/${businessId || ''}`,
    id: displayId,
  })

  async function share() {
    const data = { title: `${name} sur MOXT`, url: businessUrl }
    if (navigator.share) await navigator.share(data)
    else await navigator.clipboard?.writeText(businessUrl)
  }

  return (
    <div>
      {/* Visual card */}
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl">
        <CardHeader badgeLabel="Entreprise Verifiee" badgeIcon={FiShield} />

        <div className="grid grid-cols-[1fr_auto] gap-5 p-6">
          {/* Left */}
          <div className="min-w-0">
            {/* Logo + name */}
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="size-[60px] rounded-2xl object-cover shadow-lg ring-4 ring-teal-100"
                />
              ) : (
                <div
                  className="grid size-[60px] shrink-0 place-items-center rounded-2xl text-xl font-black text-white shadow-lg ring-4 ring-teal-100"
                  style={{ background: 'linear-gradient(135deg, #0f766e, #1e293b)' }}
                >
                  {initials}
                </div>
              )}
              <div>
                <p className="text-xl font-black text-slate-900">{name}</p>
                <p className="text-[11px] font-semibold text-teal-600">
                  Entreprise verifiee presente sur MOXT
                </p>
              </div>
            </div>

            {/* Tagline */}
            <div className="mt-3 flex items-center gap-2">
              <FiShield className="shrink-0 text-sm text-teal-600" />
              <p className="text-[11px] text-slate-500">
                Services verifies entre le Benin et la Russie
              </p>
            </div>

            <div className="my-4 h-px bg-slate-100" />

            {/* Row 1: sector, city, phone */}
            <div className="grid grid-cols-3 gap-3">
              <InfoItem icon={FiBriefcase} label="Secteur" value={sector} />
              <InfoItem icon={FiMapPin} label="Ville" value={city} />
              <InfoItem icon={FiPhone} label="Telephone" value={phone} />
            </div>

            {/* Row 2: schedule, status, fee, rating */}
            <div className="mt-3 grid grid-cols-4 gap-3">
              {schedule ? <InfoItem icon={FiClock} label="Horaires" value={schedule} /> : null}
              <InfoItem
                icon={FiShield}
                label="Statut"
                value={isVerified ? 'Verifie' : 'En attente'}
                accent={isVerified}
              />
              {feePercent != null ? (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-[26px] shrink-0 place-items-center rounded-full bg-teal-50 text-[9px] font-black text-teal-700">
                    %
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Frais annonces
                    </p>
                    <p className="mt-0.5 text-[13px] font-black text-slate-800">{feePercent}%</p>
                  </div>
                </div>
              ) : null}
              {rating > 0 ? (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-[26px] shrink-0 place-items-center rounded-full bg-amber-50 text-amber-500">
                    <FiStar className="text-xs" />
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Note MOXT
                    </p>
                    <p className="mt-0.5 text-[13px] font-black text-slate-800">
                      {rating} / 5{' '}
                      <span className="text-amber-400">★</span>
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right — QR */}
          <QrPanel value={businessUrl} caption="Scanner pour verifier l'entreprise" />
        </div>

        <CardFooter
          FooterIcon={FiLink}
          url={`moxt.app/businesses/${businessId || ''}`}
          id={displayId}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" icon={FiDownload} onClick={() => downloadSvg(filename || 'moxt-entreprise.svg', svg)}>
          Telecharger
        </Button>
        <Button icon={FiShare2} onClick={share}>
          Partager
        </Button>
      </div>
    </div>
  )
}

/* ─── Public export ──────────────────────────────────────────────────────── */
/**
 * Carte MOXT professionnelle partageable.
 *
 * type="user"     → carte membre (props: name, avatarUrl, city, phone, email, verified, userId, siteUrl, filename)
 * type="business" → carte entreprise (props: name, logoUrl, sector, city, phone, schedule, status, feePercent, rating, businessId, siteUrl, filename)
 */
export function ShareBadgeCard({ type = 'user', className = '', ...props }) {
  if (type === 'business') {
    return (
      <div className={className}>
        <BusinessBadgeCard {...props} />
      </div>
    )
  }
  return (
    <div className={className}>
      <UserBadgeCard {...props} />
    </div>
  )
}
