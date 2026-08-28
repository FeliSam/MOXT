import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiArchive,
  FiCopy,
  FiEdit2,
  FiEye,
  FiFlag,
  FiLayers,
  FiPlay,
  FiRotateCcw,
  FiTrash2,
  FiTrendingUp,
  FiVolume2,
  FiVolumeX,
  FiX,
} from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useGuestAction } from '../../guest/useGuestAction'
import { useShareEntity } from '../../share/useShareEntity'
import { isActiveVideo } from '../../publications/publicationCatalogUtils'
import { BoostPublicationSheet, useStarsBoostFlow } from '../../stars/BoostPublicationSheet'
import { activeBoostForEntity } from '../../stars/publicationBoostUtils'
import { StarsInsufficientError, withStarsBoost } from '../../stars/starsBoost'
import { loadFeedBoosts } from '../../stars/starsSlice'
import { useStarsModuleEnabled } from '../../stars/useStarsModuleEnabled'
import { StarsSpendConfirm } from '../../stars/StarsSpendConfirm'
import { VideoCommentsSheet } from '../../videos/VideoCommentsSheet'
import { VideoFeedActions } from '../../videos/VideoFeedActions'
import {
  deleteVideo,
  incrementVideoShare,
  incrementVideoView,
  moderateVideo,
  toggleVideoLike,
} from '../../videos/videosSlice'
import { videoFeedPath } from '../../videos/videoUtils'
import { useCachedMediaUrl } from '../../../hooks/useCachedMediaUrl'
import { useLanguage } from '../../../contexts/useLanguage'
import { addToast } from '../../ui/uiSlice'
import { phase3Text } from '../../../i18n/phase3I18n'
import { FeedSlideShell } from '../FeedSlideShell'

function formatCount(value) {
  const n = Number(value) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

function buildAbsoluteFeedUrl(videoId) {
  if (typeof window === 'undefined') return videoFeedPath(videoId)
  return `${window.location.origin}${videoFeedPath(videoId)}`
}

function MoreActionRow({ icon: Icon, children, onClick, to, danger = false, onNavigate }) {
  const className = `flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition hover:bg-[var(--app-surface-muted)] active:scale-[0.99] ${
    danger ? 'text-rose-600 dark:text-rose-300' : 'text-[var(--app-text)]'
  }`

  const iconClass = `text-lg ${
    danger ? 'text-rose-600 dark:text-rose-300' : 'text-[var(--app-text-muted)]'
  }`

  if (to) {
    return (
      <Link to={to} onClick={onNavigate} className={className}>
        <Icon className={iconClass} aria-hidden="true" />
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className={iconClass} aria-hidden="true" />
      {children}
    </button>
  )
}

function VideoMoreSheet({
  video,
  open,
  onClose,
  isOwner,
  isActive,
  activeBoost,
  onBoost,
  starsEnabled = false,
  onArchive,
  onReactivate,
  onDelete,
}) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function requestClose() {
    setClosing(true)
    setTimeout(() => {
      onClose()
      setClosing(false)
    }, 220)
  }

  function runAndClose(action) {
    action?.()
    requestClose()
  }

  async function copyLink() {
    const url = buildAbsoluteFeedUrl(video.id)
    try {
      await navigator.clipboard?.writeText(url)
      dispatch(
        addToast({
          title: p3('videos.feed.linkCopiedTitle'),
          message: p3('videos.feed.linkCopiedBody'),
          tone: 'success',
        }),
      )
    } catch {
      dispatch(
        addToast({
          title: p3('videos.feed.linkCopyFailed'),
          tone: 'error',
        }),
      )
    }
    requestClose()
  }

  if (!open && !closing) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-modal)]">
      <button
        type="button"
        aria-label={p3('videos.feed.closeMore')}
        onClick={requestClose}
        className={`absolute inset-0 bg-slate-950/55 backdrop-blur-[1px] dark:bg-black/55 ${
          closing ? 'animate-[fadeOut_200ms_ease-in_forwards]' : 'animate-[fadeIn_200ms_ease-out_forwards]'
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[min(85vh,32rem)] overflow-y-auto rounded-t-[1.4rem] border border-b-0 border-[var(--app-border)]/80 bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--shadow-card-lg)] backdrop-blur-xl ${
          closing ? 'drawer-leave' : 'drawer-enter'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-9 rounded-full bg-[var(--app-border-md)]" />
        </div>
        <div className="flex items-center justify-between border-b border-[var(--app-border)]/70 px-4 pb-3 pt-1">
          <p className="text-sm font-black text-[var(--app-text)]">{p3('videos.feed.moreTitle')}</p>
          <button
            type="button"
            onClick={requestClose}
            className="grid size-9 place-items-center rounded-full border border-[var(--app-border)]/70 bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface)]"
            aria-label={p3('videos.feed.closeMore')}
          >
            <FiX />
          </button>
        </div>
        <div className="grid gap-1 px-3 pb-4 pt-1">
          <MoreActionRow icon={FiCopy} onClick={copyLink}>
            {p3('videos.feed.copyLink')}
          </MoreActionRow>
          {video.businessId ? (
            <MoreActionRow
              icon={FiPlay}
              to={`/businesses/${video.businessId}`}
              onNavigate={requestClose}
            >
              {p3('videos.feed.openBusiness')}
            </MoreActionRow>
          ) : null}

          {isOwner ? (
            <>
              <p className="px-3 pt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
                {p3('videos.feed.ownerSection')}
              </p>
              <MoreActionRow
                icon={FiEdit2}
                to={`/videos/${video.id}/edit`}
                onNavigate={requestClose}
              >
                {p3('publications.cards.edit')}
              </MoreActionRow>
              {isActive && starsEnabled ? (
                activeBoost ? (
                  <div className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-amber-700 dark:text-amber-200/90">
                    <FiTrendingUp className="text-lg text-amber-700 dark:text-amber-200/90" aria-hidden="true" />
                    {p3('publications.cards.boostActive')}
                  </div>
                ) : (
                  <MoreActionRow icon={FiTrendingUp} onClick={() => runAndClose(onBoost)}>
                    {p3('publications.cards.boost')}
                  </MoreActionRow>
                )
              ) : null}
              <MoreActionRow
                icon={FiLayers}
                to="/publications/mine?scope=business&type=video"
                onNavigate={requestClose}
              >
                {p3('videos.feed.managePublications')}
              </MoreActionRow>
              {isActive ? (
                <MoreActionRow icon={FiArchive} onClick={() => runAndClose(onArchive)}>
                  {p3('publications.cards.archive')}
                </MoreActionRow>
              ) : (
                <MoreActionRow icon={FiRotateCcw} onClick={() => runAndClose(onReactivate)}>
                  {p3('publications.cards.republish')}
                </MoreActionRow>
              )}
              <MoreActionRow icon={FiTrash2} danger onClick={() => runAndClose(onDelete)}>
                {p3('publications.cards.delete')}
              </MoreActionRow>
            </>
          ) : (
            <MoreActionRow
              icon={FiFlag}
              to={`/support?topic=video&id=${encodeURIComponent(video.id)}`}
              onNavigate={requestClose}
            >
              {p3('videos.feed.report')}
            </MoreActionRow>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function FeedVideoPlayer({ video, active, onActivate }) {
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const videoRef = useRef(null)
  const onActivateRef = useRef(onActivate)
  const wasActiveRef = useRef(false)

  useEffect(() => {
    onActivateRef.current = onActivate
  }, [onActivate])

  const [error, setError] = useState(false)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const src = useCachedMediaUrl(video.videoUrl, {
    kind: 'video',
    mediaId: video.id,
    objectKey: video.objectKey,
    entityType: 'video',
    entityId: video.id,
  })
  const playbackUrl = src || video.videoUrl

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset player when video source changes
    setError(false)
    setPaused(false)
  }, [video.id])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined
    el.muted = muted
    if (active && !paused) {
      const playPromise = el.play()
      if (playPromise?.catch) {
        playPromise.catch(() => setPaused(true))
      }
    } else {
      el.pause()
    }
    return undefined
  }, [active, muted, paused, playbackUrl, video.id])

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      onActivateRef.current?.(video.id)
    }
    wasActiveRef.current = active
  }, [active, video.id])

  function onTapVideo() {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      setPaused(false)
      el.play()?.catch(() => setPaused(true))
    } else {
      setMuted((value) => !value)
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        key={video.id}
        src={playbackUrl}
        poster={video.thumbnailUrl || undefined}
        className="h-full w-full object-cover"
        playsInline
        loop
        muted={muted}
        preload={active ? 'auto' : 'metadata'}
        onClick={onTapVideo}
        onError={() => setError(true)}
      />
      {muted && !error ? (
        <button
          type="button"
          onClick={() => setMuted(false)}
          className="pointer-events-auto absolute left-3 z-10 grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm top-[calc(env(safe-area-inset-top,0px)+3.35rem)]"
          aria-label={p3('videos.feed.unmute')}
        >
          <FiVolumeX />
        </button>
      ) : null}
      {!muted && !error ? (
        <span className="pointer-events-none absolute left-3 z-10 grid size-10 place-items-center rounded-full bg-black/35 text-white/80 top-[calc(env(safe-area-inset-top,0px)+3.35rem)]">
          <FiVolume2 />
        </span>
      ) : null}
      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center text-white">
          <div className="grid max-w-sm gap-2">
            <p className="font-bold">{p3('videos.feed.playErrorTitle')}</p>
            <p className="text-sm text-white/80">{p3('videos.feed.playErrorBody')}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function VideoFeedSlide({ item, index, active }) {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const video = item?.source
  const user = useSelector((state) => state.auth.user)
  const feedBoosts = useSelector((state) => state.stars.feedBoosts)
  const starsBalance = useSelector((state) => state.stars.balance)
  const business = useSelector((state) =>
    video?.businessId
      ? state.businesses.items.find((row) => row.id === video.businessId)
      : null,
  )
  const { requireAccount, promptAccount } = useGuestAction()
  const boostFlow = useStarsBoostFlow()
  const starsEnabled = useStarsModuleEnabled()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const viewed = useRef(false)

  const isOwner = Boolean(
    user?.id && video && (video.ownerId === user.id || business?.ownerId === user.id),
  )
  const videoActive = isActiveVideo(video)
  const activeBoost = video?.id
    ? activeBoostForEntity(feedBoosts, 'video', video.id)
    : null

  useEffect(() => {
    if (!starsEnabled || !isOwner || !moreOpen) return
    dispatch(loadFeedBoosts())
  }, [dispatch, isOwner, moreOpen, starsEnabled])

  useEffect(() => {
    viewed.current = false
  }, [video?.id])

  const handleActivate = useCallback(
    (videoId) => {
      if (viewed.current) return
      viewed.current = true
      dispatch(incrementVideoView({ id: videoId }))
    },
    [dispatch],
  )
  const liked = Boolean(
    user?.id && Array.isArray(video?.likes) && video.likes.includes(user.id),
  )
  const caption = String(video?.caption || '').trim()
  const publisher = {
    id: video?.businessId || business?.id,
    type: 'business',
    name: video?.businessName || business?.name || p3('videos.feed.businessFallback'),
    avatarUrl: business?.logoUrl || '',
    path: video?.businessId ? `/businesses/${video.businessId}` : null,
    ownerId: business?.ownerId,
  }

  const share = useShareEntity({
    title: video?.title || 'MOXT',
    url: buildAbsoluteFeedUrl(video?.id),
    onShared: () => {
      if (video?.id) dispatch(incrementVideoShare({ id: video.id }))
    },
  })

  if (!video?.id) return null

  function handleLike() {
    if (!user?.id) {
      if (requireAccount(p3('videos.feed.guestLike'))) return
      promptAccount(p3('videos.feed.guestLike'))
      return
    }
    dispatch(toggleVideoLike({ videoId: video.id, userId: user.id }))
  }

  function handleMore() {
    if (!user?.id) {
      if (requireAccount(p3('videos.feed.moreActions'))) return
      promptAccount(p3('videos.feed.moreActions'))
      return
    }
    setMoreOpen(true)
  }

  function openBoost() {
    if (!video.businessId) return
    boostFlow.openBoost({
      entityType: 'video',
      entityId: video.id,
      label: video.title || video.id,
      ownerType: 'business',
      ownerId: video.businessId,
    })
  }

  async function handleBoostSelect(durationKey) {
    const target = boostFlow.target
    if (!target) return
    boostFlow.setLoading(true)
    try {
      const outcome = await withStarsBoost({
        entityType: target.entityType,
        entityId: target.entityId,
        durationKey,
        ownerType: target.ownerType,
        ownerId: target.ownerId,
        confirmPaid: boostFlow.confirmPaid,
      })
      if (outcome?.cancelled) return
      dispatch(loadFeedBoosts())
      dispatch(
        addToast({
          title: t('stars.boost.successTitle'),
          message: t('stars.boost.successBody'),
          tone: 'success',
        }),
      )
      boostFlow.closeBoost()
    } catch (error) {
      dispatch(
        addToast({
          title:
            error instanceof StarsInsufficientError
              ? t('stars.insufficientTitle')
              : t('stars.boost.failedTitle'),
          message:
            error instanceof StarsInsufficientError
              ? t('stars.insufficientBody')
              : error?.message || t('stars.boost.failedBody'),
          tone: 'error',
        }),
      )
    } finally {
      boostFlow.setLoading(false)
    }
  }

  function handleArchive() {
    dispatch(moderateVideo({ id: video.id, status: 'archived' }))
    dispatch(
      addToast({
        title: p3('videos.feed.archivedTitle'),
        message: p3('videos.feed.archivedBody'),
        tone: 'success',
      }),
    )
  }

  function handleReactivate() {
    dispatch(moderateVideo({ id: video.id, status: 'active' }))
    dispatch(
      addToast({
        title: p3('videos.feed.republishedTitle'),
        message: p3('videos.feed.republishedBody'),
        tone: 'success',
      }),
    )
  }

  function handleDeleteConfirm() {
    if (!user?.id) return
    dispatch(deleteVideo({ id: video.id, ownerId: user.id }))
    setDeleteOpen(false)
    dispatch(
      addToast({
        title: p3('videos.feed.deletedTitle'),
        message: p3('videos.feed.deletedBody'),
        tone: 'success',
      }),
    )
  }

  return (
    <FeedSlideShell
      index={index}
      item={item}
      publisher={publisher}
      title={video.title}
      caption={caption || null}
      captionLines={1}
      showActions={false}
      active={active}
      metaExtra={
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-white/55">
          <FiEye className="text-sm" aria-hidden />
          {p3('videos.feed.views', { count: formatCount(video.viewCount) })}
        </p>
      }
    >
      <FeedVideoPlayer video={video} active={active} onActivate={handleActivate} />
      {active ? (
        <VideoFeedActions
          video={video}
          item={item}
          liked={liked}
          onLike={handleLike}
          onComment={() => setCommentsOpen(true)}
          onShare={share}
          onMore={handleMore}
        />
      ) : null}
      <VideoCommentsSheet
        video={video}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
      <VideoMoreSheet
        video={video}
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        isOwner={isOwner}
        isActive={videoActive}
        activeBoost={starsEnabled ? activeBoost : null}
        onBoost={starsEnabled ? openBoost : undefined}
        starsEnabled={starsEnabled}
        onArchive={handleArchive}
        onReactivate={handleReactivate}
        onDelete={() => setDeleteOpen(true)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title={p3('publications.cards.deleteConfirmTitle')}
        description={p3('publications.cards.deleteConfirmDescription')}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
      <BoostPublicationSheet
        open={Boolean(boostFlow.target)}
        entityType={boostFlow.target?.entityType}
        entityLabel={boostFlow.target?.label || ''}
        loading={boostFlow.loading}
        config={starsBalance?.config}
        onClose={boostFlow.closeBoost}
        onSelect={handleBoostSelect}
      />
      <StarsSpendConfirm
        open={Boolean(boostFlow.pendingQuote)}
        quote={boostFlow.pendingQuote}
        onCancel={boostFlow.cancelSpend}
        onConfirm={boostFlow.acceptSpend}
      />
    </FeedSlideShell>
  )
}
