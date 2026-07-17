/**
 * Resolve a nav item/group label: prefer labelKey via t(), else FR→DOM translateLabel.
 * @param {{ label?: string, labelKey?: string } | string} entry
 * @param {(key: string, vars?: object) => string} [t]
 * @param {(label: string) => string} [translateLabel]
 */
export function resolveNavLabel(entry, t, translateLabel) {
  const labelKey = typeof entry === 'object' && entry ? entry.labelKey : null
  const label = typeof entry === 'object' && entry ? entry.label : entry
  if (labelKey && typeof t === 'function') {
    const translated = t(labelKey)
    if (translated && translated !== labelKey) return translated
  }
  if (typeof translateLabel === 'function' && label != null && label !== '') {
    return translateLabel(label)
  }
  return label || ''
}
