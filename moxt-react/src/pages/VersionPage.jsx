import { FiArrowLeft, FiCheck, FiPackage, FiStar, FiZap } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const APP_VERSION = '1.0.0'
const BUILD_DATE = '4 Juillet 2026'

const CHANGELOG = [
  {
    version: '1.0.0',
    date: '4 Juillet 2026',
    highlights: [
      { icon: FiZap, text: 'Smart navbar — se cache automatiquement au défilement' },
      { icon: FiStar, text: 'Système de favoris avec indicateur rouge' },
      { icon: FiCheck, text: 'Republication limitée au propriétaire (une seule fois)' },
      { icon: FiPackage, text: 'Upload d\'image pour les publications (au lieu d\'un lien)' },
      { icon: FiZap, text: 'Optimisations de performance (Redux batch, MutationObserver debounce)' },
      { icon: FiCheck, text: 'Montants transfert toujours affichés (fallback robuste)' },
      { icon: FiStar, text: 'Badges de statut repositionnés pour un meilleur affichage' },
      { icon: FiPackage, text: 'Internationalisation complétée (FR, EN, RU, PT)' },
      { icon: FiZap, text: 'Responsive amélioré sur le dashboard' },
      { icon: FiCheck, text: 'Mode sombre complet sur toutes les pages' },
      { icon: FiStar, text: 'Système de recherche globale' },
      { icon: FiPackage, text: 'Notifications push et e-mail configurables' },
      { icon: FiZap, text: 'Support hors-ligne (PWA)' },
      { icon: FiCheck, text: 'Page de support intégrée' },
    ],
  },
]

export function VersionPage() {
  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Paramètres"
        title="Version de l'application"
        description={`MOXT v${APP_VERSION} · Build du ${BUILD_DATE}`}
        actions={
          <Link to="/settings">
            <Button variant="secondary" icon={FiArrowLeft}>Retour</Button>
          </Link>
        }
      />

      <Card>
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-brand-700 to-[var(--app-teal)] text-white shadow-lg">
            <FiPackage className="text-2xl" />
          </span>
          <div>
            <h2 className="text-2xl font-black tabular-nums">v{APP_VERSION}</h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              Version stable · {BUILD_DATE}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pages" value="30+" />
          <Stat label="Langues" value="4" />
          <Stat label="Composants" value="120+" />
          <Stat label="Fonctionnalités" value="50+" />
        </div>
      </Card>

      {CHANGELOG.map((release) => (
        <Card key={release.version}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black">v{release.version}</h3>
            <span className="text-xs font-bold text-[var(--app-text-muted)]">{release.date}</span>
          </div>
          <ul className="grid gap-2.5">
            {release.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 rounded-xl bg-[var(--app-surface-muted)] p-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                  <item.icon className="text-xs" />
                </span>
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <Card className="text-center">
        <p className="text-sm text-[var(--app-text-muted)]">
          MOXT — Plateforme de services entre le Bénin et la Russie
        </p>
        <p className="mt-1 text-xs text-[var(--app-text-faint)]">
          © 2026 MOXT. Tous droits réservés.
        </p>
      </Card>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--app-surface-muted)] p-3 text-center">
      <strong className="block text-lg font-black">{value}</strong>
      <span className="text-[11px] font-semibold text-[var(--app-text-faint)]">{label}</span>
    </div>
  )
}
