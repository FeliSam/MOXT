import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi'

const variants = {
  error: {
    className:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
    icon: FiAlertCircle,
  },
  info: {
    className:
      'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
    icon: FiInfo,
  },
  success: {
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    icon: FiCheckCircle,
  },
}

export function Alert({ children, title, variant = 'info' }) {
  const config = variants[variant]
  const Icon = config.icon

  return (
    <div className={`flex gap-3 rounded-xl border p-3.5 text-sm ${config.className}`} role="alert">
      <Icon className="mt-0.5 shrink-0 text-lg" />
      <div>
        {title ? <strong className="block">{title}</strong> : null}
        <div className={title ? 'mt-1 leading-5 opacity-90' : 'leading-5'}>{children}</div>
      </div>
    </div>
  )
}
