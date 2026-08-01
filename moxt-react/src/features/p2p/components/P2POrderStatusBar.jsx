import { FiCheck } from 'react-icons/fi'
import { useLanguage } from '../../../contexts/useLanguage'
import { P2P_ORDER_STEPS, p2pOrderStepIndex } from '../p2pUtils'

const STEP_LABEL_KEYS = {
  engagement: 'p2p.order.steps.engagement',
  payment: 'p2p.order.steps.payment',
  confirmation: 'p2p.order.steps.confirmation',
  done: 'p2p.order.steps.done',
}

export function P2POrderStatusBar({ status }) {
  const { t } = useLanguage()
  const activeIndex = p2pOrderStepIndex(status)
  const isTerminalFail = status === 'cancelled'
  const isDisputed = status === 'disputed'

  return (
    <ol className="grid grid-cols-4 gap-1 sm:gap-2" aria-label={t('p2p.order.stepsLabel')}>
      {P2P_ORDER_STEPS.map((step, index) => {
        const done = !isTerminalFail && index < activeIndex
        const current = !isTerminalFail && index === activeIndex
        return (
          <li key={step} className="grid justify-items-center gap-1.5 text-center">
            <span
              className={`grid size-8 place-items-center rounded-full text-xs font-black transition sm:size-9 ${
                isDisputed && current
                  ? 'bg-amber-500 text-white'
                  : done || (current && status === 'completed')
                    ? 'bg-emerald-600 text-white'
                    : current
                      ? 'bg-cyan-600 text-white'
                      : 'bg-[var(--app-surface-muted)] text-[var(--app-text-faint)]'
              }`}
            >
              {done || status === 'completed' ? <FiCheck /> : index + 1}
            </span>
            <span
              className={`max-w-full truncate text-[10px] font-bold leading-tight sm:text-xs ${
                current ? 'text-[var(--app-text)]' : 'text-[var(--app-text-muted)]'
              }`}
            >
              {t(STEP_LABEL_KEYS[step])}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
