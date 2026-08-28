import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getConversationPeer } from '../../../features/communications/conversationDisplay'
import {
  contextHasMessages,
  isThreadRelatedPreview,
  normalizeRelatedContexts,
} from '../../../features/communications/conversationTimeline'
import { resolveRelatedSnapshot } from '../../../features/communications/relatedSnapshot'

/** Données peer / contexte pour le header fil — utilisé uniquement par MessagesPage. */
export function useConversationHeaderModel(active, userId, avatarMap) {
  const peer = useMemo(
    () => (active ? getConversationPeer(active, userId) : null),
    [active, userId],
  )
  const peerOnline = useSelector((state) =>
    peer?.id ? Boolean(state.presence.online[peer.id]) : false,
  )
  const relatedPreview = useSelector((state) =>
    active ? resolveRelatedSnapshot(state, active) : null,
  )
  const liveEntry = peer?.id ? avatarMap[peer.id] : undefined
  const peerAvatarSrc =
    liveEntry !== undefined ? liveEntry.avatarUrl || null : peer?.avatarUrl || null

  const showRelatedContext = useMemo(() => {
    if (!active) return false
    const contexts = normalizeRelatedContexts(active)
    const latestContext = contexts.length
      ? contexts.slice().sort((a, b) => new Date(a.introducedAt) - new Date(b.introducedAt)).at(-1)
      : null
    return (
      isThreadRelatedPreview(relatedPreview) &&
      (latestContext ? contextHasMessages(latestContext, active) : active.messages?.length > 0)
    )
  }, [active, relatedPreview])

  return {
    peer,
    peerOnline,
    peerAvatarSrc,
    relatedPreview,
    showRelatedContext,
    pinned: Boolean(active?.pinnedBy?.includes(userId)),
    muted: Boolean(active?.mutedBy?.includes(userId)),
  }
}
