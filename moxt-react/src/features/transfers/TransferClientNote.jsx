import { FiMessageSquare } from 'react-icons/fi'
import { LinkifiedText } from '../../components/ui/LinkifiedText'
import { useLanguage } from '../../contexts/useLanguage'

/** Message client → échangeur (noteToExchanger), visible avant confirmation. */
export function TransferClientNote({ note, className = '', compact = false }) {
  const { t } = useLanguage()
  const text = String(note || '').trim()
  if (!text) return null

  return (
    <div
      className={`rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/25 ${className}`}
      role="note"
    >
      <p
        className={`flex items-center gap-2 font-black uppercase tracking-wide text-amber-900 dark:text-amber-200 ${
          compact ? 'text-[10px]' : 'text-[11px]'
        }`}
      >
        <FiMessageSquare className="shrink-0" aria-hidden />
        {t('transfers.detail.noteToExchanger')}
      </p>
      <LinkifiedText
        as="p"
        text={text}
        preserveWhitespace="pre-wrap"
        className={`mt-1.5 text-[var(--app-text)] ${compact ? 'text-xs' : 'text-sm'}`}
      />
    </div>
  )
}
