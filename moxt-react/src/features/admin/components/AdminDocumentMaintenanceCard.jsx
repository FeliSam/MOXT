import { useState } from 'react'
import { FiHardDrive, FiRefreshCw, FiTool, FiTrash2 } from 'react-icons/fi'
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
 * Réparation (attribution + dédoublonnage) — aussi lancée chaque jour par le cron.
 */
export function AdminDocumentMaintenanceCard() {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const [orphans, setOrphans] = useState(null)
  const [lastRepair, setLastRepair] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [purging, setPurging] = useState(false)
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false)

  async function scan() {
    setScanning(true)
    try {
      const found = await storageService.listOrphanDocuments(0)
      let withReasons = found
      if (found.length) {
        try {
          const dry = await storageService.reattributeOrphanDocuments(0)
          const byPath = new Map(dry.rows.map((row) => [row.path, row.detail]))
          withReasons = found.map((item) => ({
            ...item,
            skipReason: byPath.get(item.path) || '',
          }))
        } catch {
          /* scan raisons optionnel */
        }
      }
      setOrphans(withReasons)
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

  async function repair() {
    setRepairing(true)
    try {
      const result = await storageService.repairDocuments(0)
      const remaining = await storageService.listOrphanDocuments(0)
      let withReasons = remaining
      if (remaining.length) {
        try {
          const dry = await storageService.reattributeOrphanDocuments(0)
          const byPath = new Map(dry.rows.map((row) => [row.path, row.detail]))
          withReasons = remaining.map((item) => ({
            ...item,
            skipReason: byPath.get(item.path) || '',
          }))
        } catch {
          /* scan raisons optionnel */
        }
      }
      setOrphans(withReasons)
      setLastRepair(result)
      dispatch(
        addToast({
          title: adminText(t, 'admin.documents.repairDoneTitle'),
          message: adminText(t, 'admin.documents.repairDoneBody', {
            attributed: result.attributed,
            personal: result.personal,
            business: result.business,
            skipped: result.skipped,
            remaining: remaining.length,
            deduped:
              result.dedupe.businessSuperseded +
              result.dedupe.personalSoftDeleted +
              result.dedupe.businessPathRemoved +
              result.dedupe.personalPathRemoved,
          }),
          tone: remaining.length ? 'warning' : 'success',
        }),
      )
    } catch (err) {
      dispatch(
        addToast({
          title: adminText(t, 'admin.documents.repairFailedTitle'),
          message: err?.message || '',
          tone: 'error',
        }),
      )
    } finally {
      setRepairing(false)
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

      {lastRepair ? (
        <p className="rounded-xl bg-[var(--app-surface-muted)] px-3 py-2.5 text-xs text-[var(--app-text-muted)]">
          {adminText(t, 'admin.documents.lastRepairSummary', {
            attributed: lastRepair.attributed,
            deduped:
              lastRepair.dedupe.businessSuperseded +
              lastRepair.dedupe.personalSoftDeleted +
              lastRepair.dedupe.businessPathRemoved +
              lastRepair.dedupe.personalPathRemoved,
            remaining: lastRepair.remaining,
          })}
        </p>
      ) : null}

      {orphans?.length ? (
        <ul className="grid max-h-56 gap-2 overflow-y-auto rounded-xl bg-[var(--app-surface-muted)] p-3">
          {orphans.map((item) => (
            <li key={item.path} className="grid gap-0.5" title={item.path}>
              <span className="truncate font-mono text-[11px] text-[var(--app-text-muted)]">
                {item.path}
              </span>
              {item.skipReason ? (
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  {adminText(t, 'admin.documents.skipReason', { reason: item.skipReason })}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : orphans ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {adminText(t, 'admin.documents.noOrphans')}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button icon={FiTool} loading={repairing} onClick={repair}>
          {adminText(t, 'admin.documents.repairAction')}
        </Button>
        <Button variant="secondary" icon={FiRefreshCw} loading={scanning} onClick={scan}>
          {adminText(t, 'admin.documents.scanAction')}
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
