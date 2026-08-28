import { useLanguage } from '../../contexts/useLanguage'

export function TransferAmountDualFields({
  currencyFrom,
  currencyTo,
  sendValue,
  receiveValue,
  onSendChange,
  onReceiveChange,
  sendError,
  sendMin,
}) {
  const { t } = useLanguage()

  return (
    <div className="grid gap-3">
      <CurrencyAmountField
        id="transfer-amount-send"
        label={t('transfers.new.amountToSend', { currency: currencyFrom })}
        currency={currencyFrom}
        value={sendValue}
        min={sendMin}
        onChange={onSendChange}
        error={sendError}
      />
      <CurrencyAmountField
        id="transfer-amount-receive"
        accent
        label={t('transfers.new.amountToReceive', { currency: currencyTo })}
        currency={currencyTo}
        value={receiveValue}
        onChange={onReceiveChange}
      />
    </div>
  )
}

function CurrencyAmountField({
  accent = false,
  currency,
  error,
  id,
  label,
  min,
  onChange,
  value,
}) {
  return (
    <label
      htmlFor={id}
      className={`min-w-0 overflow-hidden rounded-[0.95rem] px-3 py-2.5 sm:px-3.5 sm:py-3 ${
        accent
          ? 'bg-[color-mix(in_srgb,var(--app-teal)_12%,var(--app-surface))] text-[var(--app-text)] ring-1 ring-[color-mix(in_srgb,var(--app-teal)_28%,transparent)]'
          : error
            ? 'bg-[var(--app-surface)] text-[var(--app-text)] ring-1 ring-red-400'
            : 'bg-[var(--app-surface)] text-[var(--app-text)] ring-1 ring-[var(--app-border)]'
      }`}
    >
      <span
        className={`block truncate text-[11px] font-bold uppercase tracking-[0.06em] ${
          accent ? 'text-[var(--app-teal)]' : 'text-[var(--app-text-muted)]'
        }`}
      >
        {label}
      </span>
      <span className="mt-1.5 flex min-w-0 items-center gap-2">
        <input
          id={id}
          className="min-w-0 flex-1 bg-transparent text-[1.25rem] font-extrabold leading-none tracking-tight outline-none sm:text-[1.4rem]"
          type="number"
          min={min ?? 0}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide sm:px-2.5 ${
            accent
              ? 'bg-[color-mix(in_srgb,var(--app-teal)_18%,var(--app-surface))] text-[var(--app-teal)]'
              : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
          }`}
        >
          {currency}
        </span>
      </span>
      {error ? <span className="mt-1.5 block text-xs font-semibold text-red-500">{error}</span> : null}
    </label>
  )
}
