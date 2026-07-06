export function createId(prefix) {
  const suffix =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${suffix.toUpperCase()}`
}
