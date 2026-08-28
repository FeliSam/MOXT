import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiSend, FiTrash2, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { EntityVerifiedName } from '../../components/ui/EntityVerifiedName'
import { LinkifiedText } from '../../components/ui/LinkifiedText'
import { useLanguage } from '../../contexts/useLanguage'
import { useGuestAction } from '../guest/useGuestAction'
import { phase3Text } from '../../i18n/phase3I18n'
import { addListingComment, deleteListingComment } from '../marketplace/marketplaceSlice'
import { addComment, deleteComment } from '../posts/postsSlice'

function personDisplayName(person, fallback = 'MOXT') {
  if (!person) return fallback
  const fromParts = `${person.firstName || ''} ${person.lastName || ''}`.trim()
  if (fromParts) return fromParts
  const raw = String(person.name || person.fullName || person.authorName || '').trim()
  if (raw && !raw.includes('@')) return raw
  return fallback
}

function commentDisplayName(comment, currentUser, fallback) {
  if (currentUser?.id && comment.authorId === currentUser.id) {
    return personDisplayName(currentUser, fallback)
  }
  return personDisplayName(
    { firstName: '', lastName: '', name: comment.authorName, authorName: comment.authorName },
    fallback,
  )
}

export function FeedCommentsSheet({ kind, entityId, open, onClose }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((state) => state.auth.user)
  const entity = useSelector((state) => {
    if (!entityId) return null
    if (kind === 'listing') {
      return (state.marketplace?.items || []).find((item) => item.id === entityId) || null
    }
    if (kind === 'post') {
      return (state.posts?.items || []).find((item) => item.id === entityId) || null
    }
    return null
  })
  const isModerator = Boolean(user?.role === 'admin' || user?.role === 'moderator')
  const { requireAccount, promptAccount } = useGuestAction()
  const [text, setText] = useState('')
  const [closing, setClosing] = useState(false)
  const memberFallback = p3('common.memberMoxt')
  const selfName = useMemo(() => personDisplayName(user, memberFallback), [user, memberFallback])

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear composer when sheet opens
      setText('')
    }
  }, [open, entityId])

  function requestClose() {
    setClosing(true)
    setTimeout(() => {
      onClose()
      setClosing(false)
    }, 220)
  }

  function submitComment(event) {
    event.preventDefault()
    if (!user?.id) {
      if (requireAccount(p3('videos.feed.guestComment'))) return
      promptAccount(p3('videos.feed.guestComment'))
      return
    }
    const trimmed = text.trim()
    if (!trimmed || !entityId) return
    const author = {
      authorId: user.id,
      authorName: personDisplayName(user, memberFallback),
      authorAvatarUrl: user.avatarUrl || '',
      text: trimmed,
    }
    if (kind === 'listing') {
      dispatch(addListingComment({ listingId: entityId, ...author }))
    } else if (kind === 'post') {
      dispatch(addComment({ postId: entityId, ...author }))
    }
    setText('')
  }

  function removeComment(commentId) {
    if (kind === 'listing') {
      dispatch(deleteListingComment({ listingId: entityId, commentId }))
      return
    }
    dispatch(deleteComment({ postId: entityId, commentId }))
  }

  if (!open && !closing) return null

  const comments = entity?.comments || []

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)]">
      <button
        type="button"
        aria-label={p3('videos.feed.closeComments')}
        onClick={requestClose}
        className={`absolute inset-0 bg-black/55 ${
          closing ? 'animate-[fadeOut_200ms_ease-in_forwards]' : 'animate-[fadeIn_200ms_ease-out_forwards]'
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-[72dvh] flex-col rounded-t-[1.4rem] border border-b-0 border-white/10 bg-[#121212] text-white shadow-[var(--shadow-card)] ${
          closing ? 'drawer-leave' : 'drawer-enter'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        role="dialog"
        aria-modal="true"
        aria-label={p3('videos.feed.commentsTitle')}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full bg-white/25" />
        </div>
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-1">
          <div>
            <p className="text-sm font-black">{p3('videos.feed.commentsTitle')}</p>
            <p className="text-xs text-white/55">
              {p3('videos.feed.commentsCount', { count: comments.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white"
            aria-label={p3('videos.feed.closeComments')}
          >
            <FiX />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {comments.length ? (
            <ul className="grid gap-3.5" aria-label={p3('videos.feed.commentsList')}>
              {comments.map((comment) => {
                const displayName = commentDisplayName(comment, user, memberFallback)
                const initial = (displayName || '?').charAt(0).toUpperCase()
                return (
                  <li key={comment.id} className="flex items-start gap-3">
                    <Link
                      to={`/users/${comment.authorId}/publications`}
                      className="shrink-0 pt-0.5 transition hover:opacity-90"
                    >
                      {comment.authorAvatarUrl ? (
                        <img
                          src={comment.authorAvatarUrl}
                          alt=""
                          className="size-9 rounded-full object-cover ring-1 ring-white/15"
                        />
                      ) : (
                        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-white/20 to-white/5 text-xs font-black ring-1 ring-white/15">
                          {initial}
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1 rounded-[1.15rem] bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-inset ring-white/10">
                      <Link
                        to={`/users/${comment.authorId}/publications`}
                        className="inline-flex max-w-full items-center hover:opacity-90"
                      >
                        <EntityVerifiedName
                          as="p"
                          name={displayName}
                          userId={comment.authorId}
                          className="truncate text-[13px] font-black tracking-tight text-white"
                        />
                      </Link>
                      <LinkifiedText
                        as="p"
                        text={comment.text}
                        preserveWhitespace="pre-line"
                        className="mt-1 min-w-0 max-w-full text-[13px] leading-snug text-white/88 [overflow-wrap:anywhere]"
                      />
                    </div>
                    {(user?.id === comment.authorId || user?.id === entity?.ownerId || isModerator) &&
                    comment.id ? (
                      <button
                        type="button"
                        onClick={() => removeComment(comment.id)}
                        aria-label={p3('videos.feed.deleteComment')}
                        className="mt-1.5 grid size-8 shrink-0 place-items-center rounded-full text-white/35 transition hover:bg-white/10 hover:text-red-400"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="py-12 text-center text-sm text-white/50">{p3('videos.feed.commentsEmpty')}</p>
          )}
        </div>

        <form
          onSubmit={submitComment}
          className="flex items-center gap-2.5 border-t border-white/10 px-4 py-3"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/15"
            />
          ) : (
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-black ring-1 ring-white/15">
              {(selfName || '?').charAt(0).toUpperCase()}
            </span>
          )}
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={p3('videos.feed.commentPlaceholder')}
            maxLength={500}
            className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/[0.07] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="grid size-10 place-items-center rounded-full bg-white text-black transition active:scale-95 disabled:opacity-40"
            aria-label={p3('videos.feed.sendComment')}
          >
            <FiSend />
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
