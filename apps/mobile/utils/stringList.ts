/** Liste d’affichage : tableau, chaîne JSON, ou valeurs séparées par virgule / saut de ligne. */
export function asStringList(value: unknown): string[] {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return asStringList(JSON.parse(trimmed));
      } catch {
        // chaîne libre, découpée plus bas
      }
    }
    return trimmed.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === 'object') return asStringList(Object.values(value as Record<string, unknown>));
  return [String(value).trim()].filter(Boolean);
}
