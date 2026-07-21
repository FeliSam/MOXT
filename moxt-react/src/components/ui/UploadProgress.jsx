import { FiCheck, FiUploadCloud } from 'react-icons/fi'
import { useLanguage } from '../../contexts/useLanguage'
import { shortenFileName, UPLOAD_PHASES } from '../../services/uploadProgress'

const PHASE_KEYS = {
  [UPLOAD_PHASES.preparing]: 'common.upload.phases.preparing',
  [UPLOAD_PHASES.compressing]: 'common.upload.phases.compressing',
  [UPLOAD_PHASES.uploading]: 'common.upload.phases.uploading',
  [UPLOAD_PHASES.finalizing]: 'common.upload.phases.finalizing',
  [UPLOAD_PHASES.done]: 'common.upload.phases.done',
  [UPLOAD_PHASES.error]: 'common.upload.phases.error',
}

/**
 * Barre de progression d’upload (brand MOXT).
 * Afficher quand progress.active || phase === done (brièvement).
 */
export function UploadProgress({
  progress,
  className = '',
  compact = false,
  label,
}) {
  const { t } = useLanguage()
  if (!progress?.phase && !progress?.active) return null

  const percent = Math.max(0, Math.min(100, Number(progress.percent) || 0))
  const done = progress.phase === UPLOAD_PHASES.done
  const errored = progress.phase === UPLOAD_PHASES.error
  const phaseKey = PHASE_KEYS[progress.phase] || PHASE_KEYS[UPLOAD_PHASES.uploading]
  const phaseLabel = label || t(phaseKey)
  const multi =
    progress.fileCount > 1
      ? t('common.upload.fileOf', {
          current: (progress.fileIndex || 0) + 1,
          total: progress.fileCount,
        })
      : null
  const fileHint = progress.fileName ? shortenFileName(progress.fileName, 28) : null

  return (
    <div
      className={`upload-progress w-full max-w-full min-w-0 ${compact ? 'upload-progress--compact' : ''} ${
        done ? 'upload-progress--done' : ''
      } ${errored ? 'upload-progress--error' : ''} ${className}`}
      role="status"
      aria-live="polite"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-xl ${
            done
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              : errored
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
          }`}
        >
          {done ? <FiCheck className="text-sm" /> : <FiUploadCloud className="text-sm" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <p className="truncate text-xs font-black uppercase tracking-[0.08em] text-[var(--app-text)]">
              {phaseLabel}
              {multi ? ` · ${multi}` : ''}
            </p>
            <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--app-text-muted)]">
              {percent}%
            </span>
          </div>
          {fileHint ? (
            <p className="mt-0.5 truncate text-[11px] text-[var(--app-text-muted)]" title={progress.fileName}>
              {fileHint}
            </p>
          ) : null}
        </div>
      </div>
      <div className="upload-progress-track mt-2.5" aria-hidden="true">
        <span
          className="upload-progress-bar"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
