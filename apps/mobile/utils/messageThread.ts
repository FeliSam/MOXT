export type ReadReceipt = 'read' | 'delivered' | 'sent' | null;

type Readable = {
  senderId: string;
  readBy?: string[];
  deliveredTo?: string[];
};

/** messageReadStatus du web : Lu si un autre participant est dans readBy. */
export function messageReadStatus(message: Readable, userId: string): ReadReceipt {
  if (String(message.senderId) !== String(userId)) return null;
  const selfId = String(userId);
  const readers = (message.readBy || []).map(String).filter((id) => id && id !== selfId);
  if (readers.length > 0) return 'read';
  const delivered = (message.deliveredTo || []).map(String).filter((id) => id && id !== selfId);
  if (delivered.length > 0) return 'delivered';
  return 'sent';
}

export function shortTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date);
}

export function formatDateLabel(date: Date, t: (key: string) => string) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return t('messages.date.today');
  if (date.toDateString() === yesterday.toDateString()) return t('messages.date.yesterday');
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function activityText(
  t: (key: string, vars?: Record<string, string | number>) => string,
  key: string,
  vars: Record<string, string | number> | undefined,
  fallback: string,
) {
  const value = t(key, vars);
  if (!value || value === key) {
    return fallback.replace(/\{(\w+)\}/g, (_match, name: string) =>
      vars && Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : '',
    );
  }
  return value;
}

/** Même libellé que format.peerActivityLabel (web). */
export function peerActivityLabel(updatedAt: string | null | undefined, t: (key: string, vars?: Record<string, string | number>) => string) {
  if (!updatedAt) return t('messages.activity.new');
  const date = new Date(updatedAt);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime())) return t('messages.activity.new');
  if (diff < 5 * 60 * 1000) return t('messages.activity.recent');
  if (diff < 60 * 60 * 1000) {
    return t('messages.activity.seenMinutes', { minutes: Math.max(1, Math.floor(diff / 60000)) });
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.floor(diff / (60 * 60 * 1000)));
    return activityText(t, 'messages.activity.seenHours', { hours }, 'Vu il y a {hours} h');
  }
  if (date.toDateString() === new Date().toDateString()) {
    return t('messages.activity.activeToday', { time: shortTime(updatedAt) });
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return t('messages.activity.activeYesterday', { time: shortTime(updatedAt) });
  }
  return t('messages.activity.last', { time: shortTime(updatedAt) });
}

/** Chemins web des fiches liées → routes Expo. */
export function mobileContentPath(path: string) {
  return path
    .replace(/^\/parcels\/([^/?#]+)/, '/parcel/$1')
    .replace(/^\/listings\/([^/?#]+)/, '/listing/$1');
}

/** Rayons des bulles (index.css .message-bubble--sent / --received). */
export function bubbleRadii(mine: boolean, groupedPrev: boolean, groupedNext: boolean) {
  const lg = 16;
  const sm = 6;
  if (groupedPrev && groupedNext) {
    return { borderRadius: sm };
  }
  if (mine) {
    if (groupedPrev) {
      return { borderTopLeftRadius: lg, borderTopRightRadius: sm, borderBottomRightRadius: sm, borderBottomLeftRadius: lg };
    }
    if (groupedNext) {
      return { borderTopLeftRadius: lg, borderTopRightRadius: lg, borderBottomRightRadius: sm, borderBottomLeftRadius: sm };
    }
    return { borderTopLeftRadius: lg, borderTopRightRadius: lg, borderBottomRightRadius: sm, borderBottomLeftRadius: lg };
  }
  if (groupedPrev) {
    return { borderTopLeftRadius: sm, borderTopRightRadius: lg, borderBottomRightRadius: lg, borderBottomLeftRadius: sm };
  }
  if (groupedNext) {
    return { borderTopLeftRadius: lg, borderTopRightRadius: sm, borderBottomRightRadius: sm, borderBottomLeftRadius: lg };
  }
  return { borderTopLeftRadius: lg, borderTopRightRadius: lg, borderBottomRightRadius: lg, borderBottomLeftRadius: sm };
}

export function shouldGroupMessages(
  previous: { senderId: string; createdAt: string } | null,
  current: { senderId: string; createdAt: string },
  showDate: boolean,
) {
  if (!previous || showDate) return false;
  if (String(previous.senderId) !== String(current.senderId)) return false;
  return new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime() < 5 * 60 * 1000;
}

export function firstUnreadMessageIndex(
  messages: { senderId: string }[],
  userId: string,
  unreadCount: number,
) {
  if (!unreadCount || !messages?.length) return -1;
  let remaining = unreadCount;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (String(messages[index].senderId) !== String(userId)) {
      if (remaining === 1) return index;
      remaining -= 1;
    }
  }
  return -1;
}

export function isImageAttachment(attachment?: { kind?: string; type?: string; url?: string | null; urls?: string[] } | null) {
  if (!attachment || attachment.kind === 'contact') return false;
  if (Array.isArray(attachment.urls) && attachment.urls.length > 0) return true;
  if (attachment.type?.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(attachment.url || '');
}

export function attachmentImageSrcs(attachment?: { url?: string | null; urls?: string[] } | null) {
  if (!attachment) return [];
  if (Array.isArray(attachment.urls) && attachment.urls.length > 0) {
    return attachment.urls.filter(Boolean).slice(0, 4);
  }
  return attachment.url ? [attachment.url] : [];
}
