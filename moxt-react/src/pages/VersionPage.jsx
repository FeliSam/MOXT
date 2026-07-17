import { useEffect, useState } from 'react'
import { FiArrowLeft, FiPackage } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { APP_VERSION, fetchAppReleaseInfo } from '../config/appVersion'
import { useLanguage } from '../contexts/useLanguage'
import { getLocalBuildId } from '../services/appUpdate'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { formatDateTime } from '../utils/formatters'

const CHANGELOG = [
  {
    version: '1.1.0',
    dateKey: 'version.changelog.v110.date',
    highlightKeys: [
      'version.changelog.v110.h0',
      'version.changelog.v110.h1',
      'version.changelog.v110.h2',
      'version.changelog.v110.h3',
      'version.changelog.v110.h4',
      'version.changelog.v110.h5',
    ],
  },
  {
    version: '1.0.0',
    dateKey: 'version.changelog.v100.date',
    highlightKeys: [
      'version.changelog.v100.h0',
      'version.changelog.v100.h1',
      'version.changelog.v100.h2',
    ],
  },
]

export function VersionPage() {
  const { language, t } = useLanguage()
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

  const buildLabel = release.builtAt ? formatDateTime(release.builtAt, language) : null

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={t('settings.pageTitle')}
        title={t('version.title')}
        description={
          buildLabel
            ? t('version.descriptionWithBuild', {
                version: release.version,
                date: buildLabel,
              })
            : t('version.description', { version: release.version })
        }
        actions={
          <Link to="/settings">
            <Button variant="secondary" icon={FiArrowLeft}>
              {t('common.back')}
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="flex items-center gap-4">
          <img
            src="/assets/brand/mark.png?v=20260714e"
            alt="MOXT"
            className="size-14 shrink-0 rounded-3xl shadow-lg"
          />
          <div className="min-w-0">
            <h2 className="text-2xl font-black tabular-nums">v{release.version}</h2>
            <p className="text-sm text-[var(--app-text-muted)]">
              {t('version.channelLabel', { channel: release.channel })}
              {release.buildId ? ` · ${release.buildId}` : ''}
            </p>
            {buildLabel ? (
              <p className="mt-1 text-xs text-[var(--app-text-faint)]">
                {t('version.compiledOn', { date: buildLabel })}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t('version.stats.pages')} value="30+" />
          <Stat label={t('version.stats.languages')} value="4" />
          <Stat label={t('version.stats.build')} value={release.buildId || '—'} />
          <Stat label={t('version.stats.channel')} value={release.channel} />
        </div>
      </Card>

      {CHANGELOG.map((entry) => (
        <Card key={entry.version}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-black">v{entry.version}</h3>
            <span className="text-xs font-bold text-[var(--app-text-muted)]">
              {t(entry.dateKey)}
            </span>
          </div>
          <ul className="grid gap-2.5">
            {entry.highlightKeys.map((key) => (
              <li
                key={key}
                className="flex items-start gap-3 rounded-xl bg-[var(--app-surface-muted)] p-3 text-sm"
              >
                <FiPackage className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" />
                <span>{t(key)}</span>
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
