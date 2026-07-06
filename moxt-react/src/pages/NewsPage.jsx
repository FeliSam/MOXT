import { useMemo, useState } from 'react'
import { FiEdit3, FiRss } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { FeedPostCard } from '../components/ui/FeedPostCard'
import { PageHeader } from '../components/ui/PageHeader'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { createPost } from '../features/posts/postsSlice'
import { SOURCE_TYPE_LABELS } from '../features/posts/postTemplates'

const FILTER_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'listing', label: 'Annonces' },
  { key: 'job', label: 'Jobs' },
  { key: 'parcel', label: 'Colis' },
  { key: 'event', label: 'Événements' },
  { key: 'business', label: 'Entreprises' },
  { key: 'free', label: 'Posts libres' },
]

export function NewsPage() {
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)
  const posts = useSelector((s) => s.posts?.items ?? [])

  const [activeFilter, setActiveFilter] = useState('all')
  const [showShareModal, setShowShareModal] = useState(false)

  const filtered = useMemo(
    () =>
      activeFilter === 'all'
        ? posts
        : posts.filter((p) => p.sourceType === activeFilter),
    [posts, activeFilter],
  )

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Communauté"
        title="Fil d'actualité"
        description="Découvrez les dernières publications de la communauté MOXT."
        stats={[{ label: 'Publications', value: posts.length }]}
        actions={
          user && (
            <Button icon={FiEdit3} onClick={() => setShowShareModal(true)}>
              Écrire un post
            </Button>
          )
        }
      />

      {/* Filtres par type */}
      <div className="flex items-center gap-6 overflow-x-auto border-b border-[var(--app-border)] scrollbar-hidden">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={`relative shrink-0 pb-3 text-sm font-bold transition-colors ${
              activeFilter === key
                ? 'text-[var(--app-text)]'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
            }`}
          >
            {label}
            {activeFilter === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
            )}
          </button>
        ))}
      </div>

      {/* Liste de posts */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FiRss}
          tone="search"
          title="Aucun post pour l'instant"
          description={
            activeFilter === 'all'
              ? 'Soyez le premier à partager quelque chose avec la communauté !'
              : `Aucun post de type "${SOURCE_TYPE_LABELS[activeFilter]}" pour l'instant.`
          }
          action={
            user && (
              <Button icon={FiEdit3} onClick={() => setShowShareModal(true)}>
                Écrire un post
              </Button>
            )
          }
        />
      )}

      {/* Modal post libre */}
      {showShareModal && (
        <ShareToFeedModal
          sourceType="free"
          sourceId={null}
          sourceData={{}}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
