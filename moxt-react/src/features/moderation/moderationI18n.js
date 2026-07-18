import { phase3Text } from '../../i18n/phase3I18n'

export function moderationText(t, key, vars) {
  return phase3Text(t, key, vars)
}

export function moderationOptionLabel(t, item) {
  if (item?.labelKey) return moderationText(t, item.labelKey)
  return item?.label || ''
}
