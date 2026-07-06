import { FiMessageSquare } from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { createConversation, normalizeConversation } from './communicationSlice'

function findRelatedConversation(conversations, { relatedType, relatedId, participantIds }) {
  return conversations.find((item) => {
    const normalized = normalizeConversation(item)
    return (
      normalized.relatedType === relatedType &&
      normalized.relatedId === relatedId &&
      participantIds.every((id) => normalized.participantIds.includes(id))
    )
  })
}

export function ContactButton({
  className = '',
  ownerId,
  relatedId,
  relatedPath,
  relatedTitle,
  relatedType,
  variant = 'primary',
  onContact,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const store = useStore()
  const user = useSelector((state) => state.auth.user)

  if (!ownerId || ownerId === user.id) return null

  function handleContact() {
    onContact?.()
    const participantIds = [user.id, ownerId]
    const lookup = { relatedType, relatedId, participantIds }
    let conversation = findRelatedConversation(store.getState().communications.conversations, lookup)

    if (!conversation) {
      dispatch(
        createConversation({
          title: relatedTitle,
          participantIds,
          createdBy: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          relatedType,
          relatedId,
          relatedPath,
        }),
      )
      conversation = findRelatedConversation(store.getState().communications.conversations, lookup)
    }

    if (conversation) {
      navigate(`/messages?conversation=${conversation.id}`)
    } else {
      navigate(`/messages?relatedType=${relatedType}&relatedId=${relatedId}`)
    }
  }

  return (
    <Button className={className} icon={FiMessageSquare} variant={variant} onClick={handleContact}>
      Contacter
    </Button>
  )
}
