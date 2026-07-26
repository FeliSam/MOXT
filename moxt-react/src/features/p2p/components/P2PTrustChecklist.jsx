import { FiCheckCircle } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'

const CHECK_KEYS = [
  'p2p.trustChecklist.verifyIdentity',
  'p2p.trustChecklist.useInAppDetails',
  'p2p.trustChecklist.keepProofs',
  'p2p.trustChecklist.openDispute',
]

export function P2PTrustChecklist({ className = '' }) {
  const { t } = useLanguage()
  return (
    <div
      className={`rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 ${className}`}
    >
      <p className="text-sm font-black">{t('p2p.trustChecklist.title')}</p>
      <ul className="mt-2 grid gap-1.5">
        {CHECK_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2 text-sm text-[var(--app-text-muted)]">
            <FiCheckCircle className="mt-0.5 shrink-0 text-brand-700" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
