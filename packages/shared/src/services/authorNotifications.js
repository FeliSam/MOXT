/**
 * Notifications à l'auteur, mêmes textes et RPC que notificationTriggers.js
 * (moxt_create_notification). Pas de notification à soi-même.
 */

function fill(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (vars[key] == null ? '' : String(vars[key])))
}

export const AUTHOR_NOTICE_COPY = {
  someone: 'Un membre',
  likeTitle: 'Nouveau j aime',
  likeBody: '{name} a aimé votre publication.',
  commentTitle: 'Nouveau commentaire',
  commentBody: '{name} : « {text} »',
  subscriptionTitle: 'Nouvel abonné',
  subscriptionBody: "{name} s'est abonné à vos publications.",
}

/** @param {string} [postId] @returns {string} */
export function newsPostPath(postId) {
  return postId ? `/news/${encodeURIComponent(postId)}` : '/news'
}

function createNoticeId() {
  const suffix =
    globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return `NTF-${suffix.toUpperCase()}`
}

/**
 * Construit la notification (ou null si destinataire absent ou identique à l'acteur).
 * @param {{ kind: 'like'|'comment'|'subscription', recipientId?: string|null, actorId?: string, actorName?: string, text?: string, link?: string|null, copy?: typeof AUTHOR_NOTICE_COPY }} input
 */
export function buildAuthorNotice({
  kind,
  recipientId,
  actorId,
  actorName,
  text,
  link,
  copy = AUTHOR_NOTICE_COPY,
}) {
  if (!recipientId || (actorId && recipientId === actorId)) return null
  const name = String(actorName || '').trim() || copy.someone
  if (kind === 'like') {
    return {
      id: createNoticeId(),
      userId: recipientId,
      title: copy.likeTitle,
      message: fill(copy.likeBody, { name }),
      type: 'post',
      link: link || null,
      priority: 'high',
    }
  }
  if (kind === 'comment') {
    return {
      id: createNoticeId(),
      userId: recipientId,
      title: copy.commentTitle,
      message: fill(copy.commentBody, { name, text: String(text || '').slice(0, 100) }),
      type: 'post',
      link: link || null,
      priority: 'high',
    }
  }
  if (kind === 'subscription') {
    return {
      id: createNoticeId(),
      userId: recipientId,
      title: copy.subscriptionTitle,
      message: fill(copy.subscriptionBody, { name }),
      type: 'subscription',
      link: link || '/publications/mine?panel=subscriptions&sub=subscribers',
      priority: 'high',
    }
  }
  return null
}

/** Même RPC que communications/addNotification (security definer, contourne le RLS). */
export async function createAuthorNotification(client, notice) {
  if (!client || !notice?.userId) return null
  const { error } = await client.rpc('moxt_create_notification', {
    p_id: notice.id,
    p_user_id: notice.userId,
    p_title: notice.title,
    p_message: notice.message,
    p_type: notice.type || 'system',
    p_link: notice.link || null,
    p_priority: notice.priority || 'normal',
  })
  if (error) throw error
  return notice
}
