import { useState } from 'react'
import { FiHardDrive, FiLink, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
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
 * Maintenance du bucket privé `documents`.
 * Priorité : rattacher les fichiers non référencés (préfixe userId) —
 * ne purger que ce qui n’a vraiment pas de propriétaire.
 */
export function AdminDocumentMaintenanceCard() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [orphans, setOrphans] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [attributing, setAttributing] = useState(false)
  const [purging, setPurging] = useState(false)
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false)

  async function scan() {
    setScanning(true)
    try {
      // grace 0 : inclure aussi les uploads récents non synchronisés
      const found = await storageService.listOrphanDocuments(0)
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

  async function reattribute() {
    setAttributing(true)
    try {
      const result = await storageService.reattributeOrphanDocuments(0)
      const remaining = await storageService.listOrphanDocuments(0)
      setOrphans(remaining)
      dispatch(
        addToast({
          title: adminText(t, 'admin.documents.attributeDoneTitle'),
          message: adminText(t, 'admin.documents.attributeDoneBody', {
            attributed: result.attributed,
            personal: result.personal,
            business: result.business,
            skipped: result.skipped,
            remaining: remaining.length,
          }),
          tone: remaining.length ? 'warning' : 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.documents.attributeFailedTitle'),
          message: err?.message || '',
          tone: 'error',
        }),
      )
    } finally {
      setAttributing(false)
    }
  }

  async function purge() {
    setConfirmPurgeOpen(false)
    setPurging(true)
    try {
      const { removed, failed } = await storageService.purgeOrphanDocuments(0)
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
          icon={FiLink}
          disabled={!orphans?.length || attributing}
          loading={attributing}
          onClick={reattribute}
        >
          {adminText(t, 'admin.documents.attributeAction')}
        </Button>
        <Button
          variant="danger"
          icon={FiTrash2}
          disabled={!orphans?.length || purging}
          loading={purging}
          onClick={() => setConfirmPurgeOpen(true)}
        >
          {adminText(t, 'admin.documents.purgeAction')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmPurgeOpen}
        title={adminText(t, 'admin.documents.purgeConfirmTitle')}
        description={adminText(t, 'admin.documents.purgeConfirmBody', {
          count: orphans?.length || 0,
        })}
        onCancel={() => setConfirmPurgeOpen(false)}
        onConfirm={purge}
      />
    </div>
  )
}
