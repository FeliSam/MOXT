import { FiAlertCircle, FiCheckCircle, FiShield } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useLanguage } from '../../contexts/useLanguage'
import { getBusinessCompletionStatus } from './businessCompletion'
import { businessesText } from './businessesI18n'

function professionalTabHref(tab) {
  if (!tab) return '/professional'
  return `/professional?tab=${encodeURIComponent(tab)}`
}

export function BusinessVerificationProgress({
  business,
  documents = [],
  className = '',
  compact = false,
}) {
  const { t } = useLanguage()
  const bt = (key, vars) => businessesText(t, key, vars)
  const { percent, missing, complete, total } = getBusinessCompletionStatus(business, documents)

  if (!business) return null

  const resolveLabel = (item) =>
    item.labelKey ? businessesText(t, item.labelKey) : item.label
  const resolveHint = (item) => (item.hintKey ? businessesText(t, item.hintKey) : item.hint)

  if (percent === 100) {
    return (
      <Alert variant="success" title={bt('businesses.verification.completeTitle')} className={className}>
        {bt('businesses.verification.completeBody')}
      </Alert>
    )
  }

  if (compact) {
    return (
      <div className={`rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 ${className}`}>
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
          {bt('businesses.verification.compactTitle', { percent })}
        </p>
        <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90">
          {bt('businesses.verification.compactBody', {
            count: missing.length,
            items: missing.map((item) => resolveLabel(item)).join(', '),
          })}
        </p>
      </div>
    )
  }

  return (
    <Card className={`grid gap-5 border border-amber-200/80 bg-amber-50/40 p-5 dark:border-amber-900/30 dark:bg-amber-950/15 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-black">
            <FiShield className="text-brand-700" />
            {bt('businesses.verification.title')}
          </h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            {bt('businesses.verification.progressHint', {
              complete: complete.length,
              total,
              missing: missing.length,
            })}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-brand-700 shadow-sm dark:bg-[var(--app-surface)]">
          {percent}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/80 dark:bg-[var(--app-surface-muted)]">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {missing.length ? (
        <div className="grid gap-2">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
            {bt('businesses.verification.missingHeading')}
          </p>
          <ul className="grid gap-2">
            {missing.map((item) => (
              <li
                key={item.key}
                className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-white p-3 dark:border-amber-900/30 dark:bg-[var(--app-surface)]"
              >
                <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm">{resolveLabel(item)}</strong>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--app-text-muted)]">
                    {resolveHint(item)}
                  </p>
                </div>
                {item.professionalTab ? (
                  <Link to={professionalTabHref(item.professionalTab)} className="shrink-0">
                    <Button size="sm" variant="secondary">
                      {item.professionalTab === 'documents'
                        ? bt('businesses.verification.documents')
                        : bt('businesses.verification.proSpace')}
                    </Button>
                  </Link>
                ) : item.setupStep ? (
                  <Link to="/businesses/setup" className="shrink-0">
                    <Button size="sm" variant="secondary">
                      {bt('businesses.verification.complete')}
                    </Button>
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {complete.length ? (
        <details className="group">
          <summary className="cursor-pointer text-xs font-bold text-[var(--app-text-muted)] hover:text-brand-700">
            {bt('businesses.verification.seeValidated', { count: complete.length })}
          </summary>
          <ul className="mt-2 grid gap-1.5">
            {complete.map((item) => (
              <li
                key={item.key}
                className="flex items-center gap-2 text-sm text-[var(--app-text-muted)]"
              >
                <FiCheckCircle className="shrink-0 text-emerald-600" />
                {resolveLabel(item)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  )
}
