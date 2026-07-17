import { useMemo, useState } from 'react'
import { FiEdit3, FiRss } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  canPublishContent,
  isEmailVerified,
  isPhoneVerified,
  isValidRussianPhone,
} from '@moxt/shared/auth/userSecurity.js'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { FeedPostCard } from '../components/ui/FeedPostCard'
import { PageHeader } from '../components/ui/PageHeader'
import { ShareToFeedModal } from '../components/ui/ShareToFeedModal'
import { useLanguage } from '../contexts/useLanguage'
import { useSecurityGate } from '../features/security/useSecurityGate'
import { sortPostsByPublishedAt } from '../features/posts/postSortUtils'
import { phase3Text } from '../i18n/phase3I18n'

const FILTER_KEYS = ['all', 'listing', 'job', 'parcel', 'event', 'business', 'free']

export function NewsPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const p3 = (key, vars) => phase3Text(t, key, vars)
  const user = useSelector((s) => s.auth.user)
  const posts = useSelector((s) => s.posts?.items ?? [])
  const { requirePublish } = useSecurityGate()

  const [activeFilter, setActiveFilter] = useState('all')
  const [showShareModal, setShowShareModal] = useState(false)

  function openComposer() {
    if (canPublishContent(user)) {
      setShowShareModal(true)
      return
    }
    requirePublish()
    if (
      isPhoneVerified(user) &&
      isValidRussianPhone(user?.phone) &&
      !isEmailVerified(user)
    ) {
      navigate('/security?verify=email')
    }
  }

  const publishedPosts = useMemo(
    () => posts.filter((p) => p.status === 'published'),
    [posts],
  )

  const filtered = useMemo(() => {
    const base =
      activeFilter === 'all'
        ? publishedPosts
        : publishedPosts.filter((p) => p.sourceType === activeFilter)
    return sortPostsByPublishedAt(base)
  }, [activeFilter, publishedPosts])

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow={p3('news.eyebrow')}
        title={p3('news.title')}
        description={p3('news.description')}
        stats={[{ label: p3('news.stats.publications'), value: publishedPosts.length }]}
        actions={
          user && (
            <Button icon={FiEdit3} onClick={openComposer}>
              {p3('news.writePost')}
            </Button>
          )
        }
      />

      {/* Filtres + fil centré, une publication par ligne */}
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        <div className="flex items-center gap-6 overflow-x-auto border-b border-[var(--app-border)] scrollbar-hidden">
          {FILTER_KEYS.map((key) => (
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
              {p3(`news.filters.${key}`)}
              {activeFilter === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-5 sm:gap-6">
            {filtered.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiRss}
            tone="search"
            title={p3('news.empty.title')}
            description={
              activeFilter === 'all'
                ? p3('news.empty.description')
                : p3('news.empty.type', { type: p3(`news.filters.${activeFilter}`) })
            }
            action={
              user && (
                <Button icon={FiEdit3} onClick={openComposer}>
                  {p3('news.writePost')}
                </Button>
              )
            }
          />
        )}
      </div>

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
