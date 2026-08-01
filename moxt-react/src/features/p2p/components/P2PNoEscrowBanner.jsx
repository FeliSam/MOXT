import { FiShield } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'

export function P2PNoEscrowBanner({ className = '' }) {
  const { t } = useLanguage()
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-cyan-200/80 bg-cyan-50/90 px-4 py-3 text-sm leading-6 text-cyan-950 dark:border-cyan-900/50 dark:bg-cyan-950/35 dark:text-cyan-100 ${className}`}
    >
      <FiShield className="mt-0.5 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden />
      <p>{t('p2p.noEscrowBanner')}</p>
    </div>
  )
}
