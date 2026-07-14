import { useState } from 'react'
import { FiEdit2, FiMessageCircle, FiMoreHorizontal, FiShare2, FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FavoriteButton } from './FavoriteButton'
import { CountBounce } from './CountBounce'
import { addComment, deleteComment, deletePost, toggleLike, updatePost } from '../../features/posts/postsSlice'
import { SOURCE_TYPE_LABELS } from '../../features/posts/postTemplates'
import { formatDate } from '../../features/transfers/transferUtils'

const TYPE_COLORS = {
  listing:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  parcel:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  event:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  job:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  free:     'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]',
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
  const user = useSelector((s) => s.auth.user)
  const isAuthor = user?.id === post.authorId

  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [editing, setEditing] = useState(false)
  const [editMessage, setEditMessage] = useState(post.message)
  const [menuOpen, setMenuOpen] = useState(false)

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
    if (window.confirm('Supprimer ce post ?')) dispatch(deletePost(post.id))
  }

  return (
    <article className="h-auto w-full overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)]">
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
            <p className="text-sm font-bold leading-tight">{post.authorName}</p>
            <p className="text-xs text-[var(--app-text-muted)]">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${typeColor}`}>
            {typeLabel}
          </span>
          {isAuthor && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Options du post"
                aria-expanded={menuOpen}
                className="grid size-8 place-items-center rounded-xl text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
              >
                <FiMoreHorizontal />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-10 min-w-36 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] py-1 shadow-xl">
                  <Link
                    to={`/news/${post.id}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--app-surface-muted)]"
                  >
                    <FiEdit2 className="text-xs" /> Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <FiTrash2 className="text-xs" /> Supprimer
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
          <p className="whitespace-pre-line text-sm leading-relaxed sm:text-[0.9375rem] sm:leading-7">
            {post.message}
          </p>
        )}
      </div>

      {/* Image — hauteur naturelle selon le contenu */}
      {post.imageUrl && !editing && (
        <div className="border-y border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/40">
          <img
            src={post.imageUrl}
            alt={post.message?.slice(0, 120) || 'Image du post'}
            className="mx-auto block h-auto w-full max-h-[min(36rem,78vh)] object-contain"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.closest('div')?.remove()
            }}
          />
        </div>
      )}

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
      </div>

      {/* Commentaires */}
      {showComments && (
        <div className="grid gap-3 border-t border-[var(--app-border)] px-4 py-3 sm:px-5 sm:py-4">
          {post.comments?.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5">
              {comment.authorAvatarUrl ? (
                <img src={comment.authorAvatarUrl} alt="" className="size-7 rounded-full object-cover shrink-0 mt-0.5" />
              ) : (
                <span className="grid size-7 place-items-center rounded-full bg-[var(--app-surface-muted)] text-xs font-black shrink-0 mt-0.5">
                  {comment.authorName?.charAt(0)}
                </span>
              )}
              <div className="flex-1 rounded-2xl bg-[var(--app-surface-muted)] px-3 py-2">
                <p className="text-xs font-bold">{comment.authorName}</p>
                <p className="text-sm mt-0.5">{comment.text}</p>
              </div>
              {(user?.id === comment.authorId || isAuthor) && (
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
