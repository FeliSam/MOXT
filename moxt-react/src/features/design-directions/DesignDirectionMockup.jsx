import { useState } from 'react'
import {
  FiArrowLeft,
  FiBell,
  FiHome,
  FiMessageSquare,
  FiMoon,
  FiPackage,
  FiRepeat,
  FiSearch,
  FiShoppingBag,
  FiSun,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { DIRECTIONS, MOCK_TRANSFERS } from './directionConfigs'

const NAV = [
  { icon: FiHome, label: 'Accueil', active: false },
  { icon: FiRepeat, label: 'Transferts', active: true },
  { icon: FiPackage, label: 'Colis', active: false },
  { icon: FiShoppingBag, label: 'Marketplace', active: false },
  { icon: FiMessageSquare, label: 'Messages', active: false },
]

const STATUS_STYLES = {
  pending: { label: 'En cours', tone: 'warning' },
  completed: { label: 'Terminé', tone: 'success' },
  validating: { label: 'Validation', tone: 'info' },
}

function StatusBadge({ status, tokens }) {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.pending
  const bg = {
    success: tokens['--dm-success-soft'],
    warning: tokens['--dm-warning-soft'],
    info: tokens['--dm-info-soft'],
  }[cfg.tone]
  const color = {
    success: tokens['--dm-success'],
    warning: tokens['--dm-warning'],
    info: tokens['--dm-info'],
  }[cfg.tone]
  return (
    <span
      style={{
        background: bg,
        color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {cfg.label}
    </span>
  )
}

export function DesignDirectionMockup({ directionId }) {
  const direction = DIRECTIONS[directionId]
  const [mode, setMode] = useState(directionId === 'b' ? 'dark' : 'light')
  const [selectedId, setSelectedId] = useState('TR-2847')
  const [showEmpty, setShowEmpty] = useState(false)
  const tokens = direction[mode]
  const selected = MOCK_TRANSFERS.find((t) => t.id === selectedId) || MOCK_TRANSFERS[0]
  const isWarm = directionId === 'c'

  const shellStyle = {
    ...tokens,
    fontFamily: direction.fontBody,
    background: tokens['--dm-bg'],
    color: tokens['--dm-text'],
    minHeight: '100dvh',
    ...(mode === 'dark' && directionId === 'b'
      ? {
          backgroundImage: `radial-gradient(ellipse at 20% 0%, ${tokens['--dm-accent-glow']} 0%, transparent 50%), radial-gradient(ellipse at 80% 10%, rgba(110,168,254,0.06) 0%, transparent 45%), ${tokens['--dm-bg']}`,
        }
      : {}),
    ...(mode === 'light' && directionId === 'c'
      ? {
          backgroundImage: `radial-gradient(circle at 90% 5%, rgba(255,107,74,0.08) 0%, transparent 35%), ${tokens['--dm-bg']}`,
        }
      : {}),
  }

  const cardStyle = {
    background: tokens['--dm-surface'],
    border: `1px solid ${tokens['--dm-border']}`,
    borderRadius: direction.radiusLg,
    boxShadow: tokens['--dm-shadow'],
  }

  return (
    <div style={shellStyle} className="design-direction-mockup">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap"
      />

      {/* Top bar */}
      <header
        style={{
          ...cardStyle,
          borderRadius: direction.radiusLg,
          margin: '12px 12px 0',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'sticky',
          top: 12,
          zIndex: 20,
        }}
      >
        <Link
          to="/design-directions"
          style={{ color: tokens['--dm-text-muted'], display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
        >
          <FiArrowLeft /> Retour
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens['--dm-accent'] }}>
            Mockup {direction.id.toUpperCase()}
          </p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: direction.fontDisplay }}>{direction.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: direction.radius,
            border: `1px solid ${tokens['--dm-border']}`,
            background: tokens['--dm-surface-muted'],
            color: tokens['--dm-text'],
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {mode === 'light' ? <FiMoon /> : <FiSun />}
          {mode === 'light' ? 'Sombre' : 'Clair'}
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 13rem) minmax(0, 1fr) minmax(0, 18rem)', gap: 16, padding: 16, maxWidth: 1200, margin: '0 auto' }}
        className="max-lg:!grid-cols-1"
      >
        {/* Sidebar */}
        <aside style={{ ...cardStyle, padding: 12, alignSelf: 'start', position: 'sticky', top: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 12 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: directionId === 'a' ? 10 : directionId === 'b' ? 12 : 14,
                background: `linear-gradient(135deg, ${tokens['--dm-accent']}, ${tokens['--dm-secondary']})`,
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              M
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, fontFamily: direction.fontDisplay }}>mOXT</p>
              <p style={{ margin: 0, fontSize: 10, color: tokens['--dm-text-muted'] }}>{direction.tagline}</p>
            </div>
          </div>
          <nav style={{ display: 'grid', gap: 4 }}>
            {NAV.map((item) => (
              <button
                key={item.label}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: direction.radius,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: item.active ? 700 : 600,
                  background: item.active
                    ? (directionId === 'a' ? tokens['--dm-surface-muted'] : tokens['--dm-accent'])
                    : 'transparent',
                  color: item.active
                    ? (directionId === 'a' ? tokens['--dm-text'] : (mode === 'dark' ? '#0a0a0a' : '#fff'))
                    : tokens['--dm-text-muted'],
                  boxShadow: item.active && directionId === 'b' ? `0 0 0 1px ${tokens['--dm-accent-glow']}` : 'none',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: 16, padding: 12, borderRadius: direction.radius, background: tokens['--dm-surface-muted'], border: `1px solid ${tokens['--dm-border']}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: tokens['--dm-accent-soft'], display: 'grid', placeItems: 'center', color: tokens['--dm-accent'], fontSize: 11, fontWeight: 800 }}>AD</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>Amadou D.</p>
                <p style={{ margin: 0, fontSize: 10, color: tokens['--dm-text-muted'] }}>Compte vérifié</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main list */}
        <main style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens['--dm-accent'] }}>Finances</p>
            <h1 style={{ margin: 0, fontSize: directionId === 'a' ? 28 : 32, fontWeight: 800, fontFamily: direction.fontDisplay, letterSpacing: '-0.02em' }}>Transferts</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: tokens['--dm-text-muted'] }}>Suivez vos envois entre l'Afrique et la Russie.</p>
          </div>

          {/* Search + buttons */}
          <div style={{ ...cardStyle, padding: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: direction.radius, background: tokens['--dm-surface-muted'], border: `1px solid ${tokens['--dm-border']}` }}>
              <FiSearch color={tokens['--dm-text-faint']} />
              <input
                placeholder="Rechercher un transfert..."
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: tokens['--dm-text'], fontSize: 14 }}
              />
            </div>
            <button
              type="button"
              style={{
                padding: '10px 18px',
                borderRadius: direction.radius,
                border: 'none',
                background: tokens['--dm-accent'],
                color: mode === 'dark' && directionId !== 'c' ? '#0a0a0a' : '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: directionId === 'b' ? `0 4px 20px ${tokens['--dm-accent-glow']}` : tokens['--dm-shadow'],
              }}
            >
              Nouveau transfert
            </button>
            <button
              type="button"
              style={{
                padding: '10px 18px',
                borderRadius: direction.radius,
                border: `1px solid ${tokens['--dm-border']}`,
                background: tokens['--dm-surface'],
                color: tokens['--dm-text'],
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Exporter
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'En cours', value: '3', tone: tokens['--dm-warning'] },
              { label: 'Volume du mois', value: '1,2M XOF', tone: tokens['--dm-accent'] },
              { label: 'Taux de succès', value: '98,4%', tone: tokens['--dm-success'] },
            ].map((stat) => (
              <div key={stat.label} style={{ ...cardStyle, padding: 16 }}>
                <p style={{ margin: 0, fontSize: 11, color: tokens['--dm-text-muted'], fontWeight: 600 }}>{stat.label}</p>
                <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, fontFamily: direction.fontDisplay, color: stat.tone, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* List or empty */}
          <div style={{ ...cardStyle, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: direction.fontDisplay }}>Derniers transferts</h2>
              <button type="button" onClick={() => setShowEmpty(!showEmpty)} style={{ fontSize: 11, fontWeight: 700, color: tokens['--dm-accent'], background: 'none', border: 'none', cursor: 'pointer' }}>
                {showEmpty ? 'Voir la liste' : 'Voir empty state'}
              </button>
            </div>

            {showEmpty ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: direction.radiusLg, border: `2px dashed ${tokens['--dm-border']}`, background: tokens['--dm-surface-muted'] }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin: '0 auto 16px',
                    borderRadius: directionId === 'c' ? '50%' : direction.radiusLg,
                    background: isWarm
                      ? `linear-gradient(135deg, ${tokens['--dm-secondary']}33, ${tokens['--dm-accent-soft']})`
                      : tokens['--dm-accent-soft'],
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 28,
                  }}
                >
                  {isWarm ? '✨' : '📭'}
                </div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: direction.fontDisplay }}>Aucun transfert pour l'instant</p>
                <p style={{ margin: '8px auto 0', maxWidth: 280, fontSize: 13, color: tokens['--dm-text-muted'], lineHeight: 1.5 }}>
                  {directionId === 'c'
                    ? 'Créez votre premier envoi en quelques clics — c\'est simple et sécurisé.'
                    : 'Commencez par créer un transfert vers la Russie ou l\'Afrique.'}
                </p>
                <button
                  type="button"
                  style={{
                    marginTop: 20,
                    padding: '10px 20px',
                    borderRadius: direction.radius,
                    border: 'none',
                    background: directionId === 'c' ? tokens['--dm-secondary'] : tokens['--dm-accent'],
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Créer un transfert
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {MOCK_TRANSFERS.map((item) => {
                  const isSelected = item.id === selectedId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 8,
                        padding: 14,
                        borderRadius: direction.radius,
                        border: `1px solid ${isSelected ? tokens['--dm-accent'] : tokens['--dm-border']}`,
                        background: isSelected ? tokens['--dm-accent-soft'] : tokens['--dm-surface-muted'],
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 150ms, box-shadow 150ms',
                        boxShadow: isSelected ? tokens['--dm-shadow-hover'] : 'none',
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: tokens['--dm-text'] }}>{item.name}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: tokens['--dm-text-muted'] }}>{item.id} · {item.meta}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{item.amount}</p>
                        <div style={{ marginTop: 6 }}><StatusBadge status={item.status} tokens={tokens} /></div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        {/* Detail panel */}
        <aside style={{ ...cardStyle, padding: 16, alignSelf: 'start', position: 'sticky', top: 80 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: tokens['--dm-accent'] }}>Détail</p>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, fontFamily: direction.fontDisplay }}>{selected.id}</h2>

          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {[
              ['Destinataire', selected.name.split('→')[1]?.trim() || '—'],
              ['Montant', selected.amount],
              ['Statut', STATUS_STYLES[selected.status]?.label],
              ['Partenaire', selected.meta.split('·')[0]?.trim()],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '10px 12px', borderRadius: direction.radius, background: tokens['--dm-surface-muted'] }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens['--dm-text-faint'] }}>{label}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" style={{ flex: 1, padding: '10px 14px', borderRadius: direction.radius, border: 'none', background: tokens['--dm-accent'], color: mode === 'dark' && directionId === 'b' ? '#0a0a0a' : '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Suivre
            </button>
            <button type="button" style={{ flex: 1, padding: '10px 14px', borderRadius: direction.radius, border: `1px solid ${tokens['--dm-border']}`, background: 'transparent', color: tokens['--dm-text'], fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Contacter
            </button>
          </div>

          {directionId === 'c' && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: direction.radiusLg, background: `linear-gradient(135deg, ${tokens['--dm-accent-soft']}, ${tokens['--dm-info-soft']})`, border: `1px solid ${tokens['--dm-border']}` }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>💬 12 membres actifs dans votre communauté</p>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: tokens['--dm-text-muted'] }}>Partagez votre expérience après ce transfert.</p>
            </div>
          )}

          {directionId === 'b' && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: direction.radius, background: tokens['--dm-surface-muted'], border: `1px solid ${tokens['--dm-border']}`, boxShadow: `inset 0 1px 0 ${tokens['--dm-accent-glow']}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiBell color={tokens['--dm-accent']} />
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>Alerte sécurité activée</p>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: tokens['--dm-text-muted'] }}>Vérification KYC requise avant déblocage.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile bottom nav preview */}
      <div
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 12,
          left: 12,
          right: 12,
          padding: '8px 12px',
          borderRadius: direction.radiusLg,
          background: tokens['--dm-surface'],
          border: `1px solid ${tokens['--dm-border']}`,
          boxShadow: tokens['--dm-shadow-hover'],
        }}
        className="max-lg:!flex max-lg:!justify-around"
      >
        {[FiHome, FiRepeat, FiShoppingBag, FiUsers].map((Icon, i) => (
          <button key={i} type="button" style={{ background: 'none', border: 'none', padding: 8, color: i === 1 ? tokens['--dm-accent'] : tokens['--dm-text-muted'], cursor: 'pointer' }}>
            <Icon size={20} />
          </button>
        ))}
      </div>
    </div>
  )
}
