const MOXT_HOST = /(^|\.)moxt(app)?\.(ru|app)$/i;

/** Pages web qu'on ouvre encore dans le navigateur (pas d'écran natif). */
const LEGAL_PREFIXES = ['/legal', '/privacy', '/faq', '/trust', '/presentation'];

export function isMoxtHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (!host) return false;
  if (MOXT_HOST.test(host)) return true;
  return host === 'localhost' || host.endsWith('.localhost');
}

export function isLegalWebPath(pathname: string) {
  return LEGAL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function queryOf(search: string) {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

function feedQuery(type: string | null, item: string | null) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (item) params.set('item', item);
  const query = params.toString();
  return query ? `/(tabs)/feed?${query}` : '/(tabs)/feed';
}

/**
 * URL moxtapp.ru, schéma `moxt://` ou chemin web → route Expo.
 * `null` : lien externe, page légale, ou chemin sans écran natif.
 */
export function resolveNativePath(raw: string | null | undefined): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;

  let pathname = '';
  let search = '';

  if (value.startsWith('moxt://')) {
    const rest = value.slice('moxt://'.length).replace(/^\/+/, '');
    const [pathPart, query] = rest.split('?');
    pathname = pathPart ? `/${pathPart}` : '/';
    search = query ? `?${query}` : '';
  } else if (value.startsWith('/')) {
    const [pathPart, query] = value.split('?');
    pathname = pathPart || '/';
    search = query ? `?${query}` : '';
  } else {
    try {
      const url = new URL(value);
      if (url.protocol === 'moxt:') {
        const host = url.hostname;
        pathname = host ? `/${host}${url.pathname === '/' ? '' : url.pathname}` : url.pathname;
        search = url.search;
      } else if (!isMoxtHost(url.hostname)) {
        return null;
      } else {
        pathname = url.pathname;
        search = url.search;
      }
    } catch {
      return null;
    }
  }

  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  pathname = pathname.replace(/\/+$/, '') || '/';
  if (isLegalWebPath(pathname)) return null;

  const share = pathname.match(/^\/share\/(user|profile|business)\/([^/]+)$/i);
  if (share?.[2]) {
    return share[1].toLowerCase() === 'business'
      ? `/organization/${share[2]}`
      : `/users/${share[2]}/publications`;
  }

  const skipped = new Set(['publish', 'mine', 'create', 'setup', 'applications', 'history', 'new', 'edit']);
  const id = (match: RegExpMatchArray) => match[1];
  const rules: [RegExp, (match: RegExpMatchArray) => string | null][] = [
    [/^\/jobs\/applications$/, () => '/jobs/applications'],
    [/^\/businesses\/setup$/, () => '/organization/setup'],
    [/^\/p2p\/([^/]+)\/edit$/, (match) => `/p2p/edit/${id(match)}`],
    [/^\/users\/([^/]+)(?:\/(?:publications|annonces))?$/, (match) => `/users/${id(match)}/publications`],
    [/^\/businesses\/([^/]+)$/, (match) => (skipped.has(id(match)) ? null : `/organization/${id(match)}`)],
    [/^\/organization\/([^/]+)$/, (match) => `/organization/${id(match)}`],
    [/^\/marketplace\/([^/]+)$/, (match) => (skipped.has(id(match)) ? null : `/listing/${id(match)}`)],
    [/^\/listing\/([^/]+)$/, (match) => (skipped.has(id(match)) ? null : `/listing/${id(match)}`)],
    [/^\/parcels\/([^/]+)$/, (match) => (skipped.has(id(match)) ? null : `/parcel/${id(match)}`)],
    [/^\/parcel\/([^/]+)$/, (match) => (id(match) === 'reserve' ? null : `/parcel/${id(match)}`)],
    [/^\/jobs\/([^/]+)$/, (match) => (skipped.has(id(match)) ? null : `/jobs/${id(match)}`)],
    [/^\/events\/([^/]+)$/, (match) => (skipped.has(id(match)) ? null : `/events/${id(match)}`)],
    [/^\/p2p\/orders\/([^/]+)$/, (match) => `/p2p/orders/${id(match)}`],
    [/^\/p2p\/([^/]+)$/, (match) => (id(match) === 'publish' ? '/p2p/publish' : `/p2p/${id(match)}`)],
    [/^\/transfers\/([^/]+)\/receive$/, (match) => `/transfer/receive/${id(match)}`],
    [/^\/invite\/([^/]+)$/, (match) => `/invite/${id(match)}`],
    [/^\/guide\/([^/]+)$/, (match) => `/guide/${id(match)}`],
    [/^\/aide\/([^/]+)$/, (match) => `/aide/${id(match)}`],
    [/^\/transfers\/([^/]+)$/, (match) => {
      if (id(match) === 'new') return '/transfer/wizard';
      if (id(match) === 'history') return '/(tabs)/transfers';
      return `/transfer/${id(match)}`;
    }],
    [/^\/transfer\/([^/]+)$/, (match) => `/transfer/${id(match)}`],
    [/^\/videos\/([^/]+)$/, (match) => (
      id(match) === 'publish'
        ? '/publish/video'
        : feedQuery('video', `video:${id(match)}`)
    )],
    [/^\/feed$/, () => feedQuery(queryOf(search).get('type'), queryOf(search).get('item') || queryOf(search).get('v'))],
    [/^\/news\/([^/]+)\/edit$/, () => '/publications/mine'],
    [/^\/news\/([^/]+)$/, (match) => `/news/${id(match)}`],
    [/^\/posts\/([^/]+)$/, (match) => `/news/${id(match)}`],
    [/^\/status(?:es)?\/([^/]+)$/, (match) => `/status/${id(match)}`],
    [/^\/messages$/, () => {
      const conversation = queryOf(search).get('conversation');
      return conversation ? `/messages/${conversation}` : '/(tabs)/messages';
    }],
    [/^\/messages\/([^/]+)$/, (match) => `/messages/${id(match)}`],
    [/^\/(?:verification|kyc)$/, () => '/kyc'],
    [/^\/settings$/, () => '/settings'],
    [/^\/marketplace$/, () => '/(tabs)/marketplace'],
    [/^\/parcels$/, () => '/(tabs)/parcels'],
    [/^\/jobs$/, () => '/jobs'],
    [/^\/events$/, () => '/events'],
    [/^\/activities$/, () => '/activities'],
    [/^\/documents$/, () => '/documents'],
    [/^\/security$/, () => '/security'],
    [/^\/addresses$/, () => '/addresses'],
    [/^\/discover$/, () => '/discover'],
    [/^\/welcome$/, () => '/welcome'],
    [/^\/forgot-password$/, () => '/forgot-password'],
    [/^\/reset-password$/, () => '/reset-password'],
    [/^\/account\/status$/, () => '/account/status'],
    [/^\/settings\/version$/, () => '/version'],
    [/^\/exchangers$/, () => '/exchangers'],
    [/^\/exchanger$/, () => '/exchanger'],
    [/^\/exchangers\/([^/]+)$/, (match) => `/exchangers/${id(match)}`],
    [/^\/professional$/, () => '/professional'],
    [/^\/guide$/, () => '/guide'],
    [/^\/aide$/, () => '/aide'],
    [/^\/videos$/, () => feedQuery('video', null)],
    [/^\/news$/, () => '/news'],
    [/^\/p2p$/, () => '/p2p'],
    [/^\/transfers$/, () => '/transfer/wizard'],
    [/^\/receipts\/([^/]+)$/, (match) => `/receipts/${id(match)}`],
    [/^\/receipts$/, () => '/receipts'],
    [/^\/admin\/guide$/, () => '/admin/guide'],
    [/^\/admin$/, () => '/admin'],
    [/^\/moderation$/, () => '/moderation'],
    [/^\/feature-matrix$/, () => '/feature-matrix'],
    [/^\/superadmin$/, () => '/superadmin'],
    [/^\/contribute$/, () => '/contribute'],
    [/^\/dashboard$/, () => '/(tabs)'],
    [/^\/profile$/, () => '/profile'],
  ];

  for (const [pattern, to] of rules) {
    const match = pathname.match(pattern);
    if (match) return to(match);
  }
  return null;
}
