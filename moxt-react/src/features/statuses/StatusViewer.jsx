import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronLeft, FiChevronRight, FiEye, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { deleteStatus, markStatusViewed, reactToStatus } from './statusesSlice'
import { openConversationWithContact } from '../communications/communicationSlice'
import { addToast } from '../ui/uiSlice'
import { useLanguage } from '../../contexts/useLanguage'

const IMAGE_DURATION_MS = 4500
const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👏', '🔥']

function timeAgo(iso, t) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return t('status.viewer.justNow')
  if (hours < 24) return t('status.viewer.hoursAgo', { count: hours })
  return t('status.viewer.daysAgo', { count: Math.floor(hours / 24) })
}

/**
 * Lecteur plein écran des statuts d'un auteur, avec navigation vers l'auteur
 * suivant/précédent quand on atteint la fin/le début (comportement story classique).
 */
export function StatusViewer({ groups, initialGroupIndex, onClose }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const viewer = useSelector((s) => s.auth.user)
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex)
  const [pageIndex, setPageIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [viewersOpen, setViewersOpen] = useState(false)
  const [sentReaction, setSentReaction] = useState(null)
  const timerRef = useRef(null)

  const group = groups[groupIndex]

  const pages = useMemo(() => {
    if (!group) return []
    return group.items.flatMap((item) =>
      (item.images.length ? item.images : [null]).map((url, i) => ({
        statusId: item.id,
        url,
        caption: i === 0 ? item.caption : '',
        createdAt: item.createdAt,
      })),
    )
  }, [group])

  const page = pages[pageIndex]
  const isMine = group?.authorId === viewer?.id

  useEffect(() => {
    setPageIndex(0)
    setViewersOpen(false)
    setSentReaction(null)
  }, [groupIndex])

  useEffect(() => {
    if (!page || !viewer?.id) return
    dispatch(
      markStatusViewed({
        statusId: page.statusId,
        userId: viewer.id,
        userName: `${viewer.firstName || ''} ${viewer.lastName || ''}`.trim(),
        userAvatarUrl: viewer.avatarUrl || null,
      }),
    )
  }, [page?.statusId, viewer?.id, dispatch])

  function goNextGroup() {
    if (groupIndex < groups.length - 1) setGroupIndex((i) => i + 1)
    else onClose()
  }

  function goPrevGroup() {
    if (groupIndex > 0) {
      setGroupIndex((i) => i - 1)
    }
  }

  function goNextPage() {
    if (pageIndex < pages.length - 1) setPageIndex((i) => i + 1)
    else goNextGroup()
  }

  function goPrevPage() {
    if (pageIndex > 0) setPageIndex((i) => i - 1)
    else goPrevGroup()
  }

  useEffect(() => {
    if (paused || !pages.length) return undefined
    timerRef.current = window.setTimeout(goNextPage, IMAGE_DURATION_MS)
    return () => window.clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, groupIndex, paused, pages.length])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNextPage()
      if (e.key === 'ArrowLeft') goPrevPage()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, groupIndex])

  function handleDelete() {
    if (!page) return
    dispatch(deleteStatus(page.statusId))
    dispatch(addToast({ title: t('status.viewer.deletedTitle'), tone: 'success' }))
    if (pages.length <= 1) onClose()
    else goNextPage()
  }

  async function handleReact(emoji) {
    if (!page || !viewer?.id || isMine) return
    dispatch(reactToStatus({ statusId: page.statusId, userId: viewer.id, emoji }))
    setSentReaction(emoji)
    try {
      await dispatch(
        openConversationWithContact({
          ownerId: group.authorId,
          createdBy: viewer.id,
          senderName: `${viewer.firstName} ${viewer.lastName}`,
          initialMessage: emoji,
        }),
      ).unwrap()
    } catch {
      // Réaction déjà enregistrée localement ; l'envoi du message peut échouer silencieusement.
    }
  }

  const viewersList = group?.items
    ? Object.entries(
        group.items.reduce((acc, item) => ({ ...acc, ...(item.viewers || {}) }), {}),
      )
        .map(([id, info]) => ({ id, ...info }))
        .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
    : []

  if (!group || !page) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-black" role="dialog" aria-modal="true">
      {/* Barres de progression */}
      <div
        className="flex shrink-0 gap-1 p-2 sm:p-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
      >

        {pages.map((p, i) => (
          <div key={`${p.statusId}-${i}`} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full bg-white transition-[width] ease-linear"
              style={{
                width: i < pageIndex ? '100%' : i > pageIndex ? '0%' : undefined,
                animation: i === pageIndex && !paused ? `status-progress ${IMAGE_DURATION_MS}ms linear forwards` : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* En-tête auteur */}
      <div className="flex shrink-0 items-center gap-3 px-3 pb-2 sm:px-4">
        {group.authorAvatarUrl ? (
          <img src={group.authorAvatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-black text-white">
            {group.authorName?.charAt(0)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{group.authorName}</p>
          <p className="text-xs text-white/60">{timeAgo(page.createdAt, t)}</p>
        </div>
        {isMine ? (
          <button
            type="button"
            onClick={() => setViewersOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <FiEye className="text-sm" /> {viewersList.length}
          </button>
        ) : null}
        {isMine ? (
          <button
            type="button"
            onClick={handleDelete}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            {t('status.viewer.delete')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('status.viewer.close')}
          className="grid size-9 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10"
        >
          <FiX className="text-lg" />
        </button>
      </div>

      {/* Contenu */}
      <div
        className="relative min-h-0 flex-1"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {page.url ? (
          <img src={page.url} alt="" className="mx-auto size-full max-w-2xl object-contain" />
        ) : null}

        {page.caption ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto max-w-xl px-6 text-center text-sm font-semibold text-white drop-shadow-lg sm:text-base">
            {page.caption}
          </p>
        ) : null}

        <button
          type="button"
          onClick={goPrevPage}
          aria-label={t('status.viewer.previous')}
          className="absolute inset-y-0 left-0 flex w-1/3 items-center justify-start pl-2 text-white/0 transition hover:text-white/70 sm:pl-4"
        >
          <FiChevronLeft className="text-3xl drop-shadow" />
        </button>
        <button
          type="button"
          onClick={goNextPage}
          aria-label={t('status.viewer.next')}
          className="absolute inset-y-0 right-0 flex w-1/3 items-center justify-end pr-2 text-white/0 transition hover:text-white/70 sm:pr-4"
        >
          <FiChevronRight className="text-3xl drop-shadow" />
        </button>
      </div>

      {!isMine ? (
        <div
          className="shrink-0 px-3 sm:px-4"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mb-2.5 flex items-center justify-center gap-1.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className={`grid size-10 place-items-center rounded-full text-xl transition ${
                  sentReaction === emoji
                    ? 'scale-110 bg-white/25'
                    : 'bg-white/10 hover:scale-110 hover:bg-white/20'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <Link
            to="/messages"
            onClick={onClose}
            className="block rounded-2xl border border-white/25 bg-white/10 py-3 text-center text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            {t('status.viewer.reply')}
          </Link>
        </div>
      ) : null}

      {viewersOpen ? (
        <div
          className="fixed inset-0 z-10 flex items-end justify-center bg-black/60"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewersOpen(false)
          }}
        >
          <div
            className="max-h-[70dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[var(--app-surface)] p-5"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-black">
                {t('status.viewer.viewersTitle', { count: viewersList.length })}
              </h3>
              <button
                type="button"
                onClick={() => setViewersOpen(false)}
                aria-label={t('status.viewer.close')}
                className="grid size-8 place-items-center rounded-full text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)]"
              >
                <FiX />
              </button>
            </div>
            {viewersList.length ? (
              <ul className="grid gap-3">
                {viewersList.map((v) => (
                  <li key={v.id} className="flex items-center gap-3">
                    {v.avatarUrl ? (
                      <img src={v.avatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-black text-white">
                        {v.name?.charAt(0) || '?'}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">
                      {v.name || t('status.viewer.someone')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--app-text-muted)]">{t('status.viewer.noViewers')}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
