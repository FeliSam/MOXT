import { Select } from '../../components/ui/Select'
import { publishText } from '../publications/publishI18n'
import {
  parcelCurrencyLabel,
  parcelCurrencyOptions,
  resolveParcelCurrency,
} from './parcelCurrency'

export function ParcelCurrencySelect({
  id = 'parcel-currency',
  originCountryCode,
  value,
  onChange,
  error,
  t,
}) {
  const options = [...parcelCurrencyOptions(originCountryCode)]
  const selected = resolveParcelCurrency(value)
  if (selected && !options.includes(selected)) options.unshift(selected)
  const safeValue = options.includes(selected) ? selected : options[0]

  return (
    <Select
      id={id}
      label={publishText(t, 'publish.parcel.fields.currency')}
      value={safeValue}
      error={error}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((code) => (
        <option key={code} value={code}>
          {parcelCurrencyLabel(code)}
        </option>
      ))}
    </Select>
  )
}
