/** Traduit un lien de notification web vers une route Expo. */
export function mobileNotificationRoute(link: string | null | undefined, type?: string) {
  const raw = String(link || '').trim();
  if (type === 'message' || raw.startsWith('/messages')) {
    if (!raw) return '/(tabs)/messages';
    try {
      const url = new URL(raw, 'http://moxt.local');
      const conversation = url.searchParams.get('conversation');
      if (conversation) return `/messages/${conversation}`;
    } catch {
      // lien mal formé
    }
    return '/(tabs)/messages';
  }
  if (!raw) return null;
  const path = raw.split('?')[0];
  const rules: [RegExp, (match: RegExpMatchArray) => string | null][] = [
    [/^\/news\/([^/]+)/, () => '/(tabs)/feed'],
    [/^\/marketplace\/(?!publish)([^/]+)/, (match) => `/listing/${match[1]}`],
    [/^\/parcels\/(?!publish)([^/]+)/, (match) => `/parcel/${match[1]}`],
    [/^\/jobs\/(?!publish)([^/]+)/, (match) => `/jobs/${match[1]}`],
    [/^\/transfers\/([^/]+)/, (match) => `/transfer/${match[1]}`],
    [/^\/businesses\/([^/]+)/, (match) => `/organization/${match[1]}`],
    [/^\/users\/([^/]+)\/publications/, (match) => `/users/${match[1]}/publications`],
    [/^\/p2p\/([^/]+)/, (match) => (match[1] === 'publish' ? '/p2p/publish' : `/p2p/${match[1]}`)],
    [/^\/verification|^\/kyc/, () => '/kyc'],
    [/^\/settings/, () => '/settings'],
    [/^\/publications\/mine/, () => '/publications/mine'],
    [/^\/events/, () => '/(tabs)/feed?type=event'],
  ];
  for (const [pattern, to] of rules) {
    const match = path.match(pattern);
    if (match) return to(match);
  }
  return null;
}

export function isMessageNotification(notification: { type?: string; link?: string | null }) {
  return notification.type === 'message' || Boolean(notification.link?.startsWith('/messages'));
}
