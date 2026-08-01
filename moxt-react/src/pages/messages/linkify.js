/** Split plain text into text / URL parts for safe link rendering. */
export function linkifyParts(text) {
  const source = String(text || '')
  if (!source) return []
  const pattern =
    /(https?:\/\/[^\s<]+[^\s<.,;:!?"')\]]|www\.[^\s<]+[^\s<.,;:!?"')\]])/gi
  const parts = []
  let lastIndex = 0
  let match
  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: source.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    const href = raw.startsWith('http') ? raw : `https://${raw}`
    parts.push({ type: 'link', value: raw, href })
    lastIndex = match.index + raw.length
  }
  if (lastIndex < source.length) {
    parts.push({ type: 'text', value: source.slice(lastIndex) })
  }
  return parts.length ? parts : [{ type: 'text', value: source }]
}
