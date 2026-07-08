import { FiMessageSquare } from 'react-icons/fi'
import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useActionBurst } from '../../components/ui/ActionBurst'
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
  relatedSnapshot: relatedSnapshotOverride,
  contactProfile: contactProfileOverride,
  initialMessage,
  children,
  showIcon = true,
  asLink = false,
  variant = 'primary',
  onContact,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [loading, setLoading] = useState(false)
  const pendingRef = useRef(false)
  const { trigger: triggerBurst, node: burstNode } = useActionBurst()

  if (!ownerId || ownerId === user.id) return null

  async function handleContact(event) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    if (pendingRef.current) return
    pendingRef.current = true
    setLoading(true)
    triggerBurst(event)
    onContact?.()
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
          senderName: `${user.firstName} ${user.lastName}`,
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
    } catch {
      navigate('/messages')
    } finally {
      pendingRef.current = false
      setLoading(false)
    }
  }

  if (asLink) {
    return (
      <>
        {burstNode}
        <button
          type="button"
          className={
            className ||
            'text-left font-black text-brand-700 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-800 dark:text-brand-300'
          }
          disabled={loading}
          onClick={handleContact}
        >
          {loading ? 'Ouverture…' : children || 'Contacter'}
        </button>
      </>
    )
  }

  return (
    <>
      {burstNode}
      <Button
        className={className}
        disabled={loading}
        icon={showIcon ? FiMessageSquare : undefined}
        variant={variant}
        onClick={handleContact}
      >
        {loading ? 'Ouverture…' : children || 'Contacter'}
      </Button>
    </>
  )
}
