import { useState } from 'react'
import { FiAlertTriangle, FiDatabase, FiDownload, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import { BackButton } from '../components/ui/BackButton'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { APP_MESSAGE_KEYS, APP_MESSAGES } from '../config/messages'
import { useLanguage } from '../contexts/useLanguage'
import {
  exportLocalData,
  inspectLocalData,
  resetLocalDataDomains,
  STORAGE_SCHEMA_VERSION,
} from '../services/storageRegistry'
import { formatFileSize } from '../utils/formatters'

export function LocalDataPage() {
  const { language, t } = useLanguage()
  const [report, setReport] = useState(() => inspectLocalData())
  const [selected, setSelected] = useState([])
  const [confirmReset, setConfirmReset] = useState(false)

  function toggleDomain(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function downloadBackup() {
    const backup = exportLocalData()
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().slice(0, 10)
    link.download = t('localData.backupFilename', { date })
    link.click()
    URL.revokeObjectURL(url)
  }

  function resetSelected() {
    resetLocalDataDomains(selected)
    setSelected([])
    setConfirmReset(false)
    setReport(inspectLocalData())
    window.setTimeout(() => window.location.reload(), 350)
  }

  const storageUnavailable =
    t(APP_MESSAGE_KEYS.storageUnavailable) || APP_MESSAGES.storageUnavailable

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={t('common.account')}
        title={t('localData.title')}
        description={t('localData.description')}
        actions={
          <>
            <BackButton appearance="link" />
            <Button
              variant="secondary"
              icon={FiRefreshCw}
              onClick={() => setReport(inspectLocalData())}
            >
              {t('localData.refresh')}
            </Button>
            <Button icon={FiDownload} onClick={downloadBackup}>
              {t('localData.downloadBackup')}
            </Button>
          </>
        }
      />

      {!report.available ? (
        <Card className="flex gap-3">
          <FiAlertTriangle className="mt-1 text-xl text-amber-600" />
          <p>{storageUnavailable}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label={t('localData.schemaVersion')} value={STORAGE_SCHEMA_VERSION} />
            <Metric
              label={t('localData.spaceUsed')}
              value={formatFileSize(report.totalBytes, language)}
            />
            <Metric
              label={t('localData.unreadableData')}
              value={report.invalidKeys.length}
              warning={report.invalidKeys.length > 0}
            />
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black">{t('localData.domainsTitle')}</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {t('localData.domainsHint')}
                </p>
              </div>
              <Button
                variant="danger"
                icon={FiTrash2}
                disabled={!selected.length}
                onClick={() => setConfirmReset(true)}
              >
                {t('localData.reset', { count: selected.length })}
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {report.domains.map((domain) => (
                <label
                  key={domain.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--app-surface-muted)] p-4"
                >
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={selected.includes(domain.id)}
                    onChange={() => toggleDomain(domain.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <strong className="block">{t(domain.labelKey)}</strong>
                    <span className="mt-1 block text-xs text-[var(--app-text-muted)]">
                      {t('localData.itemCount', {
                        count: domain.count,
                        size: formatFileSize(domain.bytes, language),
                      })}
                    </span>
                    {domain.invalid ? (
                      <Badge className="mt-2" tone="danger">
                        {t('localData.invalidKeys', { count: domain.invalid })}
                      </Badge>
                    ) : (
                      <Badge className="mt-2" tone="success">
                        {t('localData.readable')}
                      </Badge>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <FiDatabase className="text-2xl text-brand-600" />
            <h2 className="mt-4 font-black">{t('localData.aboutTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              {t('localData.aboutBody')}
            </p>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={confirmReset}
        title={t('localData.confirmTitle')}
        description={t('localData.confirmBody')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={resetSelected}
      />
    </div>
  )
}

function Metric({ label, value, warning = false }) {
  return (
    <Card>
      <strong className={`text-3xl ${warning ? 'text-amber-600' : ''}`}>{value}</strong>
      <p className="mt-1 text-sm text-[var(--app-text-muted)]">{label}</p>
    </Card>
  )
}
