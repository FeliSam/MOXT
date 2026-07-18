import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { deleteStatus, markStatusViewed } from './statusesSlice'
import { addToast } from '../ui/uiSlice'
import { useLanguage } from '../../contexts/useLanguage'

const IMAGE_DURATION_MS = 4500

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
  }, [groupIndex])

  useEffect(() => {
    if (!page || !viewer?.id) return
    dispatch(markStatusViewed({ statusId: page.statusId, userId: viewer.id }))
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

  if (!group || !page) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-black" role="dialog" aria-modal="true">
      {/* Barres de progression */}
      <div className="flex shrink-0 gap-1 p-2 pt-3 sm:p-3">
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
            onClick={handleDelete}
            className="rounded-full px-3 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
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
        <Link
          to="/messages"
          onClick={onClose}
          className="m-3 shrink-0 rounded-2xl border border-white/25 bg-white/10 py-3 text-center text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:m-4"
        >
          {t('status.viewer.reply')}
        </Link>
      ) : null}
    </div>,
    document.body,
  )
}
