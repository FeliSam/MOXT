/**
 * Official / commonly used TLDs for bare-domain detection (without protocol).
 * Grouped: generic, tech, geo, country codes, new gTLDs.
 */
const OFFICIAL_TLDS = [
  'com', 'ru', 'xyz', 'online', 'app', 'net', 'org', 'io', 'dev', 'ai', 'co', 'me', 'info', 'biz',
  'site', 'store', 'shop', 'tech', 'cloud', 'pro', 'live', 'world', 'space', 'link', 'top', 'club',
  'vip', 'work', 'blog', 'news', 'media', 'page', 'website', 'email', 'today', 'group', 'team',
  'digital', 'finance', 'money', 'health', 'care', 'game', 'games', 'video', 'photo', 'music', 'art',
  'design', 'studio', 'agency', 'academy', 'education', 'school', 'travel', 'hotel', 'food', 'fashion',
  'beauty', 'auto', 'homes', 'house', 'land', 'rent', 'property', 'law', 'legal', 'tax', 'coach',
  'events', 'wiki', 'help', 'tools', 'software', 'social', 'community', 'chat', 'mail', 'host',
  'network', 'services', 'support', 'systems', 'solutions', 'consulting', 'marketing', 'company',
  'center', 'global', 'international', 'zone', 'watch', 'market', 'sale', 'buy', 'click', 'fun',
  'life', 'love', 'family', 'city', 'town', 'place', 'earth', 'green', 'eco', 'energy', 'science',
  'research', 'data', 'mobile', 'web', 'download', 'stream', 'tv', 'fm', 'am', 'mobi', 'tel', 'asia',
  'cat', 'jobs',
  // Country codes
  'fr', 'de', 'uk', 'us', 'eu', 'cn', 'jp', 'br', 'in', 'au', 'ca', 'es', 'it', 'nl', 'pl', 'pt',
  'ch', 'at', 'be', 'se', 'no', 'fi', 'dk', 'cz', 'sk', 'hu', 'ro', 'bg', 'gr', 'tr', 'ua', 'kz',
  'by', 'su', 'il', 'ae', 'sa', 'kr', 'tw', 'hk', 'sg', 'my', 'th', 'vn', 'id', 'ph', 'nz', 'za',
  'mx', 'ar', 'cl', 'pe', 've', 'eg', 'ng', 'ke', 'ma', 'tn', 'dz', 'ir', 'pk', 'bd', 'lk',
  // Russia regional
  'moscow', 'spb',
]

const SECOND_LEVEL_TLDS = [
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
  'com.br', 'com.au', 'co.jp', 'co.kr', 'co.nz', 'co.za', 'co.in', 'com.mx', 'com.ar', 'com.tr',
  'com.ua', 'com.ru', 'net.ru', 'org.ru', 'pp.ru',
]

const DOMAIN_LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?'
const TRAIL_EXCLUDE = '[^\\s<.,;:!?"\'\\)\\]]'
const OPTIONAL_PATH = `(?:\\/${TRAIL_EXCLUDE}*)?`
const TLD_GROUP = [...new Set(OFFICIAL_TLDS)].join('|')
const MULTI_TLD_GROUP = SECOND_LEVEL_TLDS.map((t) => t.replace(/\./g, '\\.')).join('|')

/** @type {RegExp} */
const LINK_PATTERN = new RegExp(
  [
    `https?:\\/\\/[^\\s<]+${TRAIL_EXCLUDE}`,
    `www\\.[^\\s<]+${TRAIL_EXCLUDE}`,
    `(?<![@.])(?<![:/])\\b(?:${DOMAIN_LABEL}\\.)+(?:${MULTI_TLD_GROUP}|${TLD_GROUP})\\b${OPTIONAL_PATH}`,
  ].join('|'),
  'gi',
)

function trimTrailingPunctuation(value) {
  return value.replace(/[.,;:!?"')\]]+$/, '')
}

function normalizeHref(raw) {
  const trimmed = trimTrailingPunctuation(raw)
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** Split plain text into text / URL parts for safe link rendering. */
export function linkifyParts(text) {
  const source = String(text || '')
  if (!source) return []

  const parts = []
  let lastIndex = 0
  let match

  LINK_PATTERN.lastIndex = 0
  while ((match = LINK_PATTERN.exec(source)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: source.slice(lastIndex, match.index) })
    }
    const raw = trimTrailingPunctuation(match[0])
    if (raw) {
      parts.push({ type: 'link', value: raw, href: normalizeHref(raw) })
      lastIndex = match.index + match[0].length
    } else {
      LINK_PATTERN.lastIndex = match.index + 1
    }
  }

  if (lastIndex < source.length) {
    parts.push({ type: 'text', value: source.slice(lastIndex) })
  }
  return parts.length ? parts : [{ type: 'text', value: source }]
}
