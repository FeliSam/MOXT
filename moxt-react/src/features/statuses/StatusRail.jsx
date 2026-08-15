/**
 * Bandeau horizontal des statuts actifs, à placer entre l'en-tête/filtres et
 * le fil de posts. Ma bulle en premier (avec bouton "+" pour publier),
 * suivie des auteurs ayant des statuts non vus puis déjà vus.
 */
import { useEffect, useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { StatusRing } from './StatusRing'
import { StatusViewer } from './StatusViewer'
import { StatusComposer } from './StatusComposer'
import { groupActiveStatusesByAuthor } from './statusSelectors'
import { useLanguage } from '../../contexts/useLanguage'
import { supabase } from '../../services/supabaseClient'
import { receiveRemoteStatus, removeRemoteStatus } from './statusesSlice'
import { statusFromRemoteRow } from './statusRemote'
import { refreshStatusesData } from './statusSync'

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
}) {
  return (
    <div className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5 text-center">
      <button type="button" onClick={onOpen} className="relative grid place-items-center">
        <span className={`relative grid ${BUBBLE_OUTER} place-items-center`}>
          {hasStatus ? (
            <StatusRing hasStatus hasUnseen={hasUnseen} size={14}>
              <AvatarFace src={avatarUrl} initial={initial} shapeClass={shapeClass} />
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
              className="absolute bottom-0 right-0 z-[1] grid size-5 place-items-center rounded-full bg-brand-700 text-white shadow-sm ring-2 ring-[var(--app-bg)] dark:bg-brand-600"
            >
              <FiPlus className="text-[11px]" />
            </span>
          ) : null}
        </span>
      </button>
      <span className="line-clamp-1 w-full text-[11px] font-semibold leading-tight text-[var(--app-text-muted)]">
        {label}
      </span>
    </div>
  )
}

export function StatusRail({
  hideWhenNoCommunity: _hideWhenNoCommunity = false,
  composerOpen: composerOpenProp,
  onComposerOpenChange,
  renderComposer = true,
}) {
  const { t } = useLanguage()
  const dispatch = useDispatch()
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

  useEffect(() => {
    if (!supabase || !user?.id) return undefined
    const channel = supabase
      .channel('statuses-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'statuses' },
        (payload) => {
          const remote = statusFromRemoteRow(payload.new)
          if (remote?.id) dispatch(receiveRemoteStatus(remote))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'statuses' },
        (payload) => {
          const remote = statusFromRemoteRow(payload.new)
          if (remote?.id) dispatch(receiveRemoteStatus(remote))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'statuses' },
        (payload) => {
          if (payload.old?.id) dispatch(removeRemoteStatus(payload.old.id))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch, user?.id])

  useEffect(() => {
    if (!user?.id) return undefined
    dispatch(refreshStatusesData())
    return undefined
  }, [dispatch, user?.id])

  if (!user) return null

  return (
    <div className="min-w-0">
      <div className="scrollbar-hidden -mx-4 flex touch-pan-x items-start gap-3 overflow-x-auto px-4 py-1 sm:gap-3.5">
        <StatusBubble
          label={t('status.rail.you')}
          onOpen={() => (myGroup ? setViewerIndex(groups.indexOf(myGroup)) : setComposerOpen(true))}
          avatarUrl={user.avatarUrl}
          initial={user.firstName?.charAt(0)}
          hasStatus={Boolean(myGroup)}
          hasUnseen={Boolean(myGroup?.hasUnseen)}
          mutedAvatar={!myGroup}
          addLabel={t('status.rail.addYours')}
          onAdd={() => setComposerOpen(true)}
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
            badge="MOXT"
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
