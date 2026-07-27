import { useState } from 'react'
import { FiHardDrive, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { Button } from '../../../components/ui/Button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useLanguage } from '../../../contexts/useLanguage'
import { storageService } from '../../../services/storageService'
import { addToast } from '../../ui/uiSlice'
import { CARD } from '../adminConfig'
import { adminText } from '../adminI18n'
import { SectionTitle } from './AdminShared'

/**
 * Maintenance du bucket privé `documents` : détecte et supprime les fichiers
 * qu'aucune ligne ne référence (upload réussi mais enregistrement échoué, ou
 * compte supprimé avant la fin du parcours).
 *
 * Un orphelin n'appartient à aucun dossier client : il n'est donc couvert par
 * aucune obligation de conservation (115-ФЗ art. 7 §4), contrairement aux
 * documents rattachés à une vérification, protégés par `legal_hold_until`.
 */
export function AdminDocumentMaintenanceCard() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [orphans, setOrphans] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [purging, setPurging] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function scan() {
    setScanning(true)
    try {
      const found = await storageService.listOrphanDocuments(24)
      setOrphans(found)
      dispatch(
        addToast({
          title: adminText(t, 'admin.documents.scanDoneTitle'),
          message: adminText(t, 'admin.documents.scanDoneBody', { count: found.length }),
          tone: found.length ? 'warning' : 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.documents.scanFailedTitle'),
          message: err?.message || '',
          tone: 'error',
        }),
      )
    } finally {
      setScanning(false)
    }
  }

  async function purge() {
    setConfirmOpen(false)
    setPurging(true)
    try {
      const { removed, failed } = await storageService.purgeOrphanDocuments(24)
      setOrphans([])
      dispatch(
        addToast({
          title: adminText(t, 'admin.documents.purgeDoneTitle'),
          message: adminText(t, 'admin.documents.purgeDoneBody', { count: removed, failed }),
          tone: failed ? 'warning' : 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.documents.purgeFailedTitle'),
          message: err?.message || '',
          tone: 'error',
        }),
      )
    } finally {
      setPurging(false)
    }
  }

  return (
    <div className={`${CARD} grid gap-4 p-5`}>
      <SectionTitle
        icon={FiHardDrive}
        label={adminText(t, 'admin.documents.maintenanceTitle')}
        count={orphans?.length}
      />
      <p className="text-sm text-[var(--app-text-muted)]">
        {adminText(t, 'admin.documents.maintenanceDescription')}
      </p>

      {orphans?.length ? (
        <ul className="grid max-h-56 gap-1 overflow-y-auto rounded-xl bg-[var(--app-surface-muted)] p-3">
          {orphans.map((item) => (
            <li
              key={item.path}
              className="truncate font-mono text-[11px] text-[var(--app-text-muted)]"
              title={item.path}
            >
              {item.path}
            </li>
          ))}
        </ul>
      ) : orphans ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {adminText(t, 'admin.documents.noOrphans')}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" icon={FiRefreshCw} loading={scanning} onClick={scan}>
          {adminText(t, 'admin.documents.scanAction')}
        </Button>
        <Button
          variant="danger"
          icon={FiTrash2}
          disabled={!orphans?.length || purging}
          loading={purging}
          onClick={() => setConfirmOpen(true)}
        >
          {adminText(t, 'admin.documents.purgeAction')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={adminText(t, 'admin.documents.purgeConfirmTitle')}
        description={adminText(t, 'admin.documents.purgeConfirmBody', {
          count: orphans?.length || 0,
        })}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={purge}
      />
    </div>
  )
}
