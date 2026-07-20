import { useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { StatusRing } from './StatusRing'
import { StatusViewer } from './StatusViewer'
import { StatusComposer } from './StatusComposer'
import { groupActiveStatusesByAuthor } from './statusSelectors'
import { useLanguage } from '../../contexts/useLanguage'

function AuthorBubble({ group, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
    >
      <StatusRing hasStatus hasUnseen={group.hasUnseen} size={14}>
        {group.authorAvatarUrl ? (
          <img src={group.authorAvatarUrl} alt="" className="size-12 rounded-full object-cover" />
        ) : (
          <span className="grid size-12 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">
            {group.authorName?.charAt(0)}
          </span>
        )}
      </StatusRing>
      <span className="w-full truncate text-[11px] font-semibold text-[var(--app-text-muted)]">
        {group.authorName}
      </span>
    </button>
  )
}

/**
 * Bandeau horizontal des statuts actifs, à placer entre l'en-tête/filtres et
 * le fil de posts. Ma bulle en premier (avec bouton "+" pour publier),
 * suivie des auteurs ayant des statuts non vus puis déjà vus.
 */
export function StatusRail() {
  const { t } = useLanguage()
  const user = useSelector((s) => s.auth.user)
  const statuses = useSelector((s) => s.statuses?.items ?? [])
  const [viewerIndex, setViewerIndex] = useState(null)
  const [composerOpen, setComposerOpen] = useState(false)

  const groups = useMemo(
    () => groupActiveStatusesByAuthor(statuses, user?.id),
    [statuses, user?.id],
  )
  const myGroup = groups.find((g) => g.authorId === user?.id)
  const officialGroups = groups.filter(
    (g) => g.isOfficial && g.authorId !== user?.id,
  )
  const otherGroups = groups.filter((g) => g.authorId !== user?.id && !g.isOfficial)

  if (!user) return null

  return (
    <div className="scrollbar-hidden -mx-4 flex touch-pan-x gap-4 overflow-x-auto px-4 py-2 sm:gap-5">
      {officialGroups.map((group) => (
        <AuthorBubble
          key={group.authorId}
          group={group}
          onOpen={() => setViewerIndex(groups.indexOf(group))}
        />
      ))}

      <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
        <button
          type="button"
          onClick={() => (myGroup ? setViewerIndex(groups.indexOf(myGroup)) : setComposerOpen(true))}
          className="relative"
        >
          {myGroup ? (
            <StatusRing hasStatus hasUnseen={myGroup.hasUnseen} size={14}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">
                  {user.firstName?.charAt(0)}
                </span>
              )}
            </StatusRing>
          ) : user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="size-12 rounded-full object-cover" />
          ) : (
            <span className="grid size-12 place-items-center rounded-full bg-[var(--app-surface-muted)] text-sm font-black text-[var(--app-text-muted)]">
              {user.firstName?.charAt(0)}
            </span>
          )}
          <span
            role="button"
            aria-label={t('status.rail.addYours')}
            onClick={(e) => {
              e.stopPropagation()
              setComposerOpen(true)
            }}
            className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-brand-700 text-white shadow-sm ring-2 ring-[var(--app-surface)] dark:bg-brand-600"
          >
            <FiPlus className="text-[11px]" />
          </span>
        </button>
        <span className="w-full truncate text-[11px] font-semibold text-[var(--app-text-muted)]">
          {t('status.rail.you')}
        </span>
      </div>

      {otherGroups.map((group) => (
        <AuthorBubble
          key={group.authorId}
          group={group}
          onOpen={() => setViewerIndex(groups.indexOf(group))}
        />
      ))}

      {viewerIndex !== null ? (
        <StatusViewer
          groups={groups}
          initialGroupIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}

      {composerOpen ? <StatusComposer onClose={() => setComposerOpen(false)} /> : null}
    </div>
  )
}
