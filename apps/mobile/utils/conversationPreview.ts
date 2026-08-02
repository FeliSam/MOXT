import { resolveConversationPreviewMessage } from '@moxt/shared/utils/conversationPreview.js';

import type { Conversation } from '@/store/messages';

/** List preview aligned with web conversationPreview (last message / meta). */
export function getMobileConversationPreview(
  conversation: Conversation,
  currentUserId?: string,
  labels: { youPrefix?: string; empty?: string } = {},
) {
  const youPrefix = labels.youPrefix ?? 'Vous : ';
  const empty = labels.empty ?? 'Pas de message';
  const resolved = resolveConversationPreviewMessage(conversation, currentUserId);
  if (!resolved?.text) return empty;

  const isMine =
    currentUserId != null && String(resolved.senderId) === String(currentUserId);
  if (isMine) return `${youPrefix}${resolved.text}`;

  const loaded = resolved.source === 'message' ? resolved.message : null;
  const peerName = loaded && 'senderName' in loaded ? String(loaded.senderName || '') : '';
  if (peerName) return `${peerName}: ${resolved.text}`;
  return resolved.text;
}

export function getMobileConversationPreviewAt(conversation: Conversation) {
  const resolved = resolveConversationPreviewMessage(conversation);
  return resolved?.createdAt || conversation.updatedAt;
}
