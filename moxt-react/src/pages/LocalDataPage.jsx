import { useState } from 'react'
import { FiAlertTriangle, FiArrowLeft, FiDatabase, FiDownload, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { APP_MESSAGES } from '../config/messages'
import {
  exportLocalData,
  inspectLocalData,
  resetLocalDataDomains,
  STORAGE_SCHEMA_VERSION,
} from '../services/storageRegistry'
import { formatFileSize } from '../utils/formatters'

export function LocalDataPage() {
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
    link.download = `moxt-sauvegarde-locale-${new Date().toISOString().slice(0, 10)}.json`
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

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Compte"
        title="Données locales"
        description="Contrôlez les données enregistrées dans ce navigateur avant la connexion du backend."
        actions={
          <>
            <Link
              to="/profile"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-surface)] px-4 text-sm font-bold shadow-sm hover:bg-[var(--app-surface-muted)]"
            >
              <FiArrowLeft /> Retour
            </Link>
            <Button
              variant="secondary"
              icon={FiRefreshCw}
              onClick={() => setReport(inspectLocalData())}
            >
              Actualiser
            </Button>
            <Button icon={FiDownload} onClick={downloadBackup}>
              Télécharger une sauvegarde
            </Button>
          </>
        }
      />

      {!report.available ? (
        <Card className="flex gap-3">
          <FiAlertTriangle className="mt-1 text-xl text-amber-600" />
          <p>{APP_MESSAGES.storageUnavailable}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Version du schéma" value={STORAGE_SCHEMA_VERSION} />
            <Metric label="Espace utilisé" value={formatFileSize(report.totalBytes)} />
            <Metric
              label="Données illisibles"
              value={report.invalidKeys.length}
              warning={report.invalidKeys.length > 0}
            />
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black">Domaines enregistrés</h2>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  Sélectionnez uniquement les catégories que vous souhaitez réinitialiser.
                </p>
              </div>
              <Button
                variant="danger"
                icon={FiTrash2}
                disabled={!selected.length}
                onClick={() => setConfirmReset(true)}
              >
                Réinitialiser ({selected.length})
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
                    <strong className="block">{domain.label}</strong>
                    <span className="mt-1 block text-xs text-[var(--app-text-muted)]">
                      {domain.count} élément(s) · {formatFileSize(domain.bytes)}
                    </span>
                    {domain.invalid ? (
                      <Badge className="mt-2" tone="danger">
                        {domain.invalid} clé(s) illisible(s)
                      </Badge>
                    ) : (
                      <Badge className="mt-2" tone="success">
                        Données lisibles
                      </Badge>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <FiDatabase className="text-2xl text-brand-600" />
            <h2 className="mt-4 font-black">Ce que fait cette page</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
              La sauvegarde contient uniquement les données MOXT de ce navigateur. La
              réinitialisation ne touche pas votre mot de passe et ne transmet aucune donnée.
            </p>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Réinitialiser les données sélectionnées"
        description="Cette opération supprime les catégories choisies de ce navigateur. Téléchargez une sauvegarde avant de confirmer."
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
