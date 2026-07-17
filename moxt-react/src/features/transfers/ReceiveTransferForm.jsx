import { useLanguage } from '../../contexts/useLanguage'
import { RECEIVE_METHODS } from './transferReceiveValidation'

export function ReceiveTransferForm({
  values,
  errors = {},
  onChange,
  onSubmit,
  submitting = false,
  submitLabel,
}) {
  const { t } = useLanguage()
  const resolvedSubmitLabel = submitLabel || t('transfers.receive.confirm')

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      noValidate
    >
      <label className="grid gap-1 text-sm">
        <span className="font-bold">{t('transfers.receive.amountLabel')}</span>
        <input
          type="text"
          inputMode="decimal"
          className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3"
          value={values.receivedAmount}
          onChange={(e) => onChange('receivedAmount', e.target.value)}
          placeholder={t('transfers.receive.amountPlaceholder')}
          disabled={submitting}
        />
        {errors.receivedAmount ? (
          <span className="text-xs text-red-600">{errors.receivedAmount}</span>
        ) : null}
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-bold">{t('transfers.receive.methodLabel')}</span>
        <select
          className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3"
          value={values.receivedMethod}
          onChange={(e) => onChange('receivedMethod', e.target.value)}
          disabled={submitting}
        >
          {RECEIVE_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {t(m.labelKey)}
            </option>
          ))}
        </select>
        {errors.receivedMethod ? (
          <span className="text-xs text-red-600">{errors.receivedMethod}</span>
        ) : null}
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-bold">{t('transfers.receive.proofLabel')}</span>
        <input
          type="file"
          accept="image/*,.pdf"
          className="text-sm"
          disabled={submitting}
          onChange={(e) => onChange('proofFile', e.target.files?.[0] || null)}
        />
        {values.proofFile ? (
          <span className="text-xs text-[var(--app-text-muted)]">{values.proofFile.name}</span>
        ) : null}
        {errors.proofFile ? <span className="text-xs text-red-600">{errors.proofFile}</span> : null}
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {submitting ? t('transfers.receive.saving') : resolvedSubmitLabel}
      </button>
    </form>
  )
}
