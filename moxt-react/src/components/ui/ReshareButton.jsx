import { useState } from 'react'
import { FiCheck, FiRepeat } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { ShareToFeedModal } from './ShareToFeedModal'

/**
 * Bouton "Republier" affiché sur les pages de détail.
 * Seul le propriétaire de l'élément peut le republier, et une seule fois.
 */
export function ReshareButton({ sourceType, sourceId, sourceData, className = '' }) {
  const user = useSelector((s) => s.auth.user)
  const [open, setOpen] = useState(false)

  const isOwner = user && (sourceData?.ownerId === user.id || sourceData?.userId === user.id)

  const alreadyShared = useSelector((s) =>
    (s.posts?.items ?? []).some(
      (p) => p.sourceId === sourceId && p.authorId === user?.id,
    ),
  )

  if (!user || !isOwner) return null

  if (alreadyShared) {
    return (
      <span
        className={`flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500 ${className}`}
      >
        <FiCheck className="text-sm" /> Déjà publié
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:border-emerald-500 ${className}`}
      >
        <FiRepeat className="text-sm" /> Republier
      </button>
      {open && (
        <ShareToFeedModal
          sourceType={sourceType}
          sourceId={sourceId}
          sourceData={sourceData}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
