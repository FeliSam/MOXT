import { FiMessageSquare } from 'react-icons/fi'
import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { openConversationWithContact } from './communicationSlice'
import { buildRelatedSnapshot } from './relatedSnapshot'
import { resolveContactProfileFromEntity } from './conversationDisplay'

export function ContactButton({
  className = '',
  ownerId,
  relatedEntity,
  relatedId,
  relatedPath,
  relatedTitle,
  relatedType,
  variant = 'primary',
  onContact,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [loading, setLoading] = useState(false)
  const pendingRef = useRef(false)

  if (!ownerId || ownerId === user.id) return null

  async function handleContact() {
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    onContact?.()
    const relatedSnapshot = buildRelatedSnapshot(relatedType, relatedEntity, {
      id: relatedId,
      title: relatedTitle,
      path: relatedPath,
    })
    const contactProfile = resolveContactProfileFromEntity(relatedEntity)
    try {
      const conversation = await dispatch(
        openConversationWithContact({
          ownerId,
          createdBy: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          relatedType,
          relatedId,
          relatedPath,
          relatedSnapshot,
          contactProfile,
        }),
      ).unwrap()
      navigate(`/messages?conversation=${conversation.id}`)
    } catch {
      navigate('/messages')
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  return (
    <Button
      className={className}
      disabled={loading}
      icon={FiMessageSquare}
      variant={variant}
      onClick={handleContact}
    >
      {loading ? 'Ouverture…' : 'Contacter'}
    </Button>
  )
}
