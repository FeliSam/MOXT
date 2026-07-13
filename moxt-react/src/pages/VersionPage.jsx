import { useEffect, useState } from 'react'
import { FiArrowLeft, FiPackage } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { APP_VERSION, fetchAppReleaseInfo, formatBuildDate } from '../config/appVersion'
import { getLocalBuildId } from '../services/appUpdate'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const CHANGELOG = [
  {
    version: '1.1.0',
    date: 'Juillet 2026',
    highlights: [
      'Notifications push natives (Android / iOS) et permissions caméra Capacitor',
      'Politique de confidentialité et CGU multilingues (FR, EN, RU, PT)',
      'Filtrage des échangeurs par pays d\'origine et drapeaux partenaires',
      'Page présentation MOXT avec aperçus mobile et desktop',
      'Langue par défaut russe et sélecteur de langue visible',
      'Logo X unifié (application, site, navigation)',
    ],
  },
  {
    version: '1.0.0',
    date: 'Juillet 2026',
    highlights: [
      'Scanner QR, visibilité profil/entreprise, bouton Contacter',
      'Internationalisation FR / EN / RU / PT',
      'PWA, mode sombre, recherche globale',
    ],
  },
]

export function VersionPage() {
  const [release, setRelease] = useState({
    version: APP_VERSION,
    buildId: getLocalBuildId(),
    builtAt: null,
    channel: 'production',
  })

  useEffect(() => {
    void fetchAppReleaseInfo().then((info) => {
      if (info) setRelease(info)
    })
  }, [])

  const buildLabel = formatBuildDate(release.builtAt)

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Paramètres"
        title="Version de l'application"
        description={`MOXT v${release.version}${buildLabel ? ` · Build du ${buildLabel}` : ''}`}
        actions={
          <Link to="/settings">
            <Button variant="secondary" icon={FiArrowLeft}>
              Retour
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="flex items-center gap-4">
          <img
            src="/assets/logos/X.png"
            alt="MOXT"
            className="size-14 shrink-0 rounded-3xl shadow-lg"
          />
          <div className="min-w-0">
            <h2 className="text-2xl font-black tabular-nums">v{release.version}</h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              Canal {release.channel}
              {release.buildId ? ` · ${release.buildId}` : ''}
            </p>
            {buildLabel ? (
              <p className="mt-1 text-xs text-[var(--app-text-faint)]">Compilé le {buildLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pages" value="30+" />
          <Stat label="Langues" value="4" />
          <Stat label="Build" value={release.buildId || '—'} />
          <Stat label="Canal" value={release.channel} />
        </div>
      </Card>

      {CHANGELOG.map((entry) => (
        <Card key={entry.version}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-black">v{entry.version}</h3>
            <span className="text-xs font-bold text-[var(--app-text-muted)]">{entry.date}</span>
          </div>
          <ul className="grid gap-2.5">
            {entry.highlights.map((text) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm"
              >
                <FiPackage className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[var(--app-surface-muted)] p-3 text-center">
      <strong className="block truncate text-lg font-black">{value}</strong>
      <span className="text-[11px] font-semibold text-[var(--app-text-faint)]">{label}</span>
    </div>
  )
}
