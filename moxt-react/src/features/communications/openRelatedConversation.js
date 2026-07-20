import { openConversationWithContact } from './communicationSlice'
import { buildRelatedSnapshot } from './relatedSnapshot'
import { resolveContactProfileFromEntity } from './conversationDisplay'

/** Ouvre (ou crée) une conversation liée à une publication, avec message initial. */
export async function openRelatedConversation({
  dispatch,
  navigate,
  user,
  ownerId,
  relatedType,
  relatedId,
  relatedPath,
  relatedEntity,
  relatedTitle,
  relatedSnapshot: relatedSnapshotOverride,
  contactProfile: contactProfileOverride,
  initialMessage,
}) {
  if (!ownerId || !user?.id || ownerId === user.id) return null

  const relatedSnapshot =
    relatedSnapshotOverride ||
    buildRelatedSnapshot(relatedType, relatedEntity, {
      id: relatedId,
      title: relatedTitle,
      path: relatedPath,
    })
  const contactProfile =
    contactProfileOverride || resolveContactProfileFromEntity(relatedEntity)

  try {
    const result = await dispatch(
      openConversationWithContact({
        ownerId,
        createdBy: user.id,
        senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        relatedType,
        relatedId,
        relatedPath,
        relatedSnapshot,
        contactProfile,
        initialMessage,
      }),
    ).unwrap()
    const params = new URLSearchParams({ conversation: result.conversation.id })
    if (result.contextAlreadyLinked && result.replyToContextId) {
      params.set('replyContext', result.replyToContextId)
    }
    navigate(`/messages?${params}`)
    return result
  } catch {
    navigate('/messages')
    return null
  }
}
