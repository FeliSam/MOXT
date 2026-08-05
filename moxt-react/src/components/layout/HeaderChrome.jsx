import {
  HEADER_ACTIONS_CLASS,
  HEADER_BRAND_CHIP_CLASS,
  HEADER_BRAND_CHIP_COMPACT_CLASS,
  HEADER_ROW_CLASS,
} from './headerLayout'

export function HeaderBrandChip({ compact = false, className = '', children }) {
  const base = compact ? HEADER_BRAND_CHIP_COMPACT_CLASS : HEADER_BRAND_CHIP_CLASS
  return <div className={`${base} ${className}`.trim()}>{children}</div>
}

export function HeaderActionsBar({ className = '', children }) {
  return <div className={`${HEADER_ACTIONS_CLASS} ${className}`.trim()}>{children}</div>
}

export function HeaderRow({ className = '', children }) {
  return <div className={`${HEADER_ROW_CLASS} ${className}`.trim()}>{children}</div>
}
