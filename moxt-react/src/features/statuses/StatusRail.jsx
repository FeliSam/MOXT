/**
 * Bandeau horizontal des statuts actifs, à placer entre l'en-tête/filtres et
 * le fil de posts. Ma bulle en premier (avec bouton "+" pour publier),
 * suivie des auteurs ayant des statuts non vus puis déjà vus.
 * Chaque bulle montre la miniature du dernier élément publié (image, vidéo ou texte),
 * avec repli sur l'avatar / le logo.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { StatusRing } from './StatusRing'
import { StatusViewer } from './StatusViewer'
import { StatusComposer } from './StatusComposer'
import { groupActiveStatusesByAuthor } from './statusSelectors'
import { useLanguage } from '../../contexts/useLanguage'
import { supabase } from '../../services/supabaseClient'
import { receiveRemoteStatus, removeRemoteStatus } from './statusesSlice'
import { statusFromRemoteRow } from './statusRemote'
import { refreshStatusesData, hydrateStatusRailIfEmpty } from './statusSync'
import { writeStatusRailCache } from './statusRailCache'
import { pickStatusThumb } from './statusThumb'

/** Emprise visuelle unique (anneau inclus) pour aligner toutes les bulles. */
const BUBBLE_OUTER = 'size-[3.75rem]'
const AVATAR_INNER = 'size-12'

function AvatarFace({ src, initial, shapeClass, muted = false }) {
  if (src) {
    return <img src={src} alt="" className={`${AVATAR_INNER} object-cover ${shapeClass}`} />
  }
  return (
    <span
      className={`grid ${AVATAR_INNER} place-items-center text-sm font-black ${shapeClass} ${
        muted
          ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
          : 'bg-brand-600 text-white'
      }`}
    >
      {initial}
    </span>
  )
}

/**
 * Miniature du dernier élément (image / vidéo / texte) dans la bulle.
 * En cas d’échec de chargement : miniature → média d’origine → avatar / logo (`fallback`).
 */
function StatusThumbFace({ thumb, fallback }) {
  const [stage, setStage] = useState(0)
  const face = `${AVATAR_INNER} rounded-full`

  if (thumb.kind === 'text') {
    return (
      <span
        data-testid="status-thumb-text"
        className={`grid ${face} place-items-center overflow-hidden px-1 ${
          thumb.background ? '' : 'bg-gradient-to-br from-brand-800 via-brand-600 to-[var(--app-cobalt)]'
        }`}
        style={thumb.background ? { background: thumb.background } : undefined}
      >
        <span className="line-clamp-3 break-words text-center text-[8.5px] font-bold leading-[1.15] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
          {thumb.text}
        </span>
      </span>
    )
  }

  const sources = [thumb.src, thumb.fullSrc].filter(
    (src, index, list) => src && list.indexOf(src) === index,
  )
  const src = sources[stage]
  const next = () => setStage((value) => value + 1)

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable="false"
        data-testid={`status-thumb-${thumb.kind}`}
        onError={next}
        className={`${face} object-cover`}
      />
    )
  }

  // Vidéo sans poster : première frame, sans lecture automatique ni son.
  if (thumb.kind === 'video' && thumb.videoSrc && stage <= sources.length) {
    return (
      <video
        src={`${thumb.videoSrc.split('#')[0]}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        tabIndex={-1}
        aria-hidden="true"
        data-testid="status-thumb-video"
        onError={next}
        className={`${face} pointer-events-none object-cover`}
      />
    )
  }

  return fallback
}

function StatusBubble({
  label,
  onOpen,
  avatarUrl,
  initial,
  shapeClass = 'rounded-full',
  hasStatus = false,
  hasUnseen = false,
  badge = null,
  addLabel = null,
  onAdd = null,
  mutedAvatar = false,
  thumb = null,
  tone = 'light',
}) {
  const feed = tone === 'feed'
  const avatarFace = <AvatarFace src={avatarUrl} initial={initial} shapeClass={shapeClass} />
  return (
    <div className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5 text-center">
      <button type="button" onClick={onOpen} className="relative grid place-items-center">
        <span className={`relative grid ${BUBBLE_OUTER} place-items-center overflow-visible`}>
          {hasStatus ? (
            <StatusRing hasStatus hasUnseen={hasUnseen} className="size-full">
              {thumb ? (
                <StatusThumbFace key={thumb.key} thumb={thumb} fallback={avatarFace} />
              ) : (
                avatarFace
              )}
            </StatusRing>
          ) : (
            <AvatarFace
              src={avatarUrl}
              initial={initial}
              shapeClass={shapeClass}
              muted={mutedAvatar}
            />
          )}
          {badge ? (
            <span className="pointer-events-none absolute bottom-0 left-1/2 z-[1] -translate-x-1/2 rounded-md bg-brand-700 px-1.5 py-px text-[8px] font-black uppercase tracking-wide text-white shadow-sm ring-2 ring-[var(--app-bg)] dark:bg-brand-600">
              {badge}
            </span>
          ) : null}
          {onAdd ? (
            <span
              role="button"
              aria-label={addLabel}
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className={`absolute bottom-0 right-0 z-[1] grid size-5 place-items-center rounded-full bg-brand-700 text-white shadow-sm ring-2 dark:bg-brand-600 ${
                feed ? 'ring-black' : 'ring-[var(--app-bg)]'
              }`}
            >
              <FiPlus className="text-[11px]" />
            </span>
          ) : null}
        </span>
      </button>
      <span
        className={`line-clamp-1 w-full text-[11px] font-semibold leading-tight ${
          feed ? 'text-white/80' : 'text-[var(--app-text-muted)]'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

export function StatusRail({
  hideWhenNoCommunity = false,
  composerOpen: composerOpenProp,
  onComposerOpenChange,
  renderComposer = true,
  tone = 'light',
}) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
  const store = useStore()
  const user = useSelector((s) => s.auth.user)
  const ownBusiness = useSelector((s) =>
    (s.businesses?.items ?? []).find((item) => item.ownerId === user?.id),
  )
  const statuses = useSelector((s) => s.statuses?.items ?? [])
  const [viewerIndex, setViewerIndex] = useState(null)
  const [composerOpenInternal, setComposerOpenInternal] = useState(false)
  const composerOpen = composerOpenProp ?? composerOpenInternal
  function setComposerOpen(next) {
    if (onComposerOpenChange) onComposerOpenChange(next)
    else setComposerOpenInternal(next)
  }

  const groups = useMemo(
    () => groupActiveStatusesByAuthor(statuses, user?.id),
    [statuses, user?.id],
  )
  const myGroup = groups.find((g) => g.authorId === user?.id && !g.businessId)
  const myBusinessGroup = ownBusiness
    ? groups.find((g) => g.businessId === ownBusiness.id)
    : null
  const isMine = (g) =>
    (g.authorId === user?.id && !g.businessId) ||
    (ownBusiness && g.businessId === ownBusiness.id)
  const officialGroups = groups.filter((g) => g.isOfficial && !isMine(g))
  const otherGroups = groups.filter((g) => !isMine(g) && !g.isOfficial)

  const channelRef = useRef(null)

  useLayoutEffect(() => {
    if (!user?.id) return
    hydrateStatusRailIfEmpty(store.getState, store.dispatch)
  }, [store, user?.id])

  const persistRail = () => {
    const uid = store.getState().auth.user?.id
    const items = store.getState().statuses?.items
    if (uid && Array.isArray(items) && items.length) writeStatusRailCache(uid, items)
  }

  useEffect(() => {
    if (!supabase || !user?.id) return undefined
    const timer = window.setTimeout(() => {
      const channel = supabase
        .channel(`statuses-live-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'statuses' },
          (payload) => {
            const remote = statusFromRemoteRow(payload.new)
            if (!remote?.id) return
            dispatch(receiveRemoteStatus(remote))
            persistRail()
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'statuses' },
          (payload) => {
            const remote = statusFromRemoteRow(payload.new)
            if (!remote?.id) return
            dispatch(receiveRemoteStatus(remote))
            persistRail()
          },
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'statuses' },
          (payload) => {
            if (!payload.old?.id) return
            dispatch(removeRemoteStatus(payload.old.id))
            persistRail()
          },
        )
        .subscribe()
      channelRef.current = channel
    }, 400)
    return () => {
      window.clearTimeout(timer)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [dispatch, store, user?.id])

  useEffect(() => {
    if (!user?.id) return undefined
    dispatch(refreshStatusesData())
    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      dispatch(refreshStatusesData())
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [dispatch, user?.id])

  if (!user) return null
  if (hideWhenNoCommunity && groups.length === 0 && !composerOpen) return null

  return (
    <div className="min-w-0 max-w-full" data-testid={tone === 'feed' ? 'feed-status-rail' : 'status-rail'}>
      <div
        className={`scrollbar-hidden flex w-full min-w-0 touch-pan-x items-start gap-3 overflow-x-auto overflow-y-visible overscroll-x-contain py-1.5 sm:gap-3.5 ${
          tone === 'feed' ? 'px-2.5' : '-mx-4 px-4'
        }`}
      >
        <StatusBubble
          label={t('status.rail.you')}
          onOpen={() => (myGroup ? setViewerIndex(groups.indexOf(myGroup)) : setComposerOpen(true))}
          avatarUrl={user.avatarUrl}
          initial={user.firstName?.charAt(0)}
          hasStatus={Boolean(myGroup)}
          hasUnseen={Boolean(myGroup?.hasUnseen)}
          mutedAvatar={!myGroup}
          thumb={myGroup ? pickStatusThumb(myGroup) : null}
          addLabel={t('status.rail.addYours')}
          onAdd={() => setComposerOpen(true)}
          tone={tone}
        />

        {myBusinessGroup ? (
          <StatusBubble
            label={myBusinessGroup.authorName}
            onOpen={() => setViewerIndex(groups.indexOf(myBusinessGroup))}
            avatarUrl={myBusinessGroup.authorAvatarUrl}
            initial={myBusinessGroup.authorName?.charAt(0)}
            shapeClass="rounded-2xl"
            hasStatus
            hasUnseen={myBusinessGroup.hasUnseen}
            thumb={pickStatusThumb(myBusinessGroup)}
            tone={tone}
          />
        ) : null}

        {officialGroups.map((group) => (
          <StatusBubble
            key={`${group.authorId}:${group.businessId || ''}`}
            label={group.authorName}
            onOpen={() => setViewerIndex(groups.indexOf(group))}
            avatarUrl={group.authorAvatarUrl}
            initial={group.authorName?.charAt(0)}
            shapeClass={group.businessId ? 'rounded-2xl' : 'rounded-full'}
            hasStatus
            hasUnseen={group.hasUnseen}
            thumb={pickStatusThumb(group)}
            badge="MOXT"
            tone={tone}
          />
        ))}

        {otherGroups.map((group) => (
          <StatusBubble
            key={`${group.authorId}:${group.businessId || ''}`}
            label={group.authorName}
            onOpen={() => setViewerIndex(groups.indexOf(group))}
            avatarUrl={group.authorAvatarUrl}
            initial={group.authorName?.charAt(0)}
            shapeClass={group.businessId ? 'rounded-2xl' : 'rounded-full'}
            hasStatus
            hasUnseen={group.hasUnseen}
            thumb={pickStatusThumb(group)}
            tone={tone}
          />
        ))}

        {viewerIndex !== null ? (
          <StatusViewer
            groups={groups}
            initialGroupIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        ) : null}

        {renderComposer && composerOpen ? (
          <StatusComposer onClose={() => setComposerOpen(false)} />
        ) : null}
      </div>
    </div>
  )
}
