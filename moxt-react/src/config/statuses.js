import {
  STATUS_META as SHARED_STATUS_META,
  statusMeta as sharedStatusMeta,
} from '@moxt/shared/config/statuses.js'
import { STATUS_LABEL_KEYS, sharedText } from '../i18n/sharedI18n'

export const STATUS_META = Object.fromEntries(
  Object.entries(SHARED_STATUS_META).map(([status, meta]) => [
    status,
    {
      ...meta,
      labelKey: STATUS_LABEL_KEYS[status],
    },
  ]),
)

/** @param {string} status @param {(key: string, vars?: object) => string} [t] */
export function statusMeta(status, t) {
  const meta = STATUS_META[status] || sharedStatusMeta(status)
  if (t && meta.labelKey) {
    return { ...meta, label: sharedText(t, meta.labelKey) }
  }
  return meta
}

/** Resolve display label for a status code. */
export function statusLabel(t, status) {
  const meta = statusMeta(status, t)
  return meta.label
}
