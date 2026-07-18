import { useLayoutEffect, useRef, useState } from 'react'
import {
  FiArchive,
  FiChevronDown,
  FiEdit2,
  FiMessageCircle,
  FiMoreHorizontal,
  FiShare2,
  FiStar,
  FiTrash2,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FavoriteButton } from './FavoriteButton'
import { CountBounce } from './CountBounce'
import { useLanguage } from '../../contexts/useLanguage'
import { adminText } from '../../features/admin/adminI18n'
import {
  addComment,
  deleteComment,
  deletePost,
  moderatePost,
  setPostPinned,
  toggleLike,
  updatePost,
} from '../../features/posts/postsSlice'
import { getPostImages } from '../../features/posts/postMediaUtils'
import { SOURCE_TYPE_LABELS } from '../../features/posts/postTemplates'
import { formatDate } from '../../features/transfers/transferUtils'
import { addToast } from '../../features/ui/uiSlice'
import { phase3Text } from '../../i18n/phase3I18n'
import { FeedPostImages } from './FeedPostImages'
import { EntityVerifiedName } from './EntityVerifiedName'

const TYPE_COLORS = {
  listing:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  parcel:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  event:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  job:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  free:     'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]',
}

function ExpandableFeedMessage({ text }) {
  const { t } = useLanguage()
  const p3 = (key) => phase3Text(t, key)
  const [expanded, setExpanded] = useState(false)
  const [canToggle, setCanToggle] = useState(false)
  const textRef = useRef(null)

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    if (expanded) return
    setCanToggle(el.scrollHeight > el.clientHeight + 1)
  }, [text, expanded])

  return (
    <div className="feed-post-message">
      <p
        ref={textRef}
        className={`whitespace-pre-line text-sm leading-relaxed text-[var(--app-text)] sm:text-[0.9375rem] sm:leading-7 ${
          expanded ? '' : 'line-clamp-6'
        }`}
      >
        {text}
      </p>
      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="group mt-0.5 inline-flex origin-left scale-[0.72] items-center gap-0.5 rounded px-0.5 py-px text-[10px] font-medium leading-none tracking-normal text-[var(--app-accent)] transition hover:bg-[var(--app-accent-soft)] active:scale-[0.68]"
        >
          <span>{expanded ? p3('news.seeLess') : p3('news.seeMore')}</span>
          <FiChevronDown
            aria-hidden
            className={`size-2.5 shrink-0 transition-transform duration-200 ease-out ${
              expanded ? 'rotate-180' : 'rotate-0'
            } group-hover:translate-y-px`}
          />
        </button>
      ) : null}
    </div>
  )
}

const CTA_LABELS = {
  listing:  'Voir l\'annonce',
  parcel:   'Voir le colis',
  business: 'Voir l\'entreprise',
  event:    'Voir l\'événement',
  job:      'Voir l\'offre',
  free:     null,
}

export function FeedPostCard({ post }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((s) => s.auth.user)
  const isAuthor = user?.id === post.authorId
  const isModerator =
    user?.role === 'moderator' || user?.role === 'admin' || user?.role === 'superadmin'
  const isSuperAdmin = user?.role === 'superadmin'
  const canManage = isAuthor || isModerator
  const pinned = post?.pinned === true

  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [editing, setEditing] = useState(false)
  const [editMessage, setEditMessage] = useState(post.message)
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareCount, setShareCount] = useState(post.shareCount || 0)

  const liked = post.likes?.includes(user?.id)
  const typeLabel = SOURCE_TYPE_LABELS[post.sourceType] || 'Post'
  const typeColor = TYPE_COLORS[post.sourceType] || TYPE_COLORS.free
  const ctaLabel = CTA_LABELS[post.sourceType]

  function handleLike() {
    if (!user) return
    dispatch(toggleLike({ postId: post.id, userId: user.id }))
  }

  function handleComment(e) {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    dispatch(addComment({
      postId: post.id,
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorAvatarUrl: user.avatarUrl || null,
      text: commentText.trim(),
    }))
    setCommentText('')
  }

  function handleSaveEdit() {
    if (!editMessage.trim()) return
    dispatch(updatePost({ id: post.id, message: editMessage.trim() }))
    setEditing(false)
  }

  function handleDelete() {
    if (window.confirm(p3('news.menu.deleteConfirm'))) {
      dispatch(deletePost(post.id))
    }
    setMenuOpen(false)
  }

  function handleArchive() {
    const message = isModerator
      ? adminText(t, 'admin.actions.archivePostConfirm')
      : p3('news.archiveConfirm')
    if (window.confirm(message)) {
      dispatch(moderatePost({ id: post.id, status: 'archived' }))
    }
    setMenuOpen(false)
  }

  function handleTogglePin() {
    if (!isSuperAdmin) return
    const nextPinned = !pinned
    dispatch(setPostPinned({ id: post.id, pinned: nextPinned }))
    dispatch(
      addToast({
        title: nextPinned ? p3('news.pin.toastPinnedTitle') : p3('news.pin.toastUnpinnedTitle'),
        message: nextPinned ? p3('news.pin.toastPinnedBody') : p3('news.pin.toastUnpinnedBody'),
        tone: 'success',
      }),
    )
    setMenuOpen(false)
  }

  async function handleShare() {
    const url = `${window.location.origin}/news`
    const shareData = {
      title: post.title || post.authorName || 'MOXT',
      text: (post.message || '').trim().slice(0, 200),
      url,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setShareCount((v) => v + 1)
        dispatch(
          addToast({
            title: p3('news.share.successTitle'),
            message: p3('news.share.successBody'),
            tone: 'success',
          }),
        )
        return
      }
    } catch {
      return
    }
    try {
      await navigator.clipboard?.writeText(url)
      setShareCount((v) => v + 1)
      dispatch(
        addToast({
          title: p3('news.share.copiedTitle'),
          message: p3('news.share.copiedBody'),
          tone: 'success',
        }),
      )
    } catch {
      dispatch(
        addToast({
          title: p3('common.error'),
          message: p3('news.share.errorBody'),
          tone: 'error',
        }),
      )
    }
  }

  return (
    <article className="h-auto w-full overflow-hidden rounded-3xl bg-[var(--app-surface)] shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt="" className="size-10 rounded-full object-cover shrink-0" />
          ) : (
            <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-black text-white shrink-0">
              {post.authorName?.charAt(0)}
            </span>
          )}
          <div>
            <EntityVerifiedName
              as="p"
              name={post.authorName}
              userId={post.authorId}
              className="text-sm font-bold leading-tight"
            />
            <p className="text-xs text-[var(--app-text-muted)]">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pinned ? (
            <span
              className="grid size-8 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
              title={p3('news.pinned')}
              aria-label={p3('news.pinned')}
            >
              <FiStar className="size-3.5 fill-current" aria-hidden />
            </span>
          ) : null}
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${typeColor}`}>
            {typeLabel}
          </span>
          {canManage && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={p3('news.menu.actions')}
                aria-expanded={menuOpen}
                className="grid size-8 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
              >
                <FiMoreHorizontal />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-10 min-w-40 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] py-1 shadow-xl">
                  {isAuthor ? (
                    <Link
                      to={`/news/${post.id}/edit`}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--app-surface-muted)]"
                    >
                      <FiEdit2 className="text-xs" /> {p3('news.menu.edit')}
                    </Link>
                  ) : null}
                  {isSuperAdmin ? (
                    <button
                      type="button"
                      onClick={handleTogglePin}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--app-surface-muted)]"
                    >
                      <FiStar className="text-xs" />
                      {pinned ? p3('news.menu.unpin') : p3('news.menu.pin')}
                    </button>
                  ) : null}
                  {post.status !== 'archived' ? (
                    <button
                      type="button"
                      onClick={handleArchive}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--app-surface-muted)]"
                    >
                      <FiArchive className="text-xs" /> {p3('news.menu.archive')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <FiTrash2 className="text-xs" /> {p3('news.menu.delete')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="px-4 pb-3 sm:px-5 sm:pb-4">
        {editing ? (
          <div className="grid gap-2">
            <textarea
              className="min-h-24 w-full resize-y rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm sm:min-h-28"
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              maxLength={500}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-700"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditMessage(post.message) }}
                className="rounded-xl px-4 py-1.5 text-xs font-bold text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)]"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <ExpandableFeedMessage text={post.message || ''} />
        )}
      </div>

      {!editing ? (
        <FeedPostImages
          images={getPostImages(post)}
          alt={(post.message || '').trim().slice(0, 120)}
        />
      ) : null}

      {/* CTA */}
      {ctaLabel && post.directLink && (
        <div className="px-4 py-3 sm:px-5 sm:py-4">
          <Link
            to={post.directLink}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--app-surface-muted)] px-4 py-2.5 text-sm font-bold transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
          >
            <FiShare2 className="text-xs" /> {ctaLabel}
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-[var(--app-border)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-1.5">
          <FavoriteButton
            active={liked}
            size="sm"
            variant="solid"
            className={`!size-8 !shadow-none ${
              liked
                ? '!border-transparent !bg-transparent !text-red-500'
                : '!border-transparent !bg-transparent !text-[var(--app-text-muted)] hover:!text-red-500'
            }`}
            onToggle={handleLike}
            ariaLabel={liked ? 'Retirer le like' : 'Aimer'}
          />
          <CountBounce
            value={post.likes?.length || 0}
            maxDisplay={999}
            className={`text-sm font-bold ${liked ? 'text-red-500' : 'text-[var(--app-text-muted)]'}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-bold text-[var(--app-text-muted)] transition hover:text-[var(--app-text)]"
        >
          <FiMessageCircle />
          {post.comments?.length || 0}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm font-bold text-[var(--app-text-muted)] transition hover:text-[var(--app-text)]"
          aria-label={p3('common.share')}
        >
          <FiShare2 />
          {shareCount}
        </button>
      </div>

      {/* Commentaires — 5 visibles, le reste en scroll */}
      {showComments && (
        <div className="grid gap-3 border-t border-[var(--app-border)] px-4 py-3 sm:px-5 sm:py-4">
          {(post.comments?.length || 0) > 0 ? (
            <div
              className="grid max-h-[17.5rem] gap-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]"
              role="list"
              aria-label={p3('news.commentsList')}
            >
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5" role="listitem">
                  {comment.authorAvatarUrl ? (
                    <img src={comment.authorAvatarUrl} alt="" className="size-7 rounded-full object-cover shrink-0 mt-0.5" />
                  ) : (
                    <span className="grid size-7 place-items-center rounded-full bg-[var(--app-surface-muted)] text-xs font-black shrink-0 mt-0.5">
                      {comment.authorName?.charAt(0)}
                    </span>
                  )}
                  <div className="flex-1 rounded-2xl bg-[var(--app-surface-muted)] px-3 py-2">
                    <EntityVerifiedName
                      as="p"
                      name={comment.authorName}
                      userId={comment.authorId}
                      className="text-xs font-bold"
                    />
                    <p className="text-sm mt-0.5">{comment.text}</p>
                  </div>
                  {(user?.id === comment.authorId || isAuthor || isModerator) && (
                    <button
                      type="button"
                      onClick={() => dispatch(deleteComment({ postId: post.id, commentId: comment.id }))}
                      aria-label="Supprimer le commentaire"
                      className="mt-1 text-[var(--app-text-faint)] hover:text-red-500"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {user && (
            <form onSubmit={handleComment} className="flex items-center gap-2">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="size-7 rounded-full object-cover shrink-0" />
              ) : (
                <span className="grid size-7 shrink-0 place-items-center whitespace-nowrap rounded-full bg-brand-600 text-xs font-black text-white">
                  {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
                </span>
              )}
              <input
                className="flex-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3.5 py-2 text-sm outline-none focus:border-[var(--app-accent)]"
                placeholder="Écrire un commentaire…"
                aria-label="Écrire un commentaire"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={300}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                aria-label="Envoyer le commentaire"
                className="grid size-8 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                <FiSend className="text-xs" />
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  )
}

function FiSend(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}
